/**
 * Country-independent photo analysis for the photo checker. Runs entirely in
 * the browser (MediaPipe Face Landmarker, Face Detector and Selfie Segmenter,
 * loaded on demand); the photo never leaves the device.
 *
 * `analyzePhoto()` measures the image without any knowledge of a country, and
 * `evaluatePhoto()` compares those measurements with whatever rules PixPassport
 * publishes for it. A rule the API doesn't publish isn't checked, so adding a
 * country needs no change here.
 */

import type { FaceDetector, FaceLandmarker, ImageSegmenter, NormalizedLandmark } from "@mediapipe/tasks-vision";

import type { PhotoRequirements } from "@/lib/api/types";

type NumericRange = { min?: number | null; max?: number | null; recommended?: number | null };

export type CheckStatus = "pass" | "warning" | "fail" | "manual" | "unavailable";
/** verified = exact reading of the file; estimate = computer vision; manual = needs a human. */
export type CheckBasis = "verified" | "estimate" | "manual";

export interface PhotoCheck {
  id: string;
  label: string;
  basis: CheckBasis;
  status: CheckStatus;
  measured?: string;
  requirement?: string;
  detail?: string;
  suggestion?: string;
}

/** An error whose message is written for people and can be shown as-is. */
export class CheckerError extends Error {}

/* ========================================================================== */
/* Configuration (tooling only — no country rules live here)                  */
/* ========================================================================== */

/** Keep in sync with the @mediapipe/tasks-vision version in package.json. */
const MEDIAPIPE_VERSION = "1.0.1";
const MEDIAPIPE_WASM_URL = `https://cdn.jsdelivr.net/npm/@mediapipe/tasks-vision@${MEDIAPIPE_VERSION}/wasm`;
const MODEL_URLS = {
  landmarker:
    "https://storage.googleapis.com/mediapipe-models/face_landmarker/face_landmarker/float16/1/face_landmarker.task",
  detector:
    "https://storage.googleapis.com/mediapipe-models/face_detector/blaze_face_short_range/float16/1/blaze_face_short_range.tflite",
  segmenter:
    "https://storage.googleapis.com/mediapipe-models/image_segmenter/selfie_segmenter/float16/1/selfie_segmenter.tflite",
};

/** Refuse to decode absurdly large uploads (protects low-memory devices). */
const MAX_DECODE_BYTES = 40 * 1024 * 1024;
const FACE_CANVAS_MAX_EDGE = 1280;
const BACKGROUND_CANVAS_MAX_EDGE = 384;
const MIN_DETECTION_CONFIDENCE = 0.5;

/**
 * Crown sits above MediaPipe's forehead landmark (#10). The API publishes the
 * forehead→crown multiplier per country in `auto_crop_config`; this
 * anthropometric average is only used if a country omits it.
 */
const FALLBACK_HEAD_TOP_MULTIPLIER = 1.24;

/**
 * Margins of error for the computer-vision estimates. A reading this close to
 * a limit is reported as a warning instead of a hard fail. These describe the
 * accuracy of the measurement, not any country's rules.
 */
const ESTIMATE_TOLERANCE = {
  framingPct: 2,
  aspectRatioPass: 0.01,
  aspectRatioWarn: 0.03,
  rollDeg: { warn: 4, fail: 8 },
  yawDeg: { warn: 8, fail: 15 },
  pitchDeg: { warn: 15 },
  eyeBlink: { warn: 0.4, fail: 0.55 },
  jawOpen: { warn: 0.12, fail: 0.25 },
  lipGapRatio: { warn: 0.025, fail: 0.045 },
  smile: { warn: 0.3, fail: 0.5 },
  colorViolation: 6,
  shadowDepth: { warn: 10, fail: 18 },
  unevenness: { warn: 6, fail: 12 },
  texture: { warn: 2.5, fail: 5 },
} as const;

/** Generic color vocabulary used to interpret the API's background color text. */
interface ColorSpec {
  label: string;
  /** Reference color shown next to the measured background. */
  swatch: string;
  minL?: number;
  maxL?: number;
  minChroma?: number;
  maxChroma?: number;
  hue?: [number, number];
}

const BACKGROUND_COLOR_VOCABULARY: Array<{ pattern: RegExp; spec: ColorSpec }> = [
  { pattern: /off[\s-]?white|cream|ivory/, spec: { label: "off-white / cream", swatch: "rgb(246 241 226)", minL: 82, maxChroma: 20 } }, // design-tokens-ignore-line
  { pattern: /white/, spec: { label: "white", swatch: "rgb(255 255 255)", minL: 88, maxChroma: 10 } }, // design-tokens-ignore-line
  { pattern: /(light|pale)\s*gr[ae]y/, spec: { label: "light gray", swatch: "rgb(214 216 218)", minL: 70, maxL: 95, maxChroma: 10 } }, // design-tokens-ignore-line
  { pattern: /gr[ae]y/, spec: { label: "gray", swatch: "rgb(170 172 175)", minL: 45, maxL: 92, maxChroma: 10 } }, // design-tokens-ignore-line
  { pattern: /(light|pale|sky)\s*blue/, spec: { label: "light blue", swatch: "rgb(170 204 236)", minL: 55, minChroma: 10, hue: [220, 320] } }, // design-tokens-ignore-line
  { pattern: /blue/, spec: { label: "blue", swatch: "rgb(46 94 178)", minL: 25, minChroma: 15, hue: [220, 320] } }, // design-tokens-ignore-line
];


/* ========================================================================== */
/* MediaPipe model lifecycle (lazy, shared, reference counted)                */
/* ========================================================================== */

interface VisionModels {
  landmarker: FaceLandmarker;
  detector: FaceDetector | null;
  segmenter: ImageSegmenter | null;
  /** Set once the shared models have been released; analyses must not use them after that. */
  closed: boolean;
}

let visionModelsPromise: Promise<VisionModels> | null = null;
let visionModelUsers = 0;

async function createVisionModels(): Promise<VisionModels> {
  const vision = await import("@mediapipe/tasks-vision");
  const fileset = await vision.FilesetResolver.forVisionTasks(MEDIAPIPE_WASM_URL);
  // CPU delegate: single still images are fast enough and it avoids WebGL quirks (notably Safari).
  const landmarkerPending = vision.FaceLandmarker.createFromOptions(fileset, {
    baseOptions: { modelAssetPath: MODEL_URLS.landmarker, delegate: "CPU" },
    runningMode: "IMAGE",
    numFaces: 2,
    outputFaceBlendshapes: true,
  });
  // Detector and segmenter are optional extras; the landmarker alone still gives a result.
  const optionalPending = Promise.all([
    vision.FaceDetector.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URLS.detector, delegate: "CPU" },
      runningMode: "IMAGE",
      minDetectionConfidence: MIN_DETECTION_CONFIDENCE,
    }).catch(() => null),
    vision.ImageSegmenter.createFromOptions(fileset, {
      baseOptions: { modelAssetPath: MODEL_URLS.segmenter, delegate: "CPU" },
      runningMode: "IMAGE",
      outputConfidenceMasks: true,
      outputCategoryMask: false,
    }).catch(() => null),
  ]);
  let landmarker: FaceLandmarker;
  try {
    landmarker = await landmarkerPending;
  } catch (err) {
    // Don't leak the optional models that did load.
    void optionalPending.then(([detector, segmenter]) => {
      detector?.close();
      segmenter?.close();
    });
    throw err;
  }
  const [detector, segmenter] = await optionalPending;
  return { landmarker, detector, segmenter, closed: false };
}

function getVisionModels(): Promise<VisionModels> {
  if (!visionModelsPromise) {
    visionModelsPromise = createVisionModels().catch((err) => {
      visionModelsPromise = null;
      throw err;
    });
  }
  return visionModelsPromise;
}

export function retainVisionModels() {
  visionModelUsers += 1;
}

export function releaseVisionModels() {
  visionModelUsers = Math.max(0, visionModelUsers - 1);
  if (visionModelUsers === 0 && visionModelsPromise) {
    const pending = visionModelsPromise;
    visionModelsPromise = null;
    pending
      .then((models) => {
        models.closed = true;
        models.landmarker.close();
        models.detector?.close();
        models.segmenter?.close();
      })
      .catch(() => {});
  }
}

/* ========================================================================== */
/* Image analysis (country independent)                                       */
/* ========================================================================== */

type FileFormat = "jpeg" | "png" | "webp" | "gif" | "bmp" | "heic" | "avif" | "unknown";
export type AnalysisStage = "decoding" | "models" | "face" | "background";

interface FaceBox {
  x0: number;
  y0: number;
  x1: number;
  y1: number;
}

interface FaceMeasurements {
  landmarks: NormalizedLandmark[];
  box: FaceBox;
  /** All y values are normalized 0–1 from the top edge. */
  foreheadY: number;
  chinY: number;
  eyeY: number;
  rollDeg: number;
  yawDeg: number;
  pitchDeg: number;
  lipGapRatio: number;
  blendshapes: Record<string, number>;
}

interface BackgroundMeasurements {
  method: "segmentation" | "border-sample";
  sampleFraction: number;
  /** Mean sRGB of the background pixels, for display. */
  meanRgb: [number, number, number];
  lightness: number;
  chroma: number;
  hue: number;
  unevenness: number;
  shadowDepth: number;
  texture: number;
}

export interface ImageAnalysis {
  file: { name: string; sizeBytes: number; format: FileFormat; width: number; height: number };
  /** null when the AI models could not load. */
  faceCount: number | null;
  detectionConfidence: number | null;
  detectorBoxes: FaceBox[];
  face: FaceMeasurements | null;
  background: BackgroundMeasurements | null;
  modelError: string | null;
}

function detectFormat(bytes: Uint8Array): FileFormat {
  const ascii = (start: number, end: number) => String.fromCharCode(...bytes.slice(start, end));
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes[2] === 0xff) return "jpeg";
  if (bytes[0] === 0x89 && ascii(1, 4) === "PNG") return "png";
  if (ascii(0, 4) === "RIFF" && ascii(8, 12) === "WEBP") return "webp";
  if (ascii(0, 4) === "GIF8") return "gif";
  if (bytes[0] === 0x42 && bytes[1] === 0x4d) return "bmp";
  if (ascii(4, 8) === "ftyp") {
    const brand = ascii(8, 12);
    if (brand.startsWith("avi")) return "avif";
    if (["heic", "heix", "hevc", "heim", "heis", "mif1", "msf1"].includes(brand)) return "heic";
  }
  return "unknown";
}

export function normalizeFormat(format: string): string {
  const f = format.trim().toLowerCase().replace(/^\./, "");
  if (f === "jpg") return "jpeg";
  if (f === "heif") return "heic";
  return f;
}

export function formatLabel(format: string): string {
  return format === "unknown" ? "Unrecognised" : format === "jpeg" ? "JPEG" : format.toUpperCase();
}

function drawScaled(source: ImageBitmap, maxEdge: number, willReadFrequently: boolean) {
  const scale = Math.min(1, maxEdge / Math.max(source.width, source.height));
  const canvas = document.createElement("canvas");
  canvas.width = Math.max(1, Math.round(source.width * scale));
  canvas.height = Math.max(1, Math.round(source.height * scale));
  const ctx = canvas.getContext("2d", { willReadFrequently });
  if (!ctx) throw new CheckerError("Your browser couldn't create an image canvas.");
  ctx.imageSmoothingQuality = "high";
  ctx.drawImage(source, 0, 0, canvas.width, canvas.height);
  return { canvas, ctx };
}

const SRGB_TO_LINEAR = Array.from({ length: 256 }, (_, i) => {
  const c = i / 255;
  return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
});

function rgbToLab(r: number, g: number, b: number): [number, number, number] {
  const R = SRGB_TO_LINEAR[r];
  const G = SRGB_TO_LINEAR[g];
  const B = SRGB_TO_LINEAR[b];
  const f = (t: number) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  const fx = f((R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047);
  const fy = f(R * 0.2126 + G * 0.7152 + B * 0.0722);
  const fz = f((R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883);
  return [116 * fy - 16, 500 * (fx - fy), 200 * (fy - fz)];
}

const toDeg = (rad: number) => (rad * 180) / Math.PI;

/** Folds an angle into −90…90° so that a reversed point order doesn't read as a 180° tilt. */
function foldAngle(deg: number): number {
  let d = deg;
  while (d > 90) d -= 180;
  while (d < -90) d += 180;
  return d;
}

function measureFace(
  landmarks: NormalizedLandmark[],
  blendshapeCategories: { categoryName: string; score: number }[] | undefined,
  width: number,
  height: number,
): FaceMeasurements {
  const p = (i: number) => landmarks[i];
  let x0 = 1, y0 = 1, x1 = 0, y1 = 0;
  for (const l of landmarks) {
    x0 = Math.min(x0, l.x);
    y0 = Math.min(y0, l.y);
    x1 = Math.max(x1, l.x);
    y1 = Math.max(y1, l.y);
  }
  // 468/473 are iris centers (present in the 478-point model); fall back to eye corners.
  const eyeY =
    landmarks.length > 473
      ? (p(468).y + p(473).y) / 2
      : (p(33).y + p(133).y + p(263).y + p(362).y) / 4;
  const forehead = p(10);
  const chin = p(152);
  const faceHeightPx = Math.max(1e-6, (chin.y - forehead.y) * height);
  // z uses roughly the same scale as x (image width), so depth differences give yaw/pitch.
  const rollDeg = foldAngle(toDeg(Math.atan2((p(263).y - p(33).y) * height, (p(263).x - p(33).x) * width)));
  const yawDeg = foldAngle(toDeg(Math.atan2(p(454).z - p(234).z, p(454).x - p(234).x)));
  const pitchDeg = foldAngle(toDeg(Math.atan2(chin.z - forehead.z, ((chin.y - forehead.y) * height) / width)));

  const blendshapes: Record<string, number> = {};
  for (const c of blendshapeCategories ?? []) blendshapes[c.categoryName] = c.score;

  return {
    landmarks,
    box: { x0, y0, x1, y1 },
    foreheadY: forehead.y,
    chinY: chin.y,
    eyeY,
    rollDeg,
    yawDeg,
    pitchDeg,
    lipGapRatio: Math.max(0, (p(14).y - p(13).y) * height) / faceHeightPx,
    blendshapes,
  };
}

/** Returns a person-probability mask resampled to w×h, or null if segmentation is unusable. */
function extractPersonMask(
  segmenter: ImageSegmenter,
  canvas: HTMLCanvasElement,
  face: FaceBox | null,
): Float32Array | null {
  const { width: w, height: h } = canvas;
  const result = segmenter.segment(canvas);
  try {
    const masks = (result.confidenceMasks ?? []).map((mask) => {
      const raw = mask.getAsFloat32Array();
      if (mask.width === w && mask.height === h) return Float32Array.from(raw);
      const resampled = new Float32Array(w * h);
      for (let y = 0; y < h; y++) {
        const my = Math.min(mask.height - 1, Math.floor((y * mask.height) / h));
        for (let x = 0; x < w; x++) {
          resampled[y * w + x] = raw[my * mask.width + Math.min(mask.width - 1, Math.floor((x * mask.width) / w))];
        }
      }
      return resampled;
    });
    if (!masks.length) return null;
    // Without a face we can't tell which channel is the person; fall back to border sampling.
    if (!face) return null;

    // Pick whichever channel is "person" by checking which one covers the face.
    const meanInFace = (m: Float32Array) => {
      let sum = 0, count = 0;
      for (let y = Math.floor(face.y0 * h); y < Math.ceil(face.y1 * h); y++) {
        for (let x = Math.floor(face.x0 * w); x < Math.ceil(face.x1 * w); x++) {
          if (x < 0 || y < 0 || x >= w || y >= h) continue;
          sum += m[y * w + x];
          count++;
        }
      }
      return count ? sum / count : 0;
    };
    let best = masks[0];
    let bestScore = meanInFace(best);
    for (const m of masks.slice(1)) {
      const s = meanInFace(m);
      if (s > bestScore) {
        best = m;
        bestScore = s;
      }
    }
    if (masks.length === 1 && bestScore < 0.5) {
      for (let i = 0; i < best.length; i++) best[i] = 1 - best[i];
      bestScore = 1 - bestScore;
    }
    return bestScore >= 0.5 ? best : null;
  } finally {
    result.close();
  }
}

function measureBackground(
  image: ImageData,
  personMask: Float32Array | null,
  face: FaceMeasurements | null,
): BackgroundMeasurements | null {
  const { width: w, height: h, data } = image;
  const n = w * h;
  const L = new Float32Array(n);
  const A = new Float32Array(n);
  const B = new Float32Array(n);
  for (let i = 0; i < n; i++) {
    const [l, a, b] = rgbToLab(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
    L[i] = l;
    A[i] = a;
    B[i] = b;
  }

  // Exclude an expanded box around the face so hair and ears never count as background.
  const box = face?.box;
  const fw = box ? box.x1 - box.x0 : 0;
  const fh = box ? box.y1 - box.y0 : 0;
  const ex = box
    ? { x0: (box.x0 - fw * 0.35) * w, x1: (box.x1 + fw * 0.35) * w, y0: (box.y0 - fh * 0.6) * h, y1: (box.y1 + fh * 0.15) * h }
    : null;
  const inExclusion = (x: number, y: number) => !!ex && x >= ex.x0 && x <= ex.x1 && y >= ex.y0 && y <= ex.y1;

  const isBg = new Uint8Array(n);
  const method: BackgroundMeasurements["method"] = personMask ? "segmentation" : "border-sample";
  if (personMask) {
    const r = Math.max(2, Math.round(w / 128)); // erode the mask edge (hair, soft shoulders)
    const bgAt = (x: number, y: number) =>
      x < 0 || y < 0 || x >= w || y >= h || personMask[y * w + x] < 0.15;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (bgAt(x, y) && bgAt(x - r, y) && bgAt(x + r, y) && bgAt(x, y - r) && bgAt(x, y + r) && !inExclusion(x, y)) {
          isBg[y * w + x] = 1;
        }
      }
    }
  } else {
    // No segmentation: sample the top strip and the upper side strips.
    const sideLimit = (face ? face.chinY : 0.6) * h;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        const strip = y < h * 0.12 || ((x < w * 0.12 || x > w * 0.88) && y < sideLimit);
        if (strip && !inExclusion(x, y)) isBg[y * w + x] = 1;
      }
    }
  }

  const cx = box ? ((box.x0 + box.x1) / 2) * w : w / 2;
  const cy = face ? face.eyeY * h : h / 2;
  const histogram = new Uint32Array(101);
  let count = 0, sumL = 0, sumA = 0, sumB = 0;
  const sumRgb = [0, 0, 0];
  const halves = { left: [0, 0], right: [0, 0], top: [0, 0], bottom: [0, 0] };
  let lapSum = 0, lapCount = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (!isBg[i]) continue;
      const l = L[i];
      count++;
      sumL += l;
      sumA += A[i];
      sumB += B[i];
      sumRgb[0] += data[i * 4];
      sumRgb[1] += data[i * 4 + 1];
      sumRgb[2] += data[i * 4 + 2];
      histogram[Math.max(0, Math.min(100, Math.round(l)))]++;
      const side = x < cx ? halves.left : halves.right;
      side[0] += l;
      side[1]++;
      const band = y < cy ? halves.top : halves.bottom;
      band[0] += l;
      band[1]++;
      if (x > 0 && y > 0 && x < w - 1 && y < h - 1 && isBg[i - 1] && isBg[i + 1] && isBg[i - w] && isBg[i + w]) {
        lapSum += Math.abs(4 * l - L[i - 1] - L[i + 1] - L[i - w] - L[i + w]);
        lapCount++;
      }
    }
  }
  if (count < Math.max(200, n * 0.02)) return null;

  const percentile = (q: number) => {
    const target = count * q;
    let acc = 0;
    for (let v = 0; v <= 100; v++) {
      acc += histogram[v];
      if (acc >= target) return v;
    }
    return 100;
  };
  const meanOf = ([sum, c]: number[]) => (c > count * 0.05 ? sum / c : null);
  const diff = (a: number | null, b: number | null) => (a === null || b === null ? 0 : Math.abs(a - b));
  const meanA = sumA / count;
  const meanB = sumB / count;

  return {
    method,
    sampleFraction: count / n,
    meanRgb: [Math.round(sumRgb[0] / count), Math.round(sumRgb[1] / count), Math.round(sumRgb[2] / count)],
    lightness: sumL / count,
    chroma: Math.hypot(meanA, meanB),
    hue: (toDeg(Math.atan2(meanB, meanA)) + 360) % 360,
    unevenness: Math.max(
      diff(meanOf(halves.left), meanOf(halves.right)),
      diff(meanOf(halves.top), meanOf(halves.bottom)),
    ),
    shadowDepth: percentile(0.5) - percentile(0.05),
    texture: lapCount ? lapSum / lapCount : 0,
  };
}

export async function analyzePhoto(file: File, onStage: (stage: AnalysisStage) => void): Promise<ImageAnalysis> {
  onStage("decoding");
  if (file.size > MAX_DECODE_BYTES) {
    throw new CheckerError(`This file is ${(file.size / 1024 / 1024).toFixed(0)} MB. Please upload an image under ${MAX_DECODE_BYTES / 1024 / 1024} MB.`);
  }
  const format = detectFormat(new Uint8Array(await file.slice(0, 32).arrayBuffer()));

  let bitmap: ImageBitmap;
  try {
    bitmap = await createImageBitmap(file, { imageOrientation: "from-image" });
  } catch {
    throw new CheckerError(
      format === "heic" || format === "avif"
        ? `Your browser can't open ${formatLabel(format)} images. Export the photo as JPEG and try again.`
        : "This file couldn't be opened as an image. It may be corrupted or in an unsupported format.",
    );
  }

  const width = bitmap.width;
  const height = bitmap.height;
  let faceCanvas: HTMLCanvasElement;
  let bgCanvas: HTMLCanvasElement;
  let bgCtx: CanvasRenderingContext2D;
  try {
    faceCanvas = drawScaled(bitmap, FACE_CANVAS_MAX_EDGE, false).canvas;
    ({ canvas: bgCanvas, ctx: bgCtx } = drawScaled(bitmap, BACKGROUND_CANVAS_MAX_EDGE, true));
  } finally {
    bitmap.close();
  }

  const analysis: ImageAnalysis = {
    file: { name: file.name, sizeBytes: file.size, format, width, height },
    faceCount: null,
    detectionConfidence: null,
    detectorBoxes: [],
    face: null,
    background: null,
    modelError: null,
  };

  onStage("models");
  let models: VisionModels | null = null;
  try {
    models = await getVisionModels();
  } catch {
    analysis.modelError = "The on-device AI models couldn't be loaded, so face checks were skipped.";
  }

  onStage("face");
  // Yield so the stage message paints before the synchronous inference runs.
  await new Promise((resolve) => requestAnimationFrame(() => resolve(null)));
  // The models may have been released (component unmounted) while we yielded.
  if (models?.closed) throw new CheckerError("The check was cancelled.");
  let personMask: Float32Array | null = null;
  if (models) {
    // From here inference is one synchronous block, so the models can't be closed mid-run.
    const landmarkResult = models.landmarker.detect(faceCanvas);
    const detections = models.detector
      ? models.detector.detect(faceCanvas).detections.filter((d) => (d.categories[0]?.score ?? 0) >= MIN_DETECTION_CONFIDENCE)
      : null;

    analysis.detectorBoxes = (detections ?? []).flatMap((d) =>
      d.boundingBox
        ? [{
            x0: d.boundingBox.originX / faceCanvas.width,
            y0: d.boundingBox.originY / faceCanvas.height,
            x1: (d.boundingBox.originX + d.boundingBox.width) / faceCanvas.width,
            y1: (d.boundingBox.originY + d.boundingBox.height) / faceCanvas.height,
          }]
        : [],
    );
    analysis.detectionConfidence = detections?.length
      ? Math.max(...detections.map((d) => d.categories[0]?.score ?? 0))
      : null;
    analysis.faceCount = Math.max(detections?.length ?? 0, landmarkResult.faceLandmarks.length);

    if (landmarkResult.faceLandmarks.length) {
      let primary = 0;
      let largest = -1;
      landmarkResult.faceLandmarks.forEach((lms, i) => {
        const xs = lms.map((l) => l.x);
        const ys = lms.map((l) => l.y);
        const area = (Math.max(...xs) - Math.min(...xs)) * (Math.max(...ys) - Math.min(...ys));
        if (area > largest) {
          largest = area;
          primary = i;
        }
      });
      analysis.face = measureFace(
        landmarkResult.faceLandmarks[primary],
        landmarkResult.faceBlendshapes?.[primary]?.categories,
        faceCanvas.width,
        faceCanvas.height,
      );
    }

    if (models.segmenter) {
      try {
        personMask = extractPersonMask(models.segmenter, bgCanvas, analysis.face?.box ?? analysis.detectorBoxes[0] ?? null);
      } catch {
        personMask = null; // fall back to border sampling
      }
    }
  }

  onStage("background");
  analysis.background = measureBackground(bgCtx.getImageData(0, 0, bgCanvas.width, bgCanvas.height), personMask, analysis.face);
  return analysis;
}

/* ========================================================================== */
/* Evaluation (pure, driven only by API data)                                 */
/* ========================================================================== */

export interface Evaluation {
  checks: PhotoCheck[];
  verdict: "pass" | "warning" | "fail";
  geometry: { crownY: number; chinY: number; eyeY: number } | null;
  eyeBand: [number, number] | null;
  /** Data for the background color card; null when the API sets no color rule. */
  background: {
    requirement: string;
    required: ColorSpec[];
    measuredRgb: [number, number, number] | null;
    measuredLabel: string | null;
  } | null;
}

const pct = (v: number) => `${v.toFixed(1)}%`;
export const num = (v: number | null | undefined): v is number => typeof v === "number" && Number.isFinite(v);

/** A range only counts as a rule if the API gave at least one bound. */
export const hasBounds = (range: NumericRange | null | undefined): range is NumericRange =>
  !!range && (num(range.min) || num(range.max));

export function rangeText(range: NumericRange, unit = "%"): string {
  if (num(range.min) && num(range.max)) return `${range.min}–${range.max}${unit}`;
  if (num(range.min)) return `at least ${range.min}${unit}`;
  if (num(range.max)) return `at most ${range.max}${unit}`;
  return "—";
}

/** Compares an estimate with a range; readings just outside the range become warnings. */
function rangeStatus(value: number, range: NumericRange, tolerance: number): { status: CheckStatus; side: "low" | "high" | null } {
  if (num(range.min) && value < range.min) {
    return { status: value >= range.min - tolerance ? "warning" : "fail", side: "low" };
  }
  if (num(range.max) && value > range.max) {
    return { status: value <= range.max + tolerance ? "warning" : "fail", side: "high" };
  }
  return { status: "pass", side: null };
}

function thresholdStatus(value: number, limits: { warn: number; fail?: number }): CheckStatus {
  if (num(limits.fail) && value >= limits.fail) return "fail";
  if (value >= limits.warn) return "warning";
  return "pass";
}

const worst = (...statuses: CheckStatus[]): CheckStatus =>
  statuses.includes("fail") ? "fail" : statuses.includes("warning") ? "warning" : "pass";

function parseColorSpecs(text: string): ColorSpec[] {
  return text
    .toLowerCase()
    .split(/\s*(?:,|\/|&|\bor\b|\band\b)\s*/)
    .flatMap((token) => {
      const hit = BACKGROUND_COLOR_VOCABULARY.find((entry) => entry.pattern.test(token));
      return hit ? [hit.spec] : [];
    });
}

function colorViolation(bg: BackgroundMeasurements, spec: ColorSpec): number {
  let v = 0;
  if (num(spec.minL)) v += Math.max(0, spec.minL - bg.lightness);
  if (num(spec.maxL)) v += Math.max(0, bg.lightness - spec.maxL);
  if (num(spec.minChroma)) v += Math.max(0, spec.minChroma - bg.chroma);
  if (num(spec.maxChroma)) v += Math.max(0, bg.chroma - spec.maxChroma);
  if (spec.hue && bg.chroma > 4) {
    const [lo, hi] = spec.hue;
    if (bg.hue < lo || bg.hue > hi) v += Math.min(Math.abs(bg.hue - lo), Math.abs(bg.hue - hi)) / 5;
  }
  return v;
}

function describeColor(bg: BackgroundMeasurements): string {
  if (bg.chroma < 8) {
    if (bg.lightness >= 88) return "white";
    if (bg.lightness >= 70) return "light gray";
    if (bg.lightness >= 45) return "gray";
    return "dark";
  }
  const tone = bg.lightness >= 70 ? "light " : bg.lightness < 40 ? "dark " : "";
  if (bg.hue >= 60 && bg.hue < 110) return `${tone}cream / yellowish`;
  if (bg.hue >= 110 && bg.hue < 220) return `${tone}greenish`;
  if (bg.hue >= 220 && bg.hue < 320) return `${tone}bluish`;
  return `${tone}warm / pinkish`;
}

export function evaluatePhoto(analysis: ImageAnalysis, req: PhotoRequirements): Evaluation {
  const checks: PhotoCheck[] = [];
  const digital = req.digital_requirements ?? {};
  const framing = req.face_constraints ?? {};
  const pose = req.pose_rules ?? {};
  const bgRules = req.background_rules ?? {};
  const { file } = analysis;

  /* ---------- Verified measurements ---------- */

  const allowedFormats = [...new Set((digital.format ?? []).map(normalizeFormat))];
  if (allowedFormats.length) {
    const ok = allowedFormats.includes(file.format);
    const wanted = allowedFormats.map(formatLabel).join(" or ");
    checks.push({
      id: "format",
      label: "File format",
      basis: "verified",
      status: ok ? "pass" : file.format === "unknown" ? "warning" : "fail",
      measured: formatLabel(file.format),
      requirement: wanted,
      suggestion: ok ? undefined : `Save or export the photo as ${wanted}.`,
    });
  }

  if (num(digital.max_file_size_kb)) {
    const kb = file.sizeBytes / 1024;
    const limit = digital.max_file_size_kb;
    const show = (v: number) => (v >= 1024 ? `${(v / 1024).toFixed(1)} MB` : `${Math.round(v)} KB`);
    checks.push({
      id: "file-size",
      label: "File size",
      basis: "verified",
      status: kb <= limit ? "pass" : "fail",
      measured: show(kb),
      requirement: `at most ${show(limit)}`,
      suggestion: kb <= limit ? undefined : "Re-save the JPEG at a slightly lower quality, or resize it closer to the minimum resolution.",
    });
  }

  const minRes = digital.min_resolution_px ?? digital.required_resolution_px;
  const dims = `${file.width} × ${file.height} px`;
  if (minRes) {
    // Exactly the minimum passes; one pixel short on either side fails.
    const shortWidth = Math.max(0, minRes.width - file.width);
    const shortHeight = Math.max(0, minRes.height - file.height);
    const ok = shortWidth === 0 && shortHeight === 0;
    const shortfall = [shortWidth && `${shortWidth} px too narrow`, shortHeight && `${shortHeight} px too short`].filter(Boolean).join(" and ");
    checks.push({
      id: "resolution-min",
      label: "Minimum resolution",
      basis: "verified",
      status: ok ? "pass" : "fail",
      measured: ok ? dims : `${dims} (${shortfall})`,
      requirement: `at least ${minRes.width} × ${minRes.height} px`,
      suggestion: ok
        ? undefined
        : "Use the original, uncompressed photo from your camera. Screenshots and messaging apps reduce resolution.",
    });
  }

  // The print ratio (mm) and pixel ratio can differ slightly; either is accepted.
  const ratios: number[] = [];
  const addRatio = (r: number | null | undefined) => {
    if (num(r) && r > 0 && !ratios.some((x) => Math.abs(x - r) < 0.002)) ratios.push(r);
  };
  addRatio(req.photo_spec?.aspect_ratio);
  if (digital.required_resolution_px) addRatio(digital.required_resolution_px.width / digital.required_resolution_px.height);
  if (digital.min_resolution_px) addRatio(digital.min_resolution_px.width / digital.min_resolution_px.height);
  if (ratios.length) {
    const actual = file.width / file.height;
    const deviation = Math.min(...ratios.map((r) => Math.abs(actual - r) / r));
    const status: CheckStatus =
      deviation <= ESTIMATE_TOLERANCE.aspectRatioPass ? "pass" : deviation <= ESTIMATE_TOLERANCE.aspectRatioWarn ? "warning" : "fail";
    checks.push({
      id: "aspect-ratio",
      label: "Shape (aspect ratio)",
      basis: "verified",
      status,
      measured: `${actual.toFixed(3)} (width ÷ height)`,
      requirement: ratios.map((r) => r.toFixed(3)).join(" or "),
      suggestion: status === "pass" ? undefined : "Crop the photo to the required shape. An uncropped phone photo is usually too wide or too tall.",
    });
  }

  /* ---------- AI estimates ---------- */

  const unavailable = (id: string, label: string, requirement: string | undefined, reason: string): PhotoCheck => ({
    id,
    label,
    basis: "estimate",
    status: "unavailable",
    requirement,
    detail: reason,
    suggestion: "Check this yourself against the requirement.",
  });

  const face = analysis.face;
  let geometry: Evaluation["geometry"] = null;
  let eyeBand: Evaluation["eyeBand"] = null;
  const faceReason = analysis.modelError
    ? analysis.modelError
    : analysis.faceCount === 0
      ? "No face was detected, so this couldn't be measured."
      : "Facial landmarks couldn't be located precisely.";

  if (analysis.faceCount !== null) {
    const count = analysis.faceCount;
    checks.push({
      id: "face-count",
      label: "One face, clearly visible",
      basis: "estimate",
      status: count === 1 && face ? "pass" : "fail",
      measured:
        count === 0
          ? "No face detected"
          : !face
            ? "Face found, but its features couldn't be located"
            : count > 1
            ? `${count} faces detected`
            : `1 face${analysis.detectionConfidence ? ` (${Math.round(analysis.detectionConfidence * 100)}% confidence)` : ""}`,
      requirement: "exactly one face",
      suggestion:
        count === 0 || !face
          ? "Face the camera directly with your whole face visible and evenly lit. Remove anything covering your face."
          : count > 1
            ? "Only you can be in the photo. Crop out or retake without other people, posters or reflections."
            : undefined,
    });
  } else {
    checks.push(unavailable("face-count", "One face, clearly visible", "exactly one face", faceReason));
  }

  const multiplier = num(req.auto_crop_config?.head_top_multiplier)
    ? req.auto_crop_config.head_top_multiplier
    : FALLBACK_HEAD_TOP_MULTIPLIER;
  if (face) {
    const crownY = face.chinY - (face.chinY - face.foreheadY) * multiplier;
    geometry = { crownY, chinY: face.chinY, eyeY: face.eyeY };
  }

  const headRange = framing.head_height_pct;
  if (hasBounds(headRange)) {
    if (geometry) {
      const value = (geometry.chinY - geometry.crownY) * 100;
      const { status, side } = rangeStatus(value, headRange, ESTIMATE_TOLERANCE.framingPct);
      checks.push({
        id: "head-height",
        label: "Head size (chin to crown)",
        basis: "estimate",
        status,
        measured: `${pct(value)} of photo height`,
        requirement: rangeText(headRange),
        detail: "Crown position is estimated from facial landmarks, as hair can hide it.",
        suggestion:
          side === "low"
            ? "Your head is too small in the frame. Crop closer, or stand nearer the camera."
            : side === "high"
              ? "Your head is too large in the frame. Crop wider, or step back from the camera."
              : undefined,
      });
    } else {
      checks.push(unavailable("head-height", "Head size (chin to crown)", rangeText(headRange), faceReason));
    }
  }

  const eyeRange = framing.eye_position?.from_bottom_pct;
  if (hasBounds(eyeRange)) {
    eyeBand = [1 - (num(eyeRange.max) ? eyeRange.max : 100) / 100, 1 - (num(eyeRange.min) ? eyeRange.min : 0) / 100];
    if (geometry) {
      const value = (1 - geometry.eyeY) * 100;
      const { status, side } = rangeStatus(value, eyeRange, ESTIMATE_TOLERANCE.framingPct);
      checks.push({
        id: "eye-position",
        label: "Eye height",
        basis: "estimate",
        status,
        measured: `${pct(value)} up from the bottom`,
        requirement: rangeText(eyeRange),
        suggestion:
          side === "low"
            ? "Your eyes sit too low. Leave less space above your head, or include a little more below your chin."
            : side === "high"
              ? "Your eyes sit too high. Leave more space above your head."
              : undefined,
      });
    } else {
      checks.push(unavailable("eye-position", "Eye height", rangeText(eyeRange), faceReason));
    }
  }

  const topRange = framing.top_margin_pct;
  if (topRange && num(topRange.min)) {
    if (geometry) {
      const value = geometry.crownY * 100;
      const { status } = rangeStatus(value, { min: topRange.min }, ESTIMATE_TOLERANCE.framingPct);
      checks.push({
        id: "top-margin",
        label: "Space above head",
        basis: "estimate",
        status,
        measured: value < 0 ? "Top of head is cut off" : pct(value),
        requirement: `${rangeText({ min: topRange.min })}${num(topRange.recommended) ? ` (ideally ${topRange.recommended}%)` : ""}`,
        suggestion: status === "pass" ? undefined : "Leave a clear gap between the top of your head and the edge of the photo.",
      });
    } else {
      checks.push(unavailable("top-margin", "Space above head", rangeText({ min: topRange.min }), faceReason));
    }
  }

  const chinRange = framing.chin_to_bottom_pct;
  if (hasBounds(chinRange)) {
    if (geometry) {
      const value = (1 - geometry.chinY) * 100;
      const { status, side } = rangeStatus(value, chinRange, ESTIMATE_TOLERANCE.framingPct);
      checks.push({
        id: "chin-margin",
        label: "Space below chin",
        basis: "estimate",
        status,
        measured: pct(value),
        requirement: rangeText(chinRange),
        suggestion:
          side === "low"
            ? "Include more of your neck and shoulders below your chin."
            : side === "high"
              ? "There's too much space below your chin. Crop a little tighter at the bottom."
              : undefined,
      });
    } else {
      checks.push(unavailable("chin-margin", "Space below chin", rangeText(chinRange), faceReason));
    }
  }

  if (pose.head_tilt_allowed === false) {
    if (face) {
      const roll = Math.abs(face.rollDeg);
      checks.push({
        id: "head-tilt",
        label: "Head level (not tilted)",
        basis: "estimate",
        status: thresholdStatus(roll, ESTIMATE_TOLERANCE.rollDeg),
        measured: `${roll.toFixed(1)}° tilt`,
        requirement: "no tilt",
        suggestion:
          roll >= ESTIMATE_TOLERANCE.rollDeg.warn
            ? "Keep your head straight, with both eyes level. Rotating the image won't fix a tilted head."
            : undefined,
      });
      const yaw = Math.abs(face.yawDeg);
      const pitch = Math.abs(face.pitchDeg);
      checks.push({
        id: "head-rotation",
        label: "Facing the camera",
        basis: "estimate",
        status: worst(thresholdStatus(yaw, ESTIMATE_TOLERANCE.yawDeg), thresholdStatus(pitch, ESTIMATE_TOLERANCE.pitchDeg)),
        measured: `${yaw.toFixed(0)}° turned, ${pitch.toFixed(0)}° up/down`,
        requirement: "face straight on",
        suggestion:
          yaw >= ESTIMATE_TOLERANCE.yawDeg.warn || pitch >= ESTIMATE_TOLERANCE.pitchDeg.warn
            ? "Look straight into the lens with the camera at eye level, and don't turn your head or chin."
            : undefined,
      });
    } else {
      checks.push(unavailable("head-tilt", "Head level (not tilted)", "no tilt", faceReason));
      checks.push(unavailable("head-rotation", "Facing the camera", "face straight on", faceReason));
    }
  }

  const bs = face?.blendshapes ?? {};
  const hasBlendshapes = Object.keys(bs).length > 0;

  if (pose.eyes_open === true) {
    if (face && hasBlendshapes) {
      const blink = Math.max(bs.eyeBlinkLeft ?? 0, bs.eyeBlinkRight ?? 0);
      const status = thresholdStatus(blink, ESTIMATE_TOLERANCE.eyeBlink);
      checks.push({
        id: "eyes-open",
        label: "Eyes open",
        basis: "estimate",
        status,
        measured: status === "pass" ? "Open" : status === "warning" ? "Possibly half-closed" : "Closed",
        requirement: "both eyes open",
        suggestion: status === "pass" ? undefined : "Keep both eyes fully open and look into the lens.",
      });
    } else {
      checks.push(unavailable("eyes-open", "Eyes open", "both eyes open", faceReason));
    }
  }

  if (pose.mouth_closed === true) {
    if (face && hasBlendshapes) {
      const status = worst(
        thresholdStatus(bs.jawOpen ?? 0, ESTIMATE_TOLERANCE.jawOpen),
        thresholdStatus(face.lipGapRatio, ESTIMATE_TOLERANCE.lipGapRatio),
      );
      checks.push({
        id: "mouth-closed",
        label: "Mouth closed",
        basis: "estimate",
        status,
        measured: status === "pass" ? "Closed" : status === "warning" ? "Slightly open" : "Open",
        requirement: "mouth closed",
        suggestion: status === "pass" ? undefined : "Close your mouth and relax your lips.",
      });
    } else {
      checks.push(unavailable("mouth-closed", "Mouth closed", "mouth closed", faceReason));
    }
  }

  const expression = pose.expression?.trim();
  if (expression) {
    const wantsNeutral = /neutral/i.test(expression) && !/smil/i.test(expression);
    if (!wantsNeutral) {
      checks.push({
        id: "expression",
        label: "Facial expression",
        basis: "manual",
        status: "manual",
        requirement: expression,
        suggestion: "Make sure your expression matches the requirement.",
      });
    } else if (face && hasBlendshapes) {
      const smile = ((bs.mouthSmileLeft ?? 0) + (bs.mouthSmileRight ?? 0)) / 2;
      const status = thresholdStatus(smile, ESTIMATE_TOLERANCE.smile);
      checks.push({
        id: "expression",
        label: "Neutral expression",
        basis: "estimate",
        status,
        measured: status === "pass" ? "Neutral" : status === "warning" ? "Slight smile" : "Smiling",
        requirement: expression,
        suggestion: status === "pass" ? undefined : "Relax your face, with no smile and your eyebrows in their natural position.",
      });
    } else {
      checks.push(unavailable("expression", "Neutral expression", expression, faceReason));
    }
  }

  const colorText = bgRules.color ?? digital.background_color;
  const bg = analysis.background;
  const backgroundSummary: Evaluation["background"] = colorText
    ? {
        requirement: colorText,
        required: parseColorSpecs(colorText),
        measuredRgb: bg?.meanRgb ?? null,
        measuredLabel: bg ? describeColor(bg) : null,
      }
    : null;
  const bgReason = "Not enough plain background was visible to measure it.";
  if (colorText) {
    const specs = parseColorSpecs(colorText);
    if (!specs.length) {
      checks.push({
        id: "background-color",
        label: "Background color",
        basis: "manual",
        status: "manual",
        requirement: colorText,
        suggestion: "Compare your background with the required color yourself.",
      });
    } else if (bg) {
      const violation = Math.min(...specs.map((s) => colorViolation(bg, s)));
      const status: CheckStatus = violation === 0 ? "pass" : violation <= ESTIMATE_TOLERANCE.colorViolation ? "warning" : "fail";
      checks.push({
        id: "background-color",
        label: "Background color",
        basis: "estimate",
        status,
        measured: `Looks ${describeColor(bg)}`,
        requirement: colorText,
        detail: `Lightness ${bg.lightness.toFixed(0)}/100, color saturation ${bg.chroma.toFixed(0)} (CIELAB).`,
        suggestion:
          status === "pass"
            ? undefined
            : `Stand in front of a plain ${specs.map((s) => s.label).join(" or ")} wall, with even light so it doesn't look gray or tinted.`,
      });
    } else {
      checks.push(unavailable("background-color", "Background color", colorText, bgReason));
    }
  }

  if (bgRules.shadows_allowed === false) {
    if (bg) {
      const status = worst(
        thresholdStatus(bg.shadowDepth, ESTIMATE_TOLERANCE.shadowDepth),
        thresholdStatus(bg.unevenness, ESTIMATE_TOLERANCE.unevenness),
      );
      checks.push({
        id: "background-shadows",
        label: "No shadows on background",
        basis: "estimate",
        status,
        measured: status === "pass" ? "Evenly lit" : status === "warning" ? "Slightly uneven lighting" : "Shadows or uneven lighting",
        requirement: "no shadows",
        suggestion:
          status === "pass"
            ? undefined
            : "Step a little away from the wall and light it evenly from the front. Avoid a single side lamp or window.",
      });
    } else {
      checks.push(unavailable("background-shadows", "No shadows on background", "no shadows", bgReason));
    }
  }

  if (bgRules.texture_allowed === false) {
    if (bg) {
      const status = thresholdStatus(bg.texture, ESTIMATE_TOLERANCE.texture);
      checks.push({
        id: "background-plain",
        label: "Plain background (no pattern)",
        basis: "estimate",
        status,
        measured: status === "pass" ? "Plain" : status === "warning" ? "Some texture" : "Patterned or textured",
        requirement: "plain, no texture or objects",
        suggestion: status === "pass" ? undefined : "Use a smooth, plain wall with no patterns, furniture or objects behind you.",
      });
    } else {
      checks.push(unavailable("background-plain", "Plain background (no pattern)", "plain background", bgReason));
    }
  }

  /* ---------- Manual review ---------- */

  if (pose.both_ears_visible === true) {
    checks.push({
      id: "ears-visible",
      label: "Both ears visible",
      basis: "manual",
      status: "manual",
      requirement: "both ears visible",
      suggestion: "Tuck your hair behind your ears so both are clearly visible.",
    });
  }

  const graded = checks.map((c) => c.status);
  // Something we couldn't measure is never a clean pass.
  const verdict = graded.includes("fail")
    ? "fail"
    : graded.includes("warning") || graded.includes("unavailable")
      ? "warning"
      : "pass";
  return { checks, verdict, geometry, eyeBand, background: backgroundSummary };
}


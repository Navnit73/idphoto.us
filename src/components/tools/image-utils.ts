export const MAX_INPUT_BYTES = 25 * 1024 * 1024;
export const ACCEPTED_TYPES = "image/jpeg,image/png,image/webp,image/heic,image/heif";

export type LoadedImage = { element: HTMLImageElement; url: string; width: number; height: number; file: File };

/** Decodes a user-selected file. The caller owns `url` and must revoke it. */
export async function loadImage(file: File): Promise<LoadedImage> {
  // Some browsers report HEIC/HEIF files with an empty type; let decode() decide whether they open.
  const heic = !file.type && /\.hei[cf]$/i.test(file.name);
  if (!file.type.startsWith("image/") && !heic) throw new Error("That file isn't an image. Choose a JPEG, PNG, or WebP photo.");
  if (file.size > MAX_INPUT_BYTES) throw new Error("That image is over 25 MB. Choose a smaller photo.");

  const url = URL.createObjectURL(file);
  const element = new Image();
  element.decoding = "async";
  element.src = url;
  try {
    await element.decode();
  } catch {
    URL.revokeObjectURL(url);
    throw new Error("This browser can't open that image. Try a JPEG or PNG (HEIC photos may need converting first).");
  }
  return { element, url, width: element.naturalWidth, height: element.naturalHeight, file };
}

export function createCanvas(width: number, height: number) {
  const canvas = document.createElement("canvas");
  canvas.width = width;
  canvas.height = height;
  const context = canvas.getContext("2d");
  if (!context) throw new Error("Your browser doesn't support image editing (canvas unavailable).");
  context.imageSmoothingQuality = "high";
  return { canvas, context };
}

/**
 * Fills the canvas with white paper color before drawing, so transparent
 * areas don't turn black in JPEG output. This is photo data, not UI styling.
 */
export function fillPhotoBackground(context: CanvasRenderingContext2D) {
  context.fillStyle = "#ffffff"; // design-tokens-ignore-line
  context.fillRect(0, 0, context.canvas.width, context.canvas.height);
}

export function canvasToBlob(canvas: HTMLCanvasElement, type: string, quality?: number): Promise<Blob> {
  return new Promise((resolve, reject) => {
    canvas.toBlob((blob) => (blob ? resolve(blob) : reject(new Error("Couldn't encode the image."))), type, quality);
  });
}

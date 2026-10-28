"use client";

import {
  ArrowRight,
  CircleCheck,
  CircleHelp,
  CircleQuestionMark,
  CircleX,
  ClipboardCheck,
  Cpu,
  Eye,
  EyeOff,
  ImagePlus,
  Info,
  RefreshCw,
  RotateCcw,
  Ruler,
  ShieldCheck,
  TriangleAlert,
  Wand2,
  type LucideIcon,
} from "lucide-react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useEffect,
  useId,
  useLayoutEffect,
  useMemo,
  useRef,
  useState,
  type ChangeEvent,
  type DragEvent,
  type KeyboardEvent,
} from "react";

import { CountryPicker } from "@/components/tools/country-picker";
import { prepareUpload } from "@/components/tools/image-utils";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/field";
import type { PhotoProcessResult, PhotoRequirements } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { apiPost, apiUpload, ClientApiError } from "@/lib/http/client";
import { DEFAULT_COUNTRY, type CountryCode } from "@/lib/photo/countries";

import {
  analyzePhoto,
  CheckerError,
  evaluatePhoto,
  formatLabel,
  hasBounds,
  normalizeFormat,
  num,
  rangeText,
  releaseVisionModels,
  retainVisionModels,
  type AnalysisStage,
  type CheckBasis,
  type CheckStatus,
  type Evaluation,
  type ImageAnalysis,
  type PhotoCheck,
} from "./analysis";

/* ========================================================================== */
/* Requirements (module-level cache shared by every instance)                 */
/* ========================================================================== */

const requirementsCache = new Map<CountryCode, Promise<PhotoRequirements>>();

function loadRequirements(country: CountryCode): Promise<PhotoRequirements> {
  let pending = requirementsCache.get(country);
  if (!pending) {
    pending = apiPost<PhotoRequirements>("/photo/requirements", { country_code: country, document_type: "passport" });
    pending.catch(() => requirementsCache.delete(country));
    requirementsCache.set(country, pending);
  }
  return pending;
}

/* ========================================================================== */
/* Presentation helpers                                                       */
/* ========================================================================== */

const STATUS_META: Record<CheckStatus, { label: string; Icon: LucideIcon; text: string; badge: string }> = {
  pass: { label: "Pass", Icon: CircleCheck, text: "text-success", badge: "bg-success-subtle text-success" },
  warning: { label: "Warning", Icon: TriangleAlert, text: "text-warning", badge: "bg-warning-subtle text-warning" },
  fail: { label: "Fail", Icon: CircleX, text: "text-danger", badge: "bg-danger-subtle text-danger" },
  manual: { label: "Check yourself", Icon: CircleQuestionMark, text: "text-primary", badge: "bg-primary-subtle text-primary-subtle-foreground" },
  unavailable: { label: "Not measured", Icon: CircleHelp, text: "text-muted-foreground", badge: "bg-muted text-muted-foreground" },
};

const BASIS_META: Record<CheckBasis, { title: string; tag: string; Icon: LucideIcon; blurb: string }> = {
  verified: {
    title: "Verified measurements",
    tag: "Exact",
    Icon: Ruler,
    blurb: "Read directly from your file, so these are exact.",
  },
  estimate: {
    title: "AI estimates",
    tag: "AI estimate",
    Icon: Cpu,
    blurb: "From on-device computer vision. Usually within a few percent; borderline readings show as warnings.",
  },
  manual: {
    title: "Manual review",
    tag: "Check yourself",
    Icon: ClipboardCheck,
    blurb: "Software can't judge these reliably. Check them yourself.",
  },
};

const STAGE_TEXT: Record<AnalysisStage, string> = {
  decoding: "Reading your image…",
  models: "Loading on-device AI (first check only, about 16 MB)…",
  face: "Finding your face and landmarks…",
  background: "Checking the background color…",
};

const FIX_STEPS = [
  "Uploading your photo securely…",
  "Detecting face and eye line…",
  "Cropping to the official size…",
  "Checking the background…",
  "Preparing your result…",
];

const VERDICT_META = {
  pass: { Icon: CircleCheck, title: "Looks good against the measurable rules", tone: "border-success/40 bg-success-subtle", text: "text-success" },
  warning: { Icon: TriangleAlert, title: "Nearly there. A few things to review", tone: "border-warning/40 bg-warning-subtle", text: "text-warning" },
  fail: { Icon: CircleX, title: "This photo doesn't meet the rules yet", tone: "border-danger/40 bg-danger-subtle", text: "text-danger" },
} as const;

type TabId = "fix" | "all" | "rules";

function summarizeRequirements(req: PhotoRequirements): { label: string; value: string }[] {
  const rows: { label: string; value: string }[] = [];
  const spec = req.photo_spec;
  if (spec && num(spec.width_mm) && num(spec.height_mm)) rows.push({ label: "Print size", value: `${spec.width_mm} × ${spec.height_mm} mm` });
  else if (spec && num(spec.width_in) && num(spec.height_in)) rows.push({ label: "Print size", value: `${spec.width_in} × ${spec.height_in} in` });
  const d = req.digital_requirements;
  const min = d?.min_resolution_px ?? d?.required_resolution_px;
  if (min) rows.push({ label: "Min. resolution", value: `${min.width} × ${min.height} px` });
  if (num(d?.max_file_size_kb)) {
    rows.push({ label: "Max. file size", value: d.max_file_size_kb >= 1024 ? `${(d.max_file_size_kb / 1024).toFixed(1).replace(/\.0$/, "")} MB` : `${d.max_file_size_kb} KB` });
  }
  if (d?.format?.length) rows.push({ label: "Format", value: [...new Set(d.format.map(normalizeFormat))].map(formatLabel).join(", ") });
  const color = req.background_rules?.color ?? d?.background_color;
  if (color) rows.push({ label: "Background", value: color });
  const f = req.face_constraints;
  if (hasBounds(f?.head_height_pct)) rows.push({ label: "Head height", value: `${rangeText(f.head_height_pct)} of photo` });
  if (hasBounds(f?.eye_position?.from_bottom_pct)) rows.push({ label: "Eye line", value: `${rangeText(f.eye_position.from_bottom_pct)} from bottom` });
  if (req.pose_rules?.expression) rows.push({ label: "Expression", value: req.pose_rules.expression });
  return rows;
}

/**
 * Resolves a color token to a value the canvas understands. Tokens use
 * `light-dark()`, which only resolves on an element, so it's read back from a probe.
 */
function tokenColor(host: Element, token: string): string {
  const probe = document.createElement("span");
  probe.style.color = `var(${token})`;
  host.appendChild(probe);
  const color = getComputedStyle(probe).color;
  probe.remove();
  return color;
}

function drawOverlay(canvas: HTMLCanvasElement, analysis: ImageAnalysis | null, evaluation: Evaluation | null) {
  const ctx = canvas.getContext("2d");
  if (!ctx) return;
  const W = canvas.width;
  const H = canvas.height;
  ctx.clearRect(0, 0, W, H);
  if (!analysis || !canvas.parentElement) return;

  const host = canvas.parentElement;
  const primary = tokenColor(host, "--primary");
  const success = tokenColor(host, "--success");
  const warning = tokenColor(host, "--warning");
  const danger = tokenColor(host, "--danger");
  const ink = tokenColor(host, "--foreground");
  const paper = tokenColor(host, "--background");
  const statusColor = (s?: CheckStatus) => (s === "fail" ? danger : s === "warning" ? warning : s === "pass" ? success : primary);
  const unit = Math.max(1, W / 400);
  const fontSize = Math.max(11, Math.round(W / 34));

  const label = (text: string, x: number, y: number) => {
    ctx.font = `600 ${fontSize}px ui-sans-serif, system-ui, sans-serif`;
    const pad = fontSize * 0.35;
    const tw = ctx.measureText(text).width;
    const bx = Math.min(Math.max(0, x), W - tw - pad * 2);
    const by = Math.min(Math.max(0, y - fontSize - pad * 2), H - fontSize - pad * 2);
    ctx.globalAlpha = 0.85;
    ctx.fillStyle = ink;
    ctx.fillRect(bx, by, tw + pad * 2, fontSize + pad * 2);
    ctx.globalAlpha = 1;
    ctx.fillStyle = paper;
    ctx.textBaseline = "top";
    ctx.fillText(text, bx + pad, by + pad);
  };

  // Allowed eye band from the API.
  if (evaluation?.eyeBand) {
    const [top, bottom] = evaluation.eyeBand;
    ctx.globalAlpha = 0.14;
    ctx.fillStyle = success;
    ctx.fillRect(0, top * H, W, (bottom - top) * H);
    ctx.globalAlpha = 0.6;
    ctx.strokeStyle = success;
    ctx.lineWidth = unit;
    ctx.setLineDash([4 * unit, 4 * unit]);
    ctx.strokeRect(0, top * H, W, (bottom - top) * H);
    ctx.setLineDash([]);
    ctx.globalAlpha = 1;
  }

  for (const box of analysis.detectorBoxes) {
    ctx.strokeStyle = primary;
    ctx.lineWidth = 1.5 * unit;
    ctx.strokeRect(box.x0 * W, box.y0 * H, (box.x1 - box.x0) * W, (box.y1 - box.y0) * H);
  }

  const face = analysis.face;
  if (face) {
    ctx.fillStyle = primary;
    ctx.globalAlpha = 0.75;
    const r = Math.max(0.8, unit * 0.9);
    for (const l of face.landmarks) {
      ctx.beginPath();
      ctx.arc(l.x * W, l.y * H, r, 0, Math.PI * 2);
      ctx.fill();
    }
    ctx.globalAlpha = 1;
  }

  const g = evaluation?.geometry;
  if (face && g) {
    const statusOf = (id: string) => evaluation?.checks.find((c) => c.id === id)?.status;
    const x0 = Math.max(0, face.box.x0 - 0.08) * W;
    const x1 = Math.min(1, face.box.x1 + 0.08) * W;
    const line = (y: number, color: string, dashed: boolean) => {
      ctx.strokeStyle = color;
      ctx.lineWidth = 2 * unit;
      ctx.setLineDash(dashed ? [6 * unit, 4 * unit] : []);
      ctx.beginPath();
      ctx.moveTo(x0, y * H);
      ctx.lineTo(x1, y * H);
      ctx.stroke();
      ctx.setLineDash([]);
    };
    line(Math.max(0, g.crownY), statusColor(statusOf("top-margin")), true);
    line(g.chinY, statusColor(statusOf("chin-margin")), true);
    line(g.eyeY, statusColor(statusOf("eye-position")), false);

    // Head-height bracket on the left.
    const bx = Math.max(6 * unit, x0 - 10 * unit);
    ctx.strokeStyle = statusColor(statusOf("head-height"));
    ctx.lineWidth = 3 * unit;
    ctx.beginPath();
    ctx.moveTo(bx + 5 * unit, Math.max(0, g.crownY) * H);
    ctx.lineTo(bx, Math.max(0, g.crownY) * H);
    ctx.lineTo(bx, g.chinY * H);
    ctx.lineTo(bx + 5 * unit, g.chinY * H);
    ctx.stroke();

    label("Crown (est.)", x1 - W * 0.3, Math.max(0, g.crownY) * H);
    label("Eyes", x1 - W * 0.14, g.eyeY * H);
    label("Chin", x1 - W * 0.14, g.chinY * H + fontSize * 1.8);
  }
}

/* ========================================================================== */
/* Small internal view helpers                                                */
/* ========================================================================== */

function Spinner({ className }: { className?: string }) {
  return <span aria-hidden="true" className={cn("size-4 shrink-0 animate-spin rounded-full border-2 border-border-strong border-t-primary", className)} />;
}

function StatusIcon({ status, className }: { status: CheckStatus; className?: string }) {
  const { Icon, text, label } = STATUS_META[status];
  return <Icon className={cn("size-4 shrink-0", text, className)} aria-label={label} role="img" />;
}

function BasisTag({ basis }: { basis: CheckBasis }) {
  const { Icon, tag, blurb } = BASIS_META[basis];
  return (
    <span className="inline-flex items-center gap-1 rounded-full border px-1.5 text-xs font-medium whitespace-nowrap text-muted-foreground" title={blurb}>
      <Icon className="size-3" aria-hidden="true" />
      {tag}
    </span>
  );
}

/** One row in the "To fix" list: what we found, what's required, how to fix it. */
function CheckRow({ check }: { check: PhotoCheck }) {
  return (
    <li className="flex gap-2.5 py-3">
      <StatusIcon status={check.status} className="mt-0.5" />
      <div className="min-w-0 flex-1">
        <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
          <span className="text-sm font-semibold">{check.label}</span>
          <BasisTag basis={check.basis} />
        </div>
        <p className="mt-0.5 text-xs text-muted-foreground">
          {check.measured && (
            <>
              <span className="font-medium text-foreground">{check.measured}</span>
              {check.requirement && " · "}
            </>
          )}
          {check.requirement && <>needs {check.requirement}</>}
        </p>
        {check.suggestion && (
          <p className="mt-1 flex items-start gap-1.5 text-xs font-medium">
            <ArrowRight className="mt-0.5 size-3 shrink-0 text-primary" aria-hidden="true" />
            <span>{check.suggestion}</span>
          </p>
        )}
      </div>
    </li>
  );
}

/** Compact tile used in the "All checks" grid. */
function CheckTile({ check }: { check: PhotoCheck }) {
  const summary = check.measured ?? check.requirement ?? "";
  const hint = [check.measured && `Found: ${check.measured}`, check.requirement && `Required: ${check.requirement}`, check.detail, check.status !== "pass" ? check.suggestion : undefined]
    .filter(Boolean)
    .join("\n");
  return (
    <li className="flex items-start gap-2 rounded-md border bg-surface-raised px-2.5 py-2" title={hint}>
      <StatusIcon status={check.status} className="mt-0.5" />
      <div className="min-w-0">
        <p className="truncate text-xs font-semibold">{check.label}</p>
        <p className="truncate text-xs text-muted-foreground">{summary}</p>
      </div>
    </li>
  );
}

function RulesList({ rows }: { rows: { label: string; value: string }[] }) {
  return (
    <dl className="grid grid-cols-2 gap-x-4 gap-y-2 text-sm sm:grid-cols-3">
      {rows.map((row) => (
        <div key={row.label} className="min-w-0">
          <dt className="text-xs text-muted-foreground">{row.label}</dt>
          <dd className="truncate font-semibold first-letter:uppercase" title={row.value}>
            {row.value}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function Swatch({ color, label, caption }: { color: string | null; label: string; caption: string }) {
  return (
    <div className="flex min-w-0 items-center gap-2">
      <span className="size-9 shrink-0 rounded-md border border-border-strong" style={color ? { backgroundColor: color } : undefined} aria-hidden="true" />
      <div className="min-w-0">
        <p className="text-xs tracking-wide text-muted-foreground uppercase">{label}</p>
        <p className="truncate text-xs font-semibold first-letter:uppercase">{caption}</p>
      </div>
    </div>
  );
}

/** Passed checks out of the graded ones, as a ring. */
function ScoreRing({ passed, graded, className }: { passed: number; graded: number; className: string }) {
  const r = 24;
  const circumference = 2 * Math.PI * r;
  const share = graded ? passed / graded : 0;
  return (
    <div className={cn("relative size-14 shrink-0", className)} role="img" aria-label={`${passed} of ${graded} measured checks passed`}>
      <svg viewBox="0 0 56 56" className="size-full -rotate-90" aria-hidden="true">
        <circle cx="28" cy="28" r={r} fill="none" strokeWidth="5" className="stroke-border" />
        <circle cx="28" cy="28" r={r} fill="none" strokeWidth="5" stroke="currentColor" strokeLinecap="round" strokeDasharray={`${share * circumference} ${circumference}`} />
      </svg>
      <span className="absolute inset-0 flex items-center justify-center text-xs font-bold" aria-hidden="true">
        {passed}/{graded}
      </span>
    </div>
  );
}

/* ========================================================================== */
/* Component                                                                  */
/* ========================================================================== */

type RequirementsState = { key: string; data?: PhotoRequirements; error?: string };

type FixState = { status: "idle" } | { status: "working"; step: number } | { status: "error"; message: string };

const messageOf = (err: unknown, fallback: string) => (err instanceof CheckerError || err instanceof ClientApiError ? err.message : fallback);

/**
 * In-browser passport photo compliance check: pick a country, drop a photo, and
 * see which of that country's published rules it meets. The photo is analyzed
 * on the device; "Fix my photo" uploads it to /api/photo/process and opens the
 * result at /preview/<id>. Embeddable on content pages with `widget: photo-checker`.
 */
export function PhotoChecker({ country: initialCountry = DEFAULT_COUNTRY }: { country?: CountryCode }) {
  const uid = useId();
  const router = useRouter();
  const fileInputRef = useRef<HTMLInputElement>(null);
  const overlayRef = useRef<HTMLCanvasElement>(null);
  const tabRefs = useRef<Partial<Record<TabId, HTMLButtonElement | null>>>({});
  const runIdRef = useRef(0);
  const retainedModelsRef = useRef(false);

  /* ---------- Country ---------- */

  const [country, setCountry] = useState<CountryCode>(initialCountry);
  const [requirementsState, setRequirementsState] = useState<RequirementsState | null>(null);
  const [requirementsReload, setRequirementsReload] = useState(0);
  const requirementsKey = `${country}|${requirementsReload}`;
  const requirementsLoading = requirementsState?.key !== requirementsKey;
  const requirements = !requirementsLoading ? (requirementsState?.data ?? null) : null;
  const requirementsError = !requirementsLoading ? (requirementsState?.error ?? null) : null;

  useEffect(() => {
    let active = true;
    const key = `${country}|${requirementsReload}`;
    loadRequirements(country).then(
      (data) => active && setRequirementsState({ key, data }),
      (err) => active && setRequirementsState({ key, error: messageOf(err, "Couldn't load the photo requirements.") }),
    );
    return () => {
      active = false;
    };
  }, [country, requirementsReload]);

  const handleCountryChange = (code: CountryCode) => {
    setCountry(code);
    setFixState({ status: "idle" });
  };

  /* ---------- Image & analysis ---------- */

  const [image, setImage] = useState<{ file: File; url: string } | null>(null);
  const [previewSize, setPreviewSize] = useState<{ width: number; height: number } | null>(null);
  const [previewFailed, setPreviewFailed] = useState(false);
  const [analysis, setAnalysis] = useState<ImageAnalysis | null>(null);
  const [stage, setStage] = useState<AnalysisStage | null>(null);
  const [analysisError, setAnalysisError] = useState<string | null>(null);
  const [showLandmarks, setShowLandmarks] = useState(true);
  const [isDragging, setIsDragging] = useState(false);
  const [tab, setTab] = useState<TabId | null>(null);
  const [fixState, setFixState] = useState<FixState>({ status: "idle" });
  const isFixing = fixState.status === "working";

  useEffect(() => {
    if (!image) return;
    return () => URL.revokeObjectURL(image.url);
  }, [image]);

  useEffect(
    () => () => {
      runIdRef.current += 1; // drop results from any in-flight analysis
      if (retainedModelsRef.current) {
        retainedModelsRef.current = false;
        releaseVisionModels();
      }
    },
    [],
  );

  // Cache Components keeps this page alive (hidden via <Activity>) after router.push to /preview.
  // Reset the fix progress when it's hidden so browser-back returns to the report, not a stuck spinner.
  useLayoutEffect(() => () => setFixState({ status: "idle" }), []);

  const handleFile = async (file: File) => {
    const runId = ++runIdRef.current;
    setAnalysis(null);
    setPreviewSize(null);
    setPreviewFailed(false);
    setAnalysisError(null);
    setTab(null);
    setFixState({ status: "idle" });

    const looksLikeImage = file.type.startsWith("image/") || /\.(jpe?g|png|webp|gif|bmp|heic|heif|avif)$/i.test(file.name);
    if (!looksLikeImage) {
      setImage(null);
      setAnalysisError("That file isn't an image. Please upload a JPEG, PNG, or WebP photo.");
      return;
    }
    setImage({ file, url: URL.createObjectURL(file) });

    if (!retainedModelsRef.current) {
      retainedModelsRef.current = true;
      retainVisionModels();
    }
    try {
      const result = await analyzePhoto(file, (s) => {
        if (runIdRef.current === runId) setStage(s);
      });
      if (runIdRef.current === runId) setAnalysis(result);
    } catch (err) {
      if (runIdRef.current === runId) setAnalysisError(messageOf(err, "Something went wrong while analyzing this photo. Please try another image."));
    } finally {
      if (runIdRef.current === runId) setStage(null);
    }
  };

  const onInputChange = (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) void handleFile(file);
    e.target.value = ""; // allow re-selecting the same file
  };

  const onDrop = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    setIsDragging(false);
    if (isFixing) return;
    const file = e.dataTransfer.files?.[0];
    if (file) void handleFile(file);
  };

  const onDragOver = (e: DragEvent<HTMLDivElement>) => {
    e.preventDefault();
    e.dataTransfer.dropEffect = "copy";
    if (!isDragging) setIsDragging(true);
  };

  const onDragLeave = (e: DragEvent<HTMLDivElement>) => {
    if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setIsDragging(false);
  };

  const openPicker = () => fileInputRef.current?.click();
  const onDropzoneKey = (e: KeyboardEvent<HTMLDivElement>) => {
    if (e.key === "Enter" || e.key === " ") {
      e.preventDefault();
      openPicker();
    }
  };

  const reset = () => {
    runIdRef.current += 1;
    setImage(null);
    setAnalysis(null);
    setPreviewSize(null);
    setPreviewFailed(false);
    setAnalysisError(null);
    setStage(null);
    setTab(null);
    setFixState({ status: "idle" });
  };

  /* ---------- Evaluation & report ---------- */

  const evaluation = useMemo(() => (analysis && requirements ? evaluatePhoto(analysis, requirements) : null), [analysis, requirements]);

  useEffect(() => {
    const canvas = overlayRef.current;
    if (canvas) drawOverlay(canvas, showLandmarks ? analysis : null, showLandmarks ? evaluation : null);
  }, [analysis, evaluation, showLandmarks, previewSize, previewFailed]);

  const { issues, toReview, counts } = useMemo(() => {
    const c: Record<CheckStatus, number> = { pass: 0, warning: 0, fail: 0, manual: 0, unavailable: 0 };
    const all = evaluation?.checks ?? [];
    for (const check of all) c[check.status]++;
    const rank = (s: CheckStatus) => (s === "fail" ? 0 : 1);
    return {
      issues: all.filter((x) => x.status === "fail" || x.status === "warning").sort((a, b) => rank(a.status) - rank(b.status)),
      toReview: all.filter((x) => x.status === "manual" || x.status === "unavailable"),
      counts: c,
    };
  }, [evaluation]);

  const groupedChecks = useMemo(() => {
    const groups: Record<CheckBasis, PhotoCheck[]> = { verified: [], estimate: [], manual: [] };
    for (const c of evaluation?.checks ?? []) groups[c.basis].push(c);
    return groups;
  }, [evaluation]);

  const requirementRows = useMemo(() => (requirements ? summarizeRequirements(requirements) : []), [requirements]);
  const isAnalyzing = stage !== null;
  const graded = counts.pass + counts.warning + counts.fail;
  const overlayWidth = 800;
  const overlayHeight = previewSize ? Math.round((overlayWidth * previewSize.height) / previewSize.width) : 1000;

  const tabs: { id: TabId; label: string }[] = evaluation
    ? [
        { id: "fix", label: `To fix (${issues.length})` },
        { id: "all", label: `All checks (${evaluation.checks.length})` },
        { id: "rules", label: "Rules" },
      ]
    : [];
  const activeTab: TabId = tab ?? (issues.length || toReview.length ? "fix" : "all");

  const onTabKey = (e: KeyboardEvent<HTMLButtonElement>) => {
    if (e.key !== "ArrowRight" && e.key !== "ArrowLeft") return;
    e.preventDefault();
    const i = tabs.findIndex((t) => t.id === activeTab);
    const next = tabs[(i + (e.key === "ArrowRight" ? 1 : tabs.length - 1)) % tabs.length];
    setTab(next.id);
    tabRefs.current[next.id]?.focus();
  };

  /* ---------- Fix: send the uploaded photo to the photo editor's pipeline ---------- */

  const handleAutoFix = async () => {
    if (!image || isFixing) return;
    setFixState({ status: "working", step: 0 });
    const ticker = setInterval(() => {
      setFixState((s) => (s.status === "working" ? { status: "working", step: Math.min(s.step + 1, FIX_STEPS.length - 1) } : s));
    }, 2200);
    try {
      const form = new FormData();
      form.append("image", await prepareUpload(image.file), "photo.jpg");
      form.append("country_code", country);
      form.append("document_type", "passport");
      const { resultId } = await apiUpload<PhotoProcessResult>("/photo/process", form);
      router.push(`/preview/${resultId}`);
    } catch (err) {
      setFixState({
        status: "error",
        message: err instanceof Error && err.message ? err.message : "We couldn't process your photo. Please try again.",
      });
    } finally {
      clearInterval(ticker);
    }
  };

  /* ---------- Render ---------- */

  const verdict = evaluation ? VERDICT_META[evaluation.verdict] : null;
  const bgSummary = evaluation?.background ?? null;
  const bgCheck = evaluation?.checks.find((c) => c.id === "background-color");
  const bgExtras = evaluation?.checks.filter((c) => c.id === "background-shadows" || c.id === "background-plain") ?? [];

  return (
    // Same frame as the photo editor: a tinted outer card around one raised panel.
    <div className="rounded-2xl border bg-gradient-to-b from-primary-subtle/60 via-surface to-surface p-2 sm:p-3">
      <div className="flex flex-col rounded-xl border border-border/60 bg-surface-raised">
        {/* ---------------- Header: country ---------------- */}
        <div className="flex flex-col gap-2 border-b p-4 sm:p-5 md:flex-row md:items-center md:justify-between md:gap-6">
          <div className="min-w-0">
            <label id={`${uid}-country-label`} htmlFor={`${uid}-country`} className="text-base font-semibold">
              Check against the rules for
            </label>
            <p className="text-sm text-muted-foreground">Upload the photo you plan to submit. We compare it with that country&rsquo;s published photo rules.</p>
          </div>
          <div className="w-full shrink-0 md:w-72">
            <CountryPicker id={`${uid}-country`} labelId={`${uid}-country-label`} value={country} onChange={handleCountryChange} disabled={isFixing} />
          </div>
        </div>

        <div className="grid gap-5 p-4 sm:p-5 lg:grid-cols-[minmax(0,5fr)_minmax(0,7fr)] lg:gap-8">
          {/* ---------------- Left: upload / preview ---------------- */}
          {/* Drag-and-drop is a pointer shortcut; keyboard and screen reader users get the same result from the drop zone button and "Another photo". */}
          {/* eslint-disable-next-line jsx-a11y/no-static-element-interactions */}
          <div className="flex min-w-0 flex-col gap-3" onDragOver={onDragOver} onDragEnter={onDragOver} onDragLeave={onDragLeave} onDrop={onDrop}>
            <input
              ref={fileInputRef}
              id={`${uid}-file`}
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={onInputChange}
              aria-describedby={`${uid}-privacy`}
              tabIndex={-1}
            />

            {!image ? (
              <div
                role="button"
                tabIndex={0}
                aria-label="Upload a photo to check. Drag and drop or press Enter to browse."
                onClick={openPicker}
                onKeyDown={onDropzoneKey}
                className={cn(
                  "flex min-h-72 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed p-6 text-center transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-ring",
                  isDragging ? "border-primary bg-primary-subtle" : "border-border-strong bg-surface hover:border-primary",
                )}
              >
                <span className="inline-flex size-12 items-center justify-center rounded-full bg-primary-subtle text-primary-subtle-foreground" aria-hidden="true">
                  <ImagePlus className="size-6" />
                </span>
                <span className="text-base font-semibold">{isDragging ? "Drop your photo here" : "Drag and drop your photo"}</span>
                <span className="pointer-events-none inline-flex h-9 items-center rounded-md bg-primary px-3 text-sm font-medium text-primary-foreground">Choose a photo</span>
                <span className="text-xs text-muted-foreground">JPEG, PNG, or WebP · the photo you plan to submit</span>
              </div>
            ) : (
              <figure className="flex flex-col gap-2">
                <div
                  className={cn(
                    "relative mx-auto w-full max-w-52 overflow-hidden rounded-xl border bg-photo-backdrop sm:max-w-76",
                    isDragging ? "border-primary ring-2 ring-primary" : "border-border",
                  )}
                  style={previewSize ? { aspectRatio: `${previewSize.width} / ${previewSize.height}` } : undefined}
                >
                  {previewFailed ? (
                    <div className="flex min-h-48 items-center justify-center p-6 text-center text-sm text-muted-foreground">Preview not available for this file.</div>
                  ) : (
                    // eslint-disable-next-line @next/next/no-img-element -- local blob preview, nothing to optimize
                    <img
                      src={image.url}
                      alt="Your upload"
                      className="block size-full object-contain"
                      onLoad={(e) => setPreviewSize({ width: e.currentTarget.naturalWidth, height: e.currentTarget.naturalHeight })}
                      onError={() => setPreviewFailed(true)}
                    />
                  )}
                  <canvas ref={overlayRef} width={overlayWidth} height={overlayHeight} className="pointer-events-none absolute inset-0 size-full" aria-hidden="true" />
                  {(isAnalyzing || isFixing) && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center gap-2 bg-surface-raised/80 p-4 text-center">
                      <Spinner className="size-8 border-4" />
                      <span className="text-xs font-semibold">{fixState.status === "working" ? FIX_STEPS[fixState.step] : stage ? STAGE_TEXT[stage] : ""}</span>
                    </div>
                  )}
                </div>
                <figcaption className="flex flex-wrap items-center justify-center gap-1">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowLandmarks((v) => !v)}
                    aria-pressed={showLandmarks}
                    disabled={!analysis?.face && !analysis?.detectorBoxes.length}
                  >
                    {showLandmarks ? <EyeOff className="size-4" aria-hidden="true" /> : <Eye className="size-4" aria-hidden="true" />}
                    {showLandmarks ? "Hide guides" : "Show guides"}
                  </Button>
                  <Button variant="ghost" size="sm" onClick={openPicker} disabled={isAnalyzing || isFixing}>
                    <ImagePlus className="size-4" aria-hidden="true" /> Another photo
                  </Button>
                  <Button variant="ghost" size="sm" onClick={reset} disabled={isFixing}>
                    <RotateCcw className="size-4" aria-hidden="true" /> Start over
                  </Button>
                </figcaption>
                {showLandmarks && evaluation?.eyeBand && analysis?.face && (
                  <p className="hidden text-center text-xs text-muted-foreground sm:block">Green band: where your eyes should be · dashed lines: crown (est.) and chin</p>
                )}
              </figure>
            )}

            <p id={`${uid}-privacy`} className="flex items-start gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="mt-0.5 size-3.5 shrink-0 text-primary" aria-hidden="true" />
              <span>
                The check runs on your device; your photo isn&rsquo;t uploaded unless you choose to fix it. See our{" "}
                <Link href="/privacy-policy" className="text-primary underline underline-offset-4">
                  privacy policy
                </Link>
                .
              </span>
            </p>
          </div>

          {/* ---------------- Right: verdict, background, results ---------------- */}
          <div className="flex min-w-0 flex-col gap-3" aria-busy={isAnalyzing || requirementsLoading}>
            {requirementsLoading && (
              <div role="status" className="flex items-center gap-2 rounded-md bg-surface p-3 text-sm">
                <Spinner />
                Loading photo requirements…
              </div>
            )}

            {requirementsError && (
              <Alert tone="danger" className="flex flex-wrap items-center gap-2">
                <CircleX className="size-4 shrink-0 text-danger" aria-hidden="true" />
                <span className="flex-1">{requirementsError}</span>
                <Button variant="outline" size="sm" onClick={() => setRequirementsReload((n) => n + 1)}>
                  <RefreshCw className="size-3.5" aria-hidden="true" /> Retry
                </Button>
              </Alert>
            )}

            {analysisError && (
              <Alert tone="danger" className="flex items-start gap-2">
                <CircleX className="mt-0.5 size-4 shrink-0 text-danger" aria-hidden="true" />
                <span>{analysisError}</span>
              </Alert>
            )}

            {analysis?.modelError && (
              <Alert tone="warning" className="flex items-start gap-2">
                <TriangleAlert className="mt-0.5 size-4 shrink-0 text-warning" aria-hidden="true" />
                <span>{analysis.modelError} File checks are still exact.</span>
              </Alert>
            )}

            {/* Before a result: what will be checked */}
            {requirements && !evaluation && (
              <div className="rounded-xl border bg-surface p-4">
                <h3 className="text-sm font-semibold">{requirements.country.name} passport photo rules</h3>
                <p className="mb-3 text-xs text-muted-foreground">
                  {isAnalyzing ? "Checking your photo against these rules…" : "Upload a photo and we’ll check it against these rules."}
                </p>
                <RulesList rows={requirementRows} />
              </div>
            )}

            {evaluation && requirements && verdict && (
              <>
                {/* Verdict */}
                <div role="status" className={cn("flex flex-wrap items-center gap-x-4 gap-y-3 rounded-xl border p-3 sm:p-4", verdict.tone)}>
                  <ScoreRing passed={counts.pass} graded={graded} className={verdict.text} />
                  <div className="min-w-0 flex-1 basis-48">
                    <p className="flex items-center gap-1.5 font-semibold">
                      <verdict.Icon className={cn("size-4 shrink-0", verdict.text)} aria-hidden="true" />
                      {verdict.title}
                    </p>
                    <p className="mt-0.5 text-xs text-muted-foreground">
                      {[
                        `${requirements.country.name} passport`,
                        counts.fail && `${counts.fail} failed`,
                        counts.warning && `${counts.warning} warning${counts.warning === 1 ? "" : "s"}`,
                        counts.manual + counts.unavailable && `${counts.manual + counts.unavailable} to check yourself`,
                      ]
                        .filter(Boolean)
                        .join(" · ")}
                    </p>
                  </div>
                  <Button
                    variant={evaluation.verdict === "pass" ? "outline" : "primary"}
                    size="sm"
                    className="w-full sm:w-auto"
                    onClick={handleAutoFix}
                    disabled={isFixing || isAnalyzing}
                  >
                    {isFixing ? <Spinner /> : <Wand2 className="size-4" aria-hidden="true" />}
                    {isFixing ? "Fixing your photo…" : evaluation.verdict === "pass" ? "Make it print-ready" : "Fix my photo automatically"}
                  </Button>
                  {fixState.status === "working" && (
                    <p className="w-full text-xs text-muted-foreground" aria-live="polite">
                      Using the photo you already uploaded. {FIX_STEPS[fixState.step]} This can take up to a minute.
                    </p>
                  )}
                  {fixState.status === "error" && (
                    <p role="alert" className="flex w-full items-start gap-1.5 text-xs font-medium text-danger">
                      <CircleX className="mt-0.5 size-3.5 shrink-0" aria-hidden="true" />
                      {fixState.message}
                    </p>
                  )}
                </div>

                {/* Background color */}
                {bgSummary && (
                  <div className="rounded-xl border p-3">
                    <div className="flex items-center justify-between gap-2">
                      <h3 className="text-sm font-semibold">Background color</h3>
                      {bgCheck && (
                        <span className={cn("rounded-full px-2 py-0.5 text-xs font-medium", STATUS_META[bgCheck.status].badge)}>{STATUS_META[bgCheck.status].label}</span>
                      )}
                    </div>
                    <div className="mt-2 flex flex-wrap items-center gap-x-3 gap-y-2">
                      <div className="flex min-w-0 items-center gap-2 sm:gap-3">
                        <Swatch
                          color={bgSummary.measuredRgb ? `rgb(${bgSummary.measuredRgb.join(" ")})` /* design-tokens-ignore-line: the photo's own pixels */ : null}
                          label="Your background"
                          caption={bgSummary.measuredLabel ? `Looks ${bgSummary.measuredLabel}` : "Couldn't measure"}
                        />
                        <ArrowRight className="size-4 shrink-0 text-muted-foreground" aria-hidden="true" />
                        {bgSummary.required.length ? (
                          bgSummary.required.map((spec) => <Swatch key={spec.label} color={spec.swatch} label="Required" caption={spec.label} />)
                        ) : (
                          <Swatch color={null} label="Required" caption={bgSummary.requirement} />
                        )}
                      </div>
                      {bgExtras.length > 0 && (
                        <ul className="flex flex-wrap gap-x-3 gap-y-1 text-xs sm:ml-auto">
                          {bgExtras.map((c) => (
                            <li key={c.id} className="flex items-center gap-1" title={c.suggestion}>
                              <StatusIcon status={c.status} className="size-3.5" />
                              {c.id === "background-shadows" ? "No shadows" : "Plain, no pattern"}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                )}

                {/* Results tabs */}
                <div>
                  <div role="tablist" aria-label="Check results" className="inline-flex flex-wrap gap-1 rounded-lg bg-surface p-1">
                    {tabs.map((t) => (
                      <button
                        key={t.id}
                        ref={(el) => {
                          tabRefs.current[t.id] = el;
                        }}
                        type="button"
                        role="tab"
                        id={`${uid}-tab-${t.id}`}
                        aria-selected={activeTab === t.id}
                        aria-controls={`${uid}-panel`}
                        tabIndex={activeTab === t.id ? 0 : -1}
                        className={cn(
                          "rounded-md px-3 py-1.5 text-sm font-medium transition-colors",
                          activeTab === t.id ? "bg-surface-raised text-foreground" : "text-muted-foreground hover:text-foreground",
                        )}
                        onClick={() => setTab(t.id)}
                        onKeyDown={onTabKey}
                      >
                        {t.label}
                      </button>
                    ))}
                  </div>

                  <div
                    role="tabpanel"
                    id={`${uid}-panel`}
                    aria-labelledby={`${uid}-tab-${activeTab}`}
                    // Focusable because the panel scrolls on large screens, so keyboard users can scroll it (as the ARIA tabs pattern recommends).
                    // eslint-disable-next-line jsx-a11y/no-noninteractive-tabindex
                    tabIndex={0}
                    className="mt-2 rounded-md focus-visible:outline-2 focus-visible:outline-ring lg:max-h-80 lg:overflow-y-auto lg:pr-1"
                  >
                    {activeTab === "fix" && (
                      <>
                        {issues.length ? (
                          <ul className="divide-y">
                            {issues.map((c) => (
                              <CheckRow key={c.id} check={c} />
                            ))}
                          </ul>
                        ) : (
                          <p className="flex items-center gap-2 py-2 text-sm text-success">
                            <CircleCheck className="size-4" aria-hidden="true" /> Nothing to fix in the measurable rules.
                          </p>
                        )}
                        {toReview.length > 0 && (
                          <>
                            <h4 className="mt-3 text-xs font-semibold tracking-wide text-muted-foreground uppercase">Check these yourself</h4>
                            <ul className="divide-y">
                              {toReview.map((c) => (
                                <CheckRow key={c.id} check={c} />
                              ))}
                            </ul>
                          </>
                        )}
                      </>
                    )}

                    {activeTab === "all" && (
                      <div className="flex flex-col gap-3">
                        {(Object.keys(BASIS_META) as CheckBasis[]).map((basis) => {
                          const list = groupedChecks[basis];
                          if (!list.length) return null;
                          const { title, Icon, blurb } = BASIS_META[basis];
                          return (
                            <section key={basis} aria-labelledby={`${uid}-${basis}`}>
                              <h4 id={`${uid}-${basis}`} className="flex flex-wrap items-center gap-1.5 text-xs font-semibold">
                                <Icon className="size-3.5 text-primary" aria-hidden="true" />
                                {title}
                                <span className="font-normal text-muted-foreground">· {blurb}</span>
                              </h4>
                              <ul className="mt-1.5 grid grid-cols-2 gap-1.5 sm:grid-cols-3">
                                {list.map((c) => (
                                  <CheckTile key={c.id} check={c} />
                                ))}
                              </ul>
                            </section>
                          );
                        })}
                      </div>
                    )}

                    {activeTab === "rules" && (
                      <div className="py-1">
                        <RulesList rows={requirementRows} />
                      </div>
                    )}
                  </div>
                </div>

                <p className="flex items-start gap-1.5 text-xs text-muted-foreground">
                  <Info className="mt-0.5 size-3 shrink-0" aria-hidden="true" />
                  A guide, not an official decision. Glare on glasses, hair over the face, and skin lighting aren&rsquo;t fully assessed.
                </p>
              </>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

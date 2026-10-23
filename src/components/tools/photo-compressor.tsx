"use client";

import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Alert, Field, Input } from "@/components/ui/field";
import { cn } from "@/lib/cn";

import { FileDrop } from "./file-drop";
import {
  baseName,
  canvasToBlob,
  createCanvas,
  downloadBlob,
  fillPhotoBackground,
  formatBytes,
  loadImage,
  type LoadedImage,
} from "./image-utils";

const PRESETS = [
  { kb: 240, label: "240 KB", note: "U.S. visa (DS-160)" },
  { kb: 500, label: "500 KB", note: "Common upload limit" },
  { kb: 1024, label: "1 MB", note: "Email-friendly" },
] as const;

const MIN_SIDE = 600;
const MIN_QUALITY = 0.4;
const MAX_QUALITY = 0.95;

type Result = { blob: Blob; url: string; width: number; height: number; quality: number };

/**
 * Re-encodes a photo as JPEG under a target file size, never going below
 * 600 px on the short side (the usual minimum for ID uploads).
 *
 * Each size is first tried at the lowest acceptable quality. If that's still
 * too large, no quality search can help, so we shrink straight to the size
 * that should fit — JPEG size grows roughly with pixel count — instead of
 * stepping down slowly. Once a size fits, quality is binary-searched upward.
 * A 12 MP phone photo needs about 10 encodes rather than dozens.
 */
async function compress(image: LoadedImage, targetBytes: number): Promise<Result> {
  const minScale = Math.min(1, MIN_SIDE / Math.min(image.width, image.height));
  let scale = 1;

  for (let attempt = 0; attempt < 8; attempt++) {
    const width = Math.round(image.width * scale);
    const height = Math.round(image.height * scale);
    const { canvas, context } = createCanvas(width, height);
    try {
      fillPhotoBackground(context);
      context.drawImage(image.element, 0, 0, width, height);

      const floor = await canvasToBlob(canvas, "image/jpeg", MIN_QUALITY);
      if (floor.size <= targetBytes) {
        let best = { blob: floor, quality: MIN_QUALITY };
        let low = MIN_QUALITY;
        let high = MAX_QUALITY;
        for (let step = 0; step < 6; step++) {
          const quality = (low + high) / 2;
          const blob = await canvasToBlob(canvas, "image/jpeg", quality);
          if (blob.size <= targetBytes) {
            best = { blob, quality };
            low = quality;
          } else {
            high = quality;
          }
        }
        return { ...best, width, height, url: URL.createObjectURL(best.blob) };
      }

      if (scale <= minScale) break;
      // Aim 5% under the estimate so the next size usually fits, and always shrink at least 10%.
      scale = Math.max(minScale, Math.min(scale * 0.9, scale * Math.sqrt(targetBytes / floor.size) * 0.95));
    } finally {
      // Free the bitmap now; iOS Safari caps total canvas memory and large photos hit it quickly.
      canvas.width = 0;
      canvas.height = 0;
    }
  }

  throw new Error("Couldn't get this photo under the target size without dropping below 600 px. Try a larger target.");
}

function parseTarget(value: string) {
  const kb = Math.round(Number(value));
  return Number.isFinite(kb) && kb >= 50 && kb <= 10000 ? kb : null;
}

export function PhotoCompressor() {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [targetInput, setTargetInput] = useState("240");
  const targetKb = parseTarget(targetInput);
  const [result, setResult] = useState<Result | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);

  // Release each object URL as soon as it's replaced, not only on unmount.
  useEffect(() => (image ? () => URL.revokeObjectURL(image.url) : undefined), [image]);
  useEffect(() => (result ? () => URL.revokeObjectURL(result.url) : undefined), [result]);

  async function onFile(file: File) {
    setError(null);
    setResult(null);
    try {
      const loaded = await loadImage(file);
      setImage(loaded);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn't open that image.");
    }
  }

  async function run() {
    if (!image || !targetKb) return;
    setBusy(true);
    setError(null);
    try {
      setResult(await compress(image, targetKb * 1024));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Compression failed.");
    } finally {
      setBusy(false);
    }
  }

  if (!image) {
    return (
      <div className="flex flex-col gap-4">
        <FileDrop onFile={onFile} label="Choose a photo to compress" />
        {error && <Alert tone="danger">{error}</Alert>}
      </div>
    );
  }

  return (
    <div className="grid gap-8 rounded-xl border bg-surface-raised p-5 shadow-sm sm:p-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,1fr)]">
      <div className="flex flex-col gap-6">
        <div>
          <p className="text-sm text-muted-foreground">Original</p>
          <p className="font-medium break-all">{image.file.name}</p>
          <p className="text-sm text-muted-foreground">
            {formatBytes(image.file.size)} · {image.width} × {image.height} px
          </p>
        </div>

        <fieldset className="flex flex-col gap-3">
          <legend className="text-sm font-medium">Target file size</legend>
          <div className="grid grid-cols-3 gap-2">
            {PRESETS.map((preset) => (
              <button
                key={preset.kb}
                type="button"
                aria-pressed={targetKb === preset.kb}
                onClick={() => setTargetInput(String(preset.kb))}
                className={cn(
                  "flex flex-col rounded-md border px-3 py-2 text-left transition-colors",
                  targetKb === preset.kb ? "border-primary bg-primary-subtle" : "hover:bg-muted",
                )}
              >
                <span className="text-sm font-semibold">{preset.label}</span>
                <span className="text-xs text-muted-foreground">{preset.note}</span>
              </button>
            ))}
          </div>
          <Field
            id="compress-custom"
            label="Or enter a size in KB"
            hint="Between 50 and 10,000 KB."
            errors={targetKb ? undefined : ["Enter a number between 50 and 10,000."]}
          >
            {(props) => (
              <Input
                {...props}
                type="number"
                inputMode="numeric"
                min={50}
                max={10000}
                value={targetInput}
                onChange={(event) => setTargetInput(event.target.value)}
              />
            )}
          </Field>
        </fieldset>

        <div className="flex flex-wrap gap-3">
          <Button onClick={run} disabled={busy || !targetKb}>
            {busy ? "Compressing…" : "Compress photo"}
          </Button>
          <Button
            variant="outline"
            onClick={() => {
              setImage(null);
              setResult(null);
            }}
          >
            Choose another photo
          </Button>
        </div>
        {error && <Alert tone="danger">{error}</Alert>}
      </div>

      <div className="flex flex-col gap-4">
        {result ? (
          <>
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview, nothing to optimize */}
            <img src={result.url} alt="Compressed result preview" className="max-h-80 w-full rounded-lg border bg-surface object-contain" />
            <dl className="grid grid-cols-2 gap-3 text-sm">
              <div className="rounded-md bg-surface p-3">
                <dt className="text-muted-foreground">New size</dt>
                <dd className="text-lg font-semibold text-success">{formatBytes(result.blob.size)}</dd>
              </div>
              <div className="rounded-md bg-surface p-3">
                <dt className="text-muted-foreground">Saved</dt>
                <dd className="text-lg font-semibold">{Math.max(0, Math.round((1 - result.blob.size / image.file.size) * 100))}%</dd>
              </div>
              <div className="rounded-md bg-surface p-3">
                <dt className="text-muted-foreground">Dimensions</dt>
                <dd className="font-medium">
                  {result.width} × {result.height} px
                </dd>
              </div>
              <div className="rounded-md bg-surface p-3">
                <dt className="text-muted-foreground">JPEG quality</dt>
                <dd className="font-medium">{Math.round(result.quality * 100)}%</dd>
              </div>
            </dl>
            {image.file.size <= result.blob.size && (
              <p className="text-sm text-muted-foreground">Your original was already under this size; the re-encoded copy isn&apos;t smaller.</p>
            )}
            <Button onClick={() => downloadBlob(result.blob, `${baseName(image.file)}-compressed.jpg`)}>Download JPEG</Button>
          </>
        ) : (
          <div className="flex min-h-56 flex-1 items-center justify-center rounded-lg border border-dashed bg-surface p-6 text-center text-sm text-muted-foreground">
            Pick a target size and select “Compress photo”. Your result appears here.
          </div>
        )}
      </div>
    </div>
  );
}

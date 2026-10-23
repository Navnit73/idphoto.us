"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { CheckIcon } from "@/components/home/icons";
import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/field";
import type { PhotoProcessResult } from "@/lib/api/types";
import { cn } from "@/lib/cn";
import { apiUpload, ClientApiError } from "@/lib/http/client";
import { DEFAULT_COUNTRY, getCountry, type CountryCode } from "@/lib/photo/countries";
import { PHOTO_RESULT_TTL_DAYS } from "@/lib/validation/forms";

import { CountryPicker } from "./country-picker";
import { FileDrop } from "./file-drop";
import { canvasToBlob, createCanvas, fillPhotoBackground, loadImage } from "./image-utils";

/** The largest output is 1300 × 1800 px, so a 2400 px long edge leaves the service plenty to crop from. */
const MAX_UPLOAD_EDGE = 2400;

/**
 * Re-encodes the photo as a JPEG of at most MAX_UPLOAD_EDGE px. Keeps uploads
 * small and fast, converts HEIC where the browser can decode it, and drops
 * metadata such as GPS location before anything leaves the device.
 */
async function prepareUpload(file: File): Promise<Blob> {
  const image = await loadImage(file);
  try {
    const scale = Math.min(1, MAX_UPLOAD_EDGE / Math.max(image.width, image.height));
    const { canvas, context } = createCanvas(Math.round(image.width * scale), Math.round(image.height * scale));
    fillPhotoBackground(context);
    context.drawImage(image.element, 0, 0, canvas.width, canvas.height);
    return await canvasToBlob(canvas, "image/jpeg", 0.92);
  } finally {
    URL.revokeObjectURL(image.url);
  }
}

type Status =
  | { kind: "idle" }
  | { kind: "working"; step: "preparing" | "processing" | "opening"; thumbUrl?: string }
  | { kind: "error"; message: string };

const TIPS = [
  "Look straight at the camera with a neutral face",
  "Eyes open, mouth closed",
  "Even light on your face and shoulders",
  "Plain, light-colored background",
];

const STEPS = [
  { key: "preparing", label: "Preparing your photo" },
  { key: "processing", label: "Checking your face and background, then cropping to size" },
  { key: "opening", label: "Opening your result" },
] as const;

/**
 * Upload-and-process passport photo tool: pick a country, drop a photo, and
 * PixPassport (via /api/photo/process) returns a cropped, sized result that
 * opens at /preview/<id>. Embeddable on tool and guide pages with `widget: photo-editor`.
 */
export function PhotoEditor({ country: initialCountry = DEFAULT_COUNTRY }: { country?: CountryCode }) {
  const router = useRouter();
  const [country, setCountry] = useState<CountryCode>(initialCountry);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const spec = getCountry(country);
  const thumbUrl = status.kind === "working" ? status.thumbUrl : undefined;

  useEffect(() => (thumbUrl ? () => URL.revokeObjectURL(thumbUrl) : undefined), [thumbUrl]);

  async function onFile(file: File) {
    setStatus({ kind: "working", step: "preparing" });
    try {
      const upload = await prepareUpload(file);
      const thumb = URL.createObjectURL(upload);
      setStatus({ kind: "working", step: "processing", thumbUrl: thumb });

      const form = new FormData();
      form.append("image", upload, "photo.jpg");
      form.append("country_code", country);
      form.append("document_type", "passport");
      const { resultId } = await apiUpload<PhotoProcessResult>("/photo/process", form);

      setStatus({ kind: "working", step: "opening", thumbUrl: thumb });
      router.push(`/preview/${resultId}`);
    } catch (error) {
      const message =
        error instanceof ClientApiError || error instanceof Error ? error.message : "Something went wrong. Please try again.";
      setStatus({ kind: "error", message });
    }
  }

  const working = status.kind === "working";

  return (
    <div className="flex flex-col gap-5">
      <div className="flex flex-col gap-2 rounded-xl border bg-surface-raised p-5 shadow-sm sm:p-6">
        <label htmlFor="photo-editor-country" className="text-base font-semibold">
          Select country / destination
        </label>
        <CountryPicker
          id="photo-editor-country"
          value={country}
          onChange={setCountry}
          disabled={working}
          describedBy={spec ? "photo-editor-country-hint" : undefined}
        />
        {spec && (
          <p id="photo-editor-country-hint" className="flex items-center gap-2 text-sm text-muted-foreground">
            <svg
              viewBox="0 0 24 24"
              aria-hidden="true"
              className="size-4 shrink-0"
              fill="none"
              stroke="currentColor"
              strokeWidth={1.75}
            >
              <circle cx="12" cy="12" r="9" />
              <path d="M3 12h18M12 3c2.5 2.6 3.8 5.6 3.8 9s-1.3 6.4-3.8 9c-2.5-2.6-3.8-5.6-3.8-9S9.5 5.6 12 3Z" />
            </svg>
            Passport photo sized to {spec.width} × {spec.height} px for {spec.name}
          </p>
        )}
      </div>

      <section
        aria-labelledby="photo-editor-upload-heading"
        className="flex flex-col gap-5 rounded-xl border bg-surface-raised p-5 shadow-sm sm:p-8"
      >
        <h3 id="photo-editor-upload-heading" className="text-base font-semibold">
          Upload or take your photo
        </h3>

        {working ? (
          <div
            role="status"
            aria-live="polite"
            className="flex min-h-56 flex-col items-center gap-6 rounded-xl border bg-surface p-6 sm:flex-row sm:items-center sm:p-8"
          >
            <div className="flex size-40 shrink-0 items-center justify-center overflow-hidden rounded-lg border bg-photo-backdrop">
              {status.thumbUrl ? (
                // eslint-disable-next-line @next/next/no-img-element -- local blob preview, nothing to optimize
                <img src={status.thumbUrl} alt="Your uploaded photo" className="size-full object-contain" />
              ) : (
                <span
                  aria-hidden="true"
                  className="size-10 animate-spin rounded-full border-4 border-border-strong border-t-primary"
                />
              )}
            </div>

            <div className="flex flex-col gap-4">
              <ol className="flex flex-col gap-3">
                {STEPS.map(({ key, label }, index) => {
                  const current = STEPS.findIndex((step) => step.key === status.step);
                  const state = index < current ? "done" : index === current ? "active" : "pending";
                  return (
                    <li
                      key={key}
                      aria-current={state === "active" ? "step" : undefined}
                      className="flex items-center gap-3 text-sm"
                    >
                      {state === "done" ? (
                        <span
                          aria-hidden="true"
                          className="flex size-5 items-center justify-center rounded-full bg-success text-primary-foreground"
                        >
                          <svg viewBox="0 0 16 16" className="size-3" fill="none" stroke="currentColor" strokeWidth={2.5}>
                            <path strokeLinecap="round" strokeLinejoin="round" d="m3.5 8.5 3 3 6-7" />
                          </svg>
                        </span>
                      ) : state === "active" ? (
                        <span
                          aria-hidden="true"
                          className="size-5 animate-spin rounded-full border-2 border-border-strong border-t-primary"
                        />
                      ) : (
                        <span aria-hidden="true" className="size-5 rounded-full border-2 border-border-strong" />
                      )}
                      <span className={cn(state === "active" ? "font-semibold text-foreground" : "text-muted-foreground")}>
                        {label}
                        {state === "done" && <span className="sr-only"> (done)</span>}
                      </span>
                    </li>
                  );
                })}
              </ol>
              {status.step === "processing" && (
                <p className="text-sm text-muted-foreground">This can take up to a minute. Please keep this page open.</p>
              )}
            </div>
          </div>
        ) : (
          <FileDrop
            onFile={onFile}
            label="Tap to upload a photo or take a picture"
            hint="Drag and drop from your device · JPEG, PNG, or WebP (up to 25 MB)"
            privacyNote={`Your photo is uploaded over an encrypted connection for processing. Your result page expires after ${PHOTO_RESULT_TTL_DAYS} days.`}
          />
        )}

        {status.kind === "error" && (
          <Alert tone="danger">
            <p>{status.message}</p>
            <Button variant="outline" size="sm" className="mt-3" onClick={() => setStatus({ kind: "idle" })}>
              Try another photo
            </Button>
          </Alert>
        )}

        <div className="flex flex-col gap-3 border-t pt-5">
          <h4 className="text-sm font-semibold">Quick acceptance tips</h4>
          <ul className="grid gap-x-8 gap-y-2.5 text-sm text-muted-foreground sm:grid-cols-2">
            {TIPS.map((tip) => (
              <li key={tip} className="flex items-center gap-2">
                <CheckIcon className="size-4 text-success" />
                {tip}
              </li>
            ))}
          </ul>
          <p className="text-xs text-muted-foreground">
            Read how we handle uploads in our{" "}
            <Link href="/privacy-policy" className="text-primary underline underline-offset-4">
              privacy policy
            </Link>
            .
          </p>
        </div>
      </section>
    </div>
  );
}

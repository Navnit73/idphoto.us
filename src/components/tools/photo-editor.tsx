"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";

import { Button } from "@/components/ui/button";
import { Alert, Field, Select } from "@/components/ui/field";
import type { PhotoProcessResult } from "@/lib/api/types";
import { apiUpload, ClientApiError } from "@/lib/http/client";
import { DEFAULT_COUNTRY, getCountry, PHOTO_COUNTRIES, type CountryCode } from "@/lib/photo/countries";
import { PHOTO_RESULT_TTL_DAYS } from "@/lib/validation/forms";

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

const STEP_LABELS = {
  preparing: "Preparing your photo…",
  processing: "Checking your face and background, then cropping to size…",
  opening: "Done! Opening your photo…",
};

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
    <div className="flex flex-col gap-5 rounded-xl border bg-surface-raised p-5 shadow-sm sm:p-8">
      <div className="max-w-sm">
        <Field
          id="photo-editor-country"
          label="Country"
          hint={spec ? `Passport photo · ${spec.width} × ${spec.height} px` : undefined}
        >
          {(props) => (
            <Select
              {...props}
              value={country}
              disabled={working}
              onChange={(event) => setCountry(event.target.value as CountryCode)}
            >
              {PHOTO_COUNTRIES.map((option) => (
                <option key={option.code} value={option.code}>
                  {option.name}
                </option>
              ))}
            </Select>
          )}
        </Field>
      </div>

      {working ? (
        <div
          role="status"
          aria-live="polite"
          className="flex min-h-56 flex-col items-center justify-center gap-4 rounded-xl border-2 border-dashed border-border-strong bg-surface p-8 text-center"
        >
          {status.thumbUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- local blob preview, nothing to optimize
            <img src={status.thumbUrl} alt="" className="max-h-40 w-auto animate-pulse rounded-md border" />
          ) : (
            <span aria-hidden="true" className="size-10 animate-spin rounded-full border-4 border-border-strong border-t-primary" />
          )}
          <p className="text-base font-semibold">{STEP_LABELS[status.step]}</p>
          {status.step === "processing" && <p className="text-sm text-muted-foreground">This can take up to a minute. Please keep this page open.</p>}
        </div>
      ) : (
        <FileDrop
          onFile={onFile}
          label="Upload your photo"
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

      <p className="text-sm text-muted-foreground">
        For best results, use a recent, front-facing photo in even light with nothing covering your face. Read how we handle
        uploads in our{" "}
        <Link href="/privacy-policy" className="text-primary underline underline-offset-4">
          privacy policy
        </Link>
        .
      </p>
    </div>
  );
}

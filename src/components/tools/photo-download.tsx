"use client";

import { useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

import { Button } from "@/components/ui/button";
import { Alert, Field, Input } from "@/components/ui/field";
import { apiPost, ClientApiError } from "@/lib/http/client";
import { fieldErrors, photoEmailSchema } from "@/lib/validation/forms";

type Status =
  { kind: "idle" } | { kind: "sending" } | { kind: "error"; message: string };

type PhotoDownloadProps = {
  resultId: string;
  previewSrc: string;
  downloadHref: string;
  alt: string;
  width: number;
  height: number;
  caption: React.ReactNode;
  /** Shown under the download form (notices, measurements, expiry). */
  children?: React.ReactNode;
};

const storageKey = (resultId: string) => `idphoto:emailed:${resultId}`;

function readEmailed(resultId: string) {
  try {
    return localStorage.getItem(storageKey(resultId)) === "1";
  } catch {
    return false;
  }
}

function rememberEmailed(resultId: string) {
  try {
    localStorage.setItem(storageKey(resultId), "1");
  } catch {
    // Storage unavailable: the visitor just enters their email again next time.
  }
}

const noopSubscribe = () => () => {};

function startDownload(href: string) {
  const link = document.createElement("a");
  link.href = href;
  link.rel = "noopener";
  document.body.append(link);
  link.click();
  link.remove();
}

/**
 * The result photo, a full-size dialog, and the download. The first download
 * asks for an email (the links are sent there); after that, this browser
 * downloads straight away for this result.
 */
export function PhotoDownload({
  resultId,
  previewSrc,
  downloadHref,
  alt,
  width,
  height,
  caption,
  children,
}: PhotoDownloadProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const emailRef = useRef<HTMLInputElement>(null);
  const [status, setStatus] = useState<Status>({ kind: "idle" });
  const [errors, setErrors] = useState<Record<string, string[]>>({});
  const [sentNow, setSentNow] = useState(false);
  const storedEmailed = useSyncExternalStore(
    noopSubscribe,
    () => readEmailed(resultId),
    () => false,
  );
  const unlocked = sentNow || storedEmailed;

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (unlocked) {
      startDownload(downloadHref);
      return;
    }

    const values = Object.fromEntries(
      new FormData(event.currentTarget),
    ) as Record<string, string>;
    const parsed = photoEmailSchema.safeParse({ ...values, resultId });
    if (!parsed.success) {
      // Render the error first, so focusing the field announces it through aria-describedby.
      flushSync(() => setErrors(fieldErrors(parsed.error)));
      emailRef.current?.focus();
      return;
    }

    setErrors({});
    setStatus({ kind: "sending" });
    try {
      await apiPost("/photo/email", parsed.data);
      rememberEmailed(resultId);
      setSentNow(true);
      setStatus({ kind: "idle" });
      startDownload(downloadHref);
    } catch (error) {
      if (error instanceof ClientApiError) {
        setErrors(error.fields);
        setStatus({ kind: "error", message: error.message });
      } else {
        setStatus({
          kind: "error",
          message: "Something went wrong. Please try again.",
        });
      }
    }
  }

  function downloadFromDialog() {
    if (unlocked) {
      startDownload(downloadHref);
      return;
    }
    dialogRef.current?.close();
    emailRef.current?.focus();
  }

  return (
    <div className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]">
      <figure className="flex flex-col items-center gap-2 lg:items-start">
        <button
          type="button"
          onClick={() => dialogRef.current?.showModal()}
          aria-label="View photo full size"
          className="cursor-zoom-in rounded-md"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- private, short-lived image; next/image would copy it into our cache */}
          <img
            src={previewSrc}
            alt={alt}
            width={width}
            height={height}
            className="h-auto max-h-[22rem] w-auto max-w-full rounded-md"
          />
        </button>
        <figcaption className="text-sm text-muted-foreground">
          {caption}
        </figcaption>
      </figure>

      <div className="flex flex-col gap-5">
        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-3">
          {!unlocked && (
            <Field
              id="photo-email-address"
              label="Email address"
              hint="We'll send you the download link. Used only for this message."
              errors={errors.email}
            >
              {(props) => (
                <Input
                  {...props}
                  ref={emailRef}
                  name="email"
                  type="email"
                  autoComplete="email"
                  required
                  maxLength={200}
                />
              )}
            </Field>
          )}

          {/* Honeypot: invisible to people and assistive tech; bots tend to fill it. */}
          <div
            aria-hidden="true"
            className="absolute -left-[9999px] h-px w-px overflow-hidden"
          >
            <label htmlFor="photo-email-website">Website</label>
            <input
              id="photo-email-website"
              name="website"
              type="text"
              tabIndex={-1}
              autoComplete="off"
            />
          </div>

          <Button
            type="submit"
            size="lg"
            className="sm:self-start"
            disabled={status.kind === "sending"}
          >
            {status.kind === "sending" ? "Sending…" : "Download photo"}
          </Button>
          {/* Always mounted so the confirmation is announced when it appears. */}
          <div role="status">
            {sentNow && (
              <p className="text-sm text-muted-foreground">
                We also emailed you the link. Check your spam folder if it
                isn&apos;t there.
              </p>
            )}
          </div>
          {status.kind === "error" && (
            <Alert tone="danger">{status.message}</Alert>
          )}
        </form>

        {children}
      </div>

      {/* Backdrop clicks are a pointer convenience; keyboard users close it with Escape or the Close button. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <dialog
        ref={dialogRef}
        aria-label="Your photo"
        onClick={(event) => {
          // A click on the backdrop lands on the <dialog> itself.
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="m-auto max-h-[90vh] max-w-[min(90vw,40rem)] rounded-xl bg-surface-raised p-4 text-foreground shadow-lg backdrop:bg-foreground/60"
      >
        <div className="flex flex-col items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
          <img
            src={previewSrc}
            alt={alt}
            width={width}
            height={height}
            className="h-auto max-h-[70vh] w-auto max-w-full rounded-md"
          />
          <div className="flex gap-3">
            <Button onClick={downloadFromDialog}>
              {unlocked ? "Download photo" : "Enter email to download"}
            </Button>
            <Button
              variant="outline"
              onClick={() => dialogRef.current?.close()}
            >
              Close
            </Button>
          </div>
        </div>
      </dialog>
    </div>
  );
}

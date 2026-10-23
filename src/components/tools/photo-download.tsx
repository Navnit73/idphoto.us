"use client";

import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import { flushSync } from "react-dom";

import {
  CheckIcon,
  ClockIcon,
  DownloadIcon,
  EyeIcon,
  ExpandIcon,
  MailIcon,
  ShieldIcon,
} from "@/components/home/icons";
import { Button } from "@/components/ui/button";
import { Alert, Field, Input } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import { apiPost, ClientApiError } from "@/lib/http/client";
import { fieldErrors, photoEmailSchema } from "@/lib/validation/forms";

type Status =
  { kind: "idle" } | { kind: "sending" } | { kind: "error"; message: string };

type PhotoDownloadProps = {
  resultId: string;
  /** The finished photo, as downloaded. */
  imageSrc: string;
  /** The photo with measurement guides drawn on, when the API provides one. */
  guidesSrc?: string;
  downloadHref: string;
  alt: string;
  width: number;
  height: number;
  /** Heading of the photo card, e.g. flag and document name. */
  title: React.ReactNode;
  /** Chip beside the title, e.g. the pixel size. */
  badge?: React.ReactNode;
  /** Short line under the photo, e.g. format and file size. */
  caption: React.ReactNode;
  /** Highlighted summary in the download panel. */
  summary: {
    title: React.ReactNode;
    meta: React.ReactNode;
    includes: string[];
  };
  /** When the result expires, for the panel's footer. */
  expires: React.ReactNode;
  /** Shown under the photo card (checks, help). */
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
 * The result photo with measurement guides, a full-size dialog, and a download
 * panel that stays in view: sticky beside the photo on wide screens, and
 * backed by a bottom bar on small ones until its button scrolls into view. The
 * first download asks for an email (the links are sent there); after that,
 * this browser downloads straight away for this result.
 */
export function PhotoDownload({
  resultId,
  imageSrc,
  guidesSrc,
  downloadHref,
  alt,
  width,
  height,
  title,
  badge,
  caption,
  summary,
  expires,
  children,
}: PhotoDownloadProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  const submitRef = useRef<HTMLButtonElement>(null);
  const [showGuides, setShowGuides] = useState(true);
  const [submitInView, setSubmitInView] = useState(false);
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

  // The mobile download bar hides while the real download button is fully on screen.
  useEffect(() => {
    const submit = submitRef.current;
    if (!submit) return;
    const observer = new IntersectionObserver(
      ([entry]) => setSubmitInView(entry.isIntersecting),
      {
        threshold: 1,
      },
    );
    observer.observe(submit);
    return () => observer.disconnect();
  }, []);

  // Discourage saving the photo outside the download flow. Only a deterrent:
  // the image URL is still reachable through dev tools.
  useEffect(() => {
    const block = (event: MouseEvent) => event.preventDefault();
    document.addEventListener("contextmenu", block);
    return () => document.removeEventListener("contextmenu", block);
  }, []);

  function downloadFromBar() {
    if (unlocked) {
      startDownload(downloadHref);
      return;
    }
    emailRef.current?.scrollIntoView({ block: "center" });
    emailRef.current?.focus({ preventScroll: true });
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
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-5">
      <section
        aria-labelledby="photo-card-heading"
        className="overflow-hidden rounded-xl border border-border bg-surface-raised lg:col-start-1 lg:row-start-1"
      >
        <div className="flex flex-wrap items-center justify-between gap-x-3 gap-y-1.5 border-b border-border px-4 py-2.5">
          <h2
            id="photo-card-heading"
            className="font-display text-base font-semibold tracking-tight"
          >
            {title}
          </h2>
          {badge}
        </div>

        <figure className="m-0">
          {/* Fixed height, so switching between the two images doesn't move the page. */}
          <div className="flex h-[min(27svh,14.5rem)] justify-center bg-surface p-3.5 sm:h-[min(43svh,25rem)] sm:p-5">
            <button
              type="button"
              onClick={() => dialogRef.current?.showModal()}
              aria-label="View photo full size"
              className="h-full max-w-full cursor-zoom-in rounded-sm"
            >
              {/* eslint-disable-next-line @next/next/no-img-element -- private, short-lived image; next/image would copy it into our cache */}
              <img
                src={guidesSrc && showGuides ? guidesSrc : imageSrc}
                alt={
                  guidesSrc && showGuides
                    ? `${alt}, with measurement guides`
                    : alt
                }
                width={width}
                height={height}
                draggable={false}
                className="h-full w-auto max-w-full rounded-sm border border-border bg-photo-backdrop object-contain select-none"
              />
            </button>
          </div>
          <figcaption className="flex flex-wrap items-center justify-between gap-x-4 gap-y-1.5 border-t border-border px-4 py-1.5 text-sm text-muted-foreground max-sm:justify-center">
            <span className="max-sm:sr-only">{caption}</span>
            <span className="flex gap-1">
              {guidesSrc && (
                <Button
                  variant="ghost"
                  size="sm"
                  aria-pressed={showGuides}
                  onClick={() => setShowGuides((value) => !value)}
                  className="aria-pressed:text-primary"
                >
                  <EyeIcon className="size-4" />
                  Guides
                </Button>
              )}
              <Button
                variant="ghost"
                size="sm"
                onClick={() => dialogRef.current?.showModal()}
              >
                <ExpandIcon className="size-4" />
                Full size
              </Button>
            </span>
          </figcaption>
        </figure>
      </section>

      <aside
        aria-labelledby="download-heading"
        className="flex flex-col gap-4 rounded-xl border border-border bg-surface-raised p-4 sm:p-5 lg:sticky lg:top-20 lg:col-start-2 lg:row-span-2 lg:row-start-1 lg:self-start"
      >
        <h2
          id="download-heading"
          className="flex items-center gap-2 text-xs font-semibold tracking-wide text-muted-foreground uppercase"
        >
          <ShieldIcon className="size-4 text-primary" />
          Your download
        </h2>

        {/* After the form on small screens, so email and button come right after the photo. */}
        <div className="rounded-lg border-2 border-primary bg-primary-subtle p-3.5 max-lg:order-last">
          <div className="flex items-start justify-between gap-3">
            <p className="font-display font-semibold tracking-tight">
              {summary.title}
            </p>
            <span className="shrink-0 rounded-full bg-primary px-2 py-0.5 text-xs font-semibold text-primary-foreground">
              {summary.meta}
            </span>
          </div>
          <ul className="mt-2.5 flex flex-col gap-1.5 text-sm">
            {summary.includes.map((item) => (
              <li key={item} className="flex items-center gap-2">
                <CheckIcon className="size-4 text-success" />
                {item}
              </li>
            ))}
          </ul>
        </div>

        <form noValidate onSubmit={onSubmit} className="flex flex-col gap-2.5">
          {!unlocked && (
            <Field
              id="photo-email-address"
              label="Email for delivery"
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
                  placeholder="you@example.com"
                  required
                  maxLength={200}
                  className="h-11 shadow-none!"
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
            ref={submitRef}
            type="submit"
            size="lg"
            className="h-11 w-full font-semibold shadow-none!"
            disabled={status.kind === "sending"}
          >
            <DownloadIcon />
            {status.kind === "sending" ? "Sending…" : "Download photo"}
          </Button>
          {/* Always mounted so the confirmation is announced when it appears. */}
          <div role="status">
            {sentNow && (
              <p className="flex gap-2 text-sm text-muted-foreground">
                <MailIcon className="mt-0.5 size-4 text-success" />
                We also emailed you the link. Check your spam folder if it
                isn&apos;t there.
              </p>
            )}
          </div>
          {status.kind === "error" && (
            <Alert tone="danger">{status.message}</Alert>
          )}
        </form>

        <ul className="flex flex-wrap justify-center gap-x-4 gap-y-1.5 border-t border-border pt-3 text-xs text-muted-foreground">
          <li className="flex items-center gap-1.5">
            <DownloadIcon className="size-4 text-primary" />
            Instant download
          </li>
          <li className="flex items-center gap-1.5">
            <MailIcon className="size-4 text-primary" />
            Link sent by email
          </li>
          <li className="flex items-center gap-1.5">
            <ClockIcon className="size-4 text-primary" />
            Available until {expires}
          </li>
        </ul>
      </aside>

      {children && (
        <div className="flex flex-col gap-4 lg:col-start-1 lg:row-start-2">
          {children}
        </div>
      )}

      {/* Small screens: keep the download one tap away until the form's own button is visible. */}
      <div
        className={cn(
          "fixed inset-x-0 bottom-0 z-40 border-t border-border bg-surface-raised px-gutter pt-2.5 pb-[max(0.625rem,env(safe-area-inset-bottom))] transition-transform lg:hidden",
          submitInView && "pointer-events-none translate-y-full",
        )}
        inert={submitInView}
      >
        <Button
          size="lg"
          className="h-11 w-full font-semibold shadow-none!"
          onClick={downloadFromBar}
        >
          <DownloadIcon />
          Download photo
        </Button>
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
        className="m-auto max-h-[90vh] max-w-[min(90vw,40rem)] rounded-xl border border-border bg-surface-raised p-4 text-foreground backdrop:bg-foreground/60"
      >
        <div className="flex flex-col items-center gap-4">
          {/* eslint-disable-next-line @next/next/no-img-element -- see above */}
          <img
            src={imageSrc}
            alt={alt}
            width={width}
            height={height}
            draggable={false}
            className="h-auto max-h-[70vh] w-auto max-w-full rounded-md select-none"
          />
          <div className="flex gap-3">
            <Button onClick={downloadFromDialog} className="shadow-none!">
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

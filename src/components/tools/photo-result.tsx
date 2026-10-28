"use client";

import { useRef, useState } from "react";

import { CameraIcon, ExpandIcon, XIcon } from "@/components/home/icons";

type PhotoResultProps = {
  /**
   * The photo shown before purchase: the guides preview when the API provides
   * one. The full-resolution file is only ever served after payment.
   */
  imageSrc: string;
  alt: string;
  width: number;
  height: number;
  /** Heading above the photo, in the photo column. */
  intro?: React.ReactNode;
  /** Status chips under the photo, e.g. background check and sizing. */
  chips?: React.ReactNode;
  /** Short line under the photo, e.g. format and file size. */
  caption: React.ReactNode;
  /** Side panel: checkout, or the link to an existing order. */
  panel: React.ReactNode;
  /** Shown under the photo (measurements, help). */
  children?: React.ReactNode;
};

// Discourage saving the preview outside checkout. Only a deterrent, scoped to
// the photo so the rest of the page keeps its context menu.
const blockContextMenu = (event: React.MouseEvent) => event.preventDefault();

/**
 * The result photo on a parchment stage with a full-size dialog, beside a
 * panel that stays in view: sticky next to the photo from tablet width up,
 * below it on phones. The intro sits in the photo column, so the panel (and
 * its pay button) starts at the top of the page.
 */
export function PhotoResult({ intro, imageSrc, alt, width, height, chips, caption, panel, children }: PhotoResultProps) {
  const dialogRef = useRef<HTMLDialogElement>(null);
  // Upstream preview files can be removed before our record expires.
  const [failed, setFailed] = useState(false);

  return (
    // The last row is flexible, so the panel spanning all rows can't stretch the gaps above the photo.
    <div className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:grid-rows-[auto_auto_1fr] md:gap-x-8 md:gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-x-10">
      {intro && <div className="md:col-start-1 md:row-start-1">{intro}</div>}

      <section aria-label="Your photo" className="flex flex-col gap-3 md:col-start-1 md:row-start-2">
        <div className="relative flex justify-center rounded-xl bg-surface px-4 py-5 sm:px-6 sm:py-8">
          {failed ? (
            <div className="flex h-[min(32svh,15rem)] flex-col items-center justify-center gap-2 text-center sm:h-[min(44svh,22rem)] lg:h-[min(44svh,23rem)]">
              <CameraIcon className="size-8 text-muted-foreground" />
              <p className="font-semibold">The preview couldn&apos;t be loaded</p>
              <p className="max-w-xs text-sm text-muted-foreground">
                Refresh the page to try again. Your photo and its measurements are still saved.
              </p>
            </div>
          ) : (
            <>
            {/* Pointer shortcut only; the labelled round button below is the accessible control. */}
            <button
              type="button"
              tabIndex={-1}
              aria-hidden="true"
              onClick={() => dialogRef.current?.showModal()}
              className="h-[min(32svh,15rem)] max-w-full cursor-zoom-in rounded-md sm:h-[min(44svh,22rem)] lg:h-[min(44svh,23rem)]"
            >
              {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/no-noninteractive-element-interactions -- private, short-lived image; next/image would copy it into our cache. onContextMenu only suppresses the menu. */}
              <img
                src={imageSrc}
                alt={alt}
                width={width}
                height={height}
                draggable={false}
                onContextMenu={blockContextMenu}
                onError={() => setFailed(true)}
                // The server-rendered image may fail before hydration, when onError isn't attached yet.
                ref={(img) => {
                  if (img?.complete && img.naturalWidth === 0) setFailed(true);
                }}
                className="h-full w-auto max-w-full rounded-md border border-border bg-photo-backdrop object-contain select-none"
              />
            </button>
            <button
              type="button"
              onClick={() => dialogRef.current?.showModal()}
              aria-label="View photo full size"
              className="absolute top-2 right-2 flex size-11 items-center justify-center rounded-full border border-border bg-background/80 text-foreground backdrop-blur-md transition-transform hover:bg-background active:scale-95"
            >
              <ExpandIcon className="size-4" />
            </button>
            </>
          )}
        </div>

        <div className="flex flex-wrap items-center justify-between gap-x-4 gap-y-2">
          {chips && <ul className="flex flex-wrap gap-2 text-sm">{chips}</ul>}
          <p className="text-sm text-muted-foreground">{caption}</p>
        </div>
      </section>

      <aside
        aria-labelledby="panel-heading"
        className="md:sticky md:top-[calc(var(--layout-header-height)+1rem)] md:col-start-2 md:row-span-3 md:row-start-1 md:self-start"
      >
        {panel}
      </aside>

      {children && <div className="flex flex-col gap-6 md:col-start-1 md:row-start-3">{children}</div>}

      {/* Backdrop clicks are a pointer convenience; keyboard users close it with Escape or the Close button. */}
      {/* eslint-disable-next-line jsx-a11y/click-events-have-key-events, jsx-a11y/no-noninteractive-element-interactions */}
      <dialog
        ref={dialogRef}
        aria-label="Your photo"
        onClick={(event) => {
          // A click on the backdrop lands on the <dialog> itself.
          if (event.target === event.currentTarget) event.currentTarget.close();
        }}
        className="m-auto max-h-[92vh] max-w-[min(92vw,44rem)] overflow-visible rounded-xl bg-surface p-4 text-foreground backdrop:bg-overlay sm:p-6"
      >
        {/* eslint-disable-next-line @next/next/no-img-element, jsx-a11y/no-noninteractive-element-interactions -- see above */}
        <img
          src={imageSrc}
          alt={alt}
          width={width}
          height={height}
          draggable={false}
          onContextMenu={blockContextMenu}
          className="h-auto max-h-[80vh] w-auto max-w-full rounded-md border border-border bg-photo-backdrop select-none"
        />
        <button
          type="button"
          onClick={() => dialogRef.current?.close()}
          aria-label="Close"
          className="absolute -top-3 -right-3 flex size-11 items-center justify-center rounded-full border border-border bg-background text-foreground transition-transform active:scale-95"
        >
          <XIcon className="size-4" />
        </button>
      </dialog>
    </div>
  );
}

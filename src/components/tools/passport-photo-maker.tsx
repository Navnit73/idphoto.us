"use client";

import { useEffect, useRef, useState } from "react";

import { Button } from "@/components/ui/button";
import { Alert } from "@/components/ui/field";

import { FileDrop } from "./file-drop";
import { baseName, canvasToBlob, createCanvas, downloadBlob, fillPhotoBackground, loadImage, type LoadedImage } from "./image-utils";

/**
 * U.S. passport geometry on a 2 × 2 in photo: the head (chin to top of hair)
 * must be 1 to 1⅜ in tall — 50% to 68.75% of the photo height. We fix the chin
 * line and show the band where the top of the head must fall.
 */
const CHIN = 0.8;
const HEAD_MIN = 0.5;
const HEAD_MAX = 0.6875;
const TOP_BAND = { from: CHIN - HEAD_MAX, to: CHIN - HEAD_MIN };

const OUTPUT_PX = 600; // 2 in at 300 DPI
const MAX_ZOOM = 4;
const NUDGE = 0.01;

/** Image placement in "frame units": the square frame is 1 × 1. */
type View = { zoom: number; x: number; y: number };

function baseScale(image: LoadedImage) {
  return 1 / Math.min(image.width, image.height);
}

/** Keeps the photo covering the whole frame so no empty edges reach the output. */
function clampView(image: LoadedImage, view: View): View {
  const zoom = Math.min(MAX_ZOOM, Math.max(1, view.zoom));
  const scale = baseScale(image) * zoom;
  const width = image.width * scale;
  const height = image.height * scale;
  return {
    zoom,
    x: Math.min(0, Math.max(1 - width, view.x)),
    y: Math.min(0, Math.max(1 - height, view.y)),
  };
}

function centeredView(image: LoadedImage): View {
  const scale = baseScale(image);
  return clampView(image, { zoom: 1, x: (1 - image.width * scale) / 2, y: (1 - image.height * scale) / 2 });
}

/** Zooms around the frame's center point. */
function zoomTo(image: LoadedImage, view: View, zoom: number): View {
  const before = baseScale(image) * view.zoom;
  const after = baseScale(image) * Math.min(MAX_ZOOM, Math.max(1, zoom));
  const centerX = (0.5 - view.x) / before;
  const centerY = (0.5 - view.y) / before;
  return clampView(image, { zoom, x: 0.5 - centerX * after, y: 0.5 - centerY * after });
}

async function renderPhoto(image: LoadedImage, view: View) {
  const scale = baseScale(image) * view.zoom;
  const { canvas, context } = createCanvas(OUTPUT_PX, OUTPUT_PX);
  fillPhotoBackground(context);
  context.drawImage(image.element, -view.x / scale, -view.y / scale, 1 / scale, 1 / scale, 0, 0, OUTPUT_PX, OUTPUT_PX);
  return canvas;
}

/** 4 × 6 in print at 300 DPI holds exactly six 2 × 2 in photos (3 × 2). */
async function renderSheet(photo: HTMLCanvasElement) {
  const { canvas, context } = createCanvas(OUTPUT_PX * 3, OUTPUT_PX * 2);
  fillPhotoBackground(context);
  for (let row = 0; row < 2; row++) {
    for (let column = 0; column < 3; column++) context.drawImage(photo, column * OUTPUT_PX, row * OUTPUT_PX);
  }
  return canvas;
}

type Output = { photo: Blob; sheet: Blob; previewUrl: string };

export function PassportPhotoMaker() {
  const [image, setImage] = useState<LoadedImage | null>(null);
  const [view, setView] = useState<View>({ zoom: 1, x: 0, y: 0 });
  const [output, setOutput] = useState<Output | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [busy, setBusy] = useState(false);
  const frame = useRef<HTMLDivElement>(null);
  const drag = useRef<{ pointerId: number; startX: number; startY: number; view: View } | null>(null);

  // Release each object URL as soon as it's replaced, not only on unmount: a
  // session of several photos would otherwise keep every one of them in memory.
  useEffect(() => (image ? () => URL.revokeObjectURL(image.url) : undefined), [image]);
  useEffect(() => (output ? () => URL.revokeObjectURL(output.previewUrl) : undefined), [output]);

  async function onFile(file: File) {
    setError(null);
    setOutput(null);
    try {
      const loaded = await loadImage(file);
      setImage(loaded);
      setView(centeredView(loaded));
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn't open that image.");
    }
  }

  /** Every view change goes through here so a previously created photo never outlives the crop it was made from. */
  function update(next: View) {
    if (!image) return;
    setView(clampView(image, next));
    setOutput(null);
  }

  function onPointerDown(event: React.PointerEvent<HTMLDivElement>) {
    if (event.button !== 0) return;
    event.currentTarget.setPointerCapture(event.pointerId);
    drag.current = { pointerId: event.pointerId, startX: event.clientX, startY: event.clientY, view };
  }

  function onPointerMove(event: React.PointerEvent<HTMLDivElement>) {
    const state = drag.current;
    const size = frame.current?.clientWidth;
    if (!state || state.pointerId !== event.pointerId || !size) return;
    update({
      ...state.view,
      x: state.view.x + (event.clientX - state.startX) / size,
      y: state.view.y + (event.clientY - state.startY) / size,
    });
  }

  function endDrag() {
    drag.current = null;
  }

  function onKeyDown(event: React.KeyboardEvent<HTMLDivElement>) {
    if (!image) return;
    const moves: Record<string, [number, number]> = {
      ArrowLeft: [-NUDGE, 0],
      ArrowRight: [NUDGE, 0],
      ArrowUp: [0, -NUDGE],
      ArrowDown: [0, NUDGE],
    };
    if (moves[event.key]) {
      event.preventDefault();
      const [dx, dy] = moves[event.key];
      update({ ...view, x: view.x + dx, y: view.y + dy });
    } else if (event.key === "+" || event.key === "=") {
      event.preventDefault();
      update(zoomTo(image, view, view.zoom + 0.05));
    } else if (event.key === "-") {
      event.preventDefault();
      update(zoomTo(image, view, view.zoom - 0.05));
    }
  }

  async function create() {
    if (!image) return;
    setBusy(true);
    setError(null);
    try {
      const photoCanvas = await renderPhoto(image, view);
      const [photo, sheet] = await Promise.all([
        canvasToBlob(photoCanvas, "image/jpeg", 0.92),
        renderSheet(photoCanvas).then((canvas) => canvasToBlob(canvas, "image/jpeg", 0.92)),
      ]);
      setOutput({ photo, sheet, previewUrl: URL.createObjectURL(photo) });
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Couldn't create the photo.");
    } finally {
      setBusy(false);
    }
  }

  if (!image) {
    return (
      <div className="flex flex-col gap-4">
        <FileDrop onFile={onFile} label="Choose a photo of yourself" />
        {error && <Alert tone="danger">{error}</Alert>}
      </div>
    );
  }

  const scale = baseScale(image) * view.zoom;
  const name = baseName(image.file);

  return (
    <div className="grid gap-8 rounded-xl border bg-surface-raised p-5 shadow-sm sm:p-8 lg:grid-cols-[minmax(0,26rem)_minmax(0,1fr)]">
      <div className="flex flex-col gap-4">
        <div
          ref={frame}
          role="application"
          aria-label="Photo crop area. Drag or use arrow keys to move the photo; plus and minus keys to zoom."
          aria-describedby="crop-instructions"
          tabIndex={0}
          onPointerDown={onPointerDown}
          onPointerMove={onPointerMove}
          onPointerUp={endDrag}
          onPointerCancel={endDrag}
          onKeyDown={onKeyDown}
          className="relative aspect-square w-full cursor-grab touch-none overflow-hidden rounded-lg border bg-muted select-none active:cursor-grabbing"
        >
          {/* eslint-disable-next-line @next/next/no-img-element -- local blob being cropped, not a page asset */}
          <img
            src={image.url}
            alt=""
            draggable={false}
            className="pointer-events-none absolute max-w-none"
            style={{
              left: `${view.x * 100}%`,
              top: `${view.y * 100}%`,
              width: `${image.width * scale * 100}%`,
              height: `${image.height * scale * 100}%`,
            }}
          />
          <svg viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true" className="pointer-events-none absolute inset-0 size-full">
            <rect x="0" y={TOP_BAND.from * 100} width="100" height={(TOP_BAND.to - TOP_BAND.from) * 100} className="fill-primary/15" />
            <g className="stroke-primary" strokeWidth="0.5" vectorEffect="non-scaling-stroke" strokeDasharray="2 1.5">
              <line x1="0" x2="100" y1={TOP_BAND.from * 100} y2={TOP_BAND.from * 100} />
              <line x1="0" x2="100" y1={TOP_BAND.to * 100} y2={TOP_BAND.to * 100} />
              <line x1="50" x2="50" y1="0" y2="100" />
            </g>
            <line x1="0" x2="100" y1={CHIN * 100} y2={CHIN * 100} className="stroke-danger" strokeWidth="0.6" />
          </svg>
          <span className="pointer-events-none absolute top-1 right-2 rounded-sm bg-background/80 px-1.5 text-xs">Top of head zone</span>
          <span className="pointer-events-none absolute right-2 rounded-sm bg-background/80 px-1.5 text-xs text-danger" style={{ top: `calc(${CHIN * 100}% + 0.25rem)` }}>
            Chin line
          </span>
        </div>

        <label className="flex flex-col gap-2 text-sm font-medium">
          Zoom
          <input
            type="range"
            min={1}
            max={MAX_ZOOM}
            step={0.01}
            value={view.zoom}
            onChange={(event) => update(zoomTo(image, view, Number(event.target.value)))}
            className="accent-primary"
          />
        </label>
      </div>

      <div className="flex flex-col gap-6">
        <div id="crop-instructions" className="flex flex-col gap-3 text-sm">
          <h2 className="text-lg font-semibold">Line up your photo</h2>
          <ol className="list-decimal space-y-1.5 pl-5 text-muted-foreground">
            <li>Drag the photo so your face is centered on the vertical line.</li>
            <li>Zoom until your chin sits on the red chin line.</li>
            <li>Check that the top of your head (including hair) falls inside the shaded zone.</li>
          </ol>
          <p className="text-muted-foreground">
            This sets the head size to 1–1⅜ inches on a 2 × 2 inch photo. It doesn&apos;t change the background, lighting, or
            expression — those still need to meet the requirements.
          </p>
        </div>

        <div className="flex flex-wrap gap-3">
          <Button onClick={create} disabled={busy}>
            {busy ? "Creating…" : "Create passport photo"}
          </Button>
          <Button variant="outline" onClick={() => update(centeredView(image))}>
            Reset
          </Button>
          <Button
            variant="ghost"
            onClick={() => {
              setImage(null);
              setOutput(null);
            }}
          >
            Choose another photo
          </Button>
        </div>

        {error && <Alert tone="danger">{error}</Alert>}

        {output && (
          <div className="flex flex-col gap-4 rounded-lg border bg-surface p-4 sm:flex-row sm:items-start">
            {/* eslint-disable-next-line @next/next/no-img-element -- local blob preview */}
            <img src={output.previewUrl} alt="Your cropped 2 by 2 inch passport photo" className="size-32 shrink-0 rounded-md border" />
            <div className="flex flex-col gap-3">
              <p className="text-sm text-muted-foreground">
                <strong className="text-foreground">Digital:</strong> 600 × 600 px JPEG for online forms.{" "}
                <strong className="text-foreground">Print:</strong> 4 × 6 in sheet with six photos — print at actual size, no
                scaling or borders, then cut along the edges.
              </p>
              <div className="flex flex-wrap gap-2">
                <Button size="sm" onClick={() => downloadBlob(output.photo, `${name}-passport-600px.jpg`)}>
                  Download digital photo
                </Button>
                <Button size="sm" variant="outline" onClick={() => downloadBlob(output.sheet, `${name}-passport-4x6-sheet.jpg`)}>
                  Download 4 × 6 print sheet
                </Button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

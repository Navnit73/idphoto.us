"use client";

import { useId, useState } from "react";

import { cn } from "@/lib/cn";

import { ACCEPTED_TYPES } from "./image-utils";

/** Accessible file picker that also accepts drag-and-drop. */
export function FileDrop({
  ref,
  onFile,
  label,
  hint = "JPEG, PNG, or WebP up to 25 MB · drag and drop or tap to choose",
  className,
  privacyNote = "Processed on your device. Nothing is uploaded.",
}: {
  /** The file input, e.g. to return focus to it after an error. */
  ref?: React.Ref<HTMLInputElement>;
  onFile: (file: File) => void;
  label: string;
  hint?: string;
  className?: string;
  /** Must say truthfully where the photo goes. */
  privacyNote?: string;
}) {
  const id = useId();
  const labelId = `${id}-label`;
  const hintId = `${id}-hint`;
  const privacyId = `${id}-privacy`;
  const [dragging, setDragging] = useState(false);

  return (
    // Drag-and-drop is a pointer shortcut; keyboard and screen reader users get the same result from the file input.
    // eslint-disable-next-line jsx-a11y/no-noninteractive-element-interactions
    <label
      htmlFor={id}
      onDragOver={(event) => {
        event.preventDefault();
        setDragging(true);
      }}
      onDragLeave={(event) => {
        // dragleave also fires when moving onto a child element; only reset when the pointer leaves the drop zone.
        if (!event.currentTarget.contains(event.relatedTarget as Node | null)) setDragging(false);
      }}
      onDrop={(event) => {
        event.preventDefault();
        setDragging(false);
        const file = event.dataTransfer.files[0];
        if (file) onFile(file);
      }}
      className={cn(
        "flex min-h-48 cursor-pointer flex-col items-center justify-center gap-2 rounded-xl border-2 border-dashed border-border-strong bg-surface p-5 text-center sm:min-h-56 sm:p-8 transition-colors hover:border-primary focus-within:border-primary has-[:focus-visible]:outline-2 has-[:focus-visible]:outline-offset-2 has-[:focus-visible]:outline-ring",
        dragging && "border-primary bg-primary-subtle",
        className,
      )}
    >
      <span className="mb-2 flex size-14 items-center justify-center rounded-xl border bg-surface-raised text-primary shadow-sm">
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-7" fill="none" stroke="currentColor" strokeWidth={1.75}>
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M20 13v5a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h7M17 3v6m-3-3h6M4 17l4.5-4.5a1.5 1.5 0 0 1 2.1 0L15 17m-1.5-1.5 1.4-1.4a1.5 1.5 0 0 1 2.1 0L20 17"
          />
          <circle cx="8.5" cy="8.5" r="1.5" />
        </svg>
      </span>
      <span id={labelId} className="text-lg font-semibold text-balance sm:text-xl">
        {label}
      </span>
      <span id={hintId} className="text-sm text-pretty text-muted-foreground sm:text-base">
        {hint}
      </span>
      <span id={privacyId} className="mt-1 max-w-md text-xs text-pretty text-muted-foreground">
        {privacyNote}
      </span>
      {/* Named by the label text alone; the format and privacy notes are its description. */}
      <input
        ref={ref}
        id={id}
        aria-labelledby={labelId}
        aria-describedby={`${hintId} ${privacyId}`}
        type="file"
        accept={ACCEPTED_TYPES}
        className="sr-only"
        onChange={(event) => {
          const file = event.target.files?.[0];
          if (file) onFile(file);
          event.target.value = "";
        }}
      />
    </label>
  );
}

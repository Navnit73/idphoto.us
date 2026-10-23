"use client";

import { useId, useState } from "react";

import { cn } from "@/lib/cn";

import { ACCEPTED_TYPES } from "./image-utils";

/** Accessible file picker that also accepts drag-and-drop. */
export function FileDrop({ onFile, label, className }: { onFile: (file: File) => void; label: string; className?: string }) {
  const id = useId();
  const [dragging, setDragging] = useState(false);

  return (
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
        "flex min-h-56 cursor-pointer flex-col items-center justify-center gap-3 rounded-xl border-2 border-dashed border-border-strong bg-surface p-8 text-center transition-colors hover:border-primary focus-within:border-primary",
        dragging && "border-primary bg-primary-subtle",
        className,
      )}
    >
      <svg viewBox="0 0 24 24" aria-hidden="true" className="size-10 text-primary" fill="none" stroke="currentColor" strokeWidth={1.5}>
        <path strokeLinecap="round" strokeLinejoin="round" d="M12 16V4m0 0-4 4m4-4 4 4M4 16v2a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-2" />
      </svg>
      <span className="text-base font-semibold">{label}</span>
      <span className="text-sm text-muted-foreground">JPEG, PNG, or WebP up to 25 MB · drag and drop or tap to choose</span>
      <span className="text-xs text-muted-foreground">Processed on your device. Nothing is uploaded.</span>
      <input
        id={id}
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

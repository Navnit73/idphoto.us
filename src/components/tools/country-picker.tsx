"use client";

import { useEffect, useId, useRef, useState } from "react";

import { cn } from "@/lib/cn";
import { displayCode, flagEmoji, getCountry, PHOTO_COUNTRIES, type CountryCode } from "@/lib/photo/countries";

function matchesQuery(country: (typeof PHOTO_COUNTRIES)[number], query: string) {
  const needle = query.trim().toLowerCase();
  if (!needle) return true;
  return [country.name, country.code, displayCode(country.code)].some((text) => text.toLowerCase().includes(needle));
}

/**
 * Searchable country dropdown: a button that opens a search box over a listbox.
 * Follows the ARIA combobox pattern, so arrow keys move through the matches,
 * Enter picks one, and Escape closes it.
 */
export function CountryPicker({
  id,
  labelId,
  value,
  onChange,
  disabled,
  describedBy,
}: {
  id: string;
  /** The visible label's id. The trigger is named by the label plus the selected country, so both are announced. */
  labelId: string;
  value: CountryCode;
  onChange: (code: CountryCode) => void;
  disabled?: boolean;
  describedBy?: string;
}) {
  const listId = useId();
  const valueId = `${id}-value`;
  const rootRef = useRef<HTMLDivElement>(null);
  const triggerRef = useRef<HTMLButtonElement>(null);
  const searchRef = useRef<HTMLInputElement>(null);
  const listRef = useRef<HTMLUListElement>(null);
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [active, setActive] = useState(0);

  const selected = getCountry(value);
  const matches = PHOTO_COUNTRIES.filter((country) => matchesQuery(country, query));
  const optionId = (code: CountryCode) => `${listId}-${code}`;

  function openList() {
    setQuery("");
    setActive(Math.max(0, PHOTO_COUNTRIES.findIndex((country) => country.code === value)));
    setOpen(true);
  }

  function close({ refocus = true } = {}) {
    setOpen(false);
    if (refocus) triggerRef.current?.focus();
  }

  function choose(code: CountryCode) {
    onChange(code);
    close();
  }

  useEffect(() => {
    if (open) searchRef.current?.focus();
  }, [open]);

  // Keep the highlighted option visible while arrowing through a long list.
  useEffect(() => {
    if (open) listRef.current?.querySelector(`[data-index="${active}"]`)?.scrollIntoView({ block: "nearest" });
  }, [open, active]);

  // Close when the user clicks or taps anywhere outside the picker.
  useEffect(() => {
    if (!open) return;
    function onPointerDown(event: PointerEvent) {
      if (!rootRef.current?.contains(event.target as Node)) close({ refocus: false });
    }
    document.addEventListener("pointerdown", onPointerDown);
    return () => document.removeEventListener("pointerdown", onPointerDown);
  }, [open]);

  function onSearchKeyDown(event: React.KeyboardEvent<HTMLInputElement>) {
    switch (event.key) {
      case "ArrowDown":
        event.preventDefault();
        setActive((index) => Math.min(index + 1, matches.length - 1));
        break;
      case "ArrowUp":
        event.preventDefault();
        setActive((index) => Math.max(index - 1, 0));
        break;
      case "Enter":
        event.preventDefault();
        if (matches[active]) choose(matches[active].code);
        break;
      case "Escape":
        event.preventDefault();
        close();
        break;
      case "Tab":
        close({ refocus: false });
        break;
    }
  }

  return (
    <div ref={rootRef} className="relative">
      <button
        ref={triggerRef}
        id={id}
        type="button"
        disabled={disabled}
        aria-haspopup="listbox"
        aria-labelledby={`${labelId} ${valueId}`}
        aria-expanded={open}
        aria-controls={open ? listId : undefined}
        aria-describedby={describedBy}
        onClick={() => (open ? close() : openList())}
        onKeyDown={(event) => {
          if (!open && (event.key === "ArrowDown" || event.key === "ArrowUp")) {
            event.preventDefault();
            openList();
          }
        }}
        className="flex h-12 w-full items-center gap-3 rounded-lg border border-input bg-background px-4 text-left text-base font-medium text-foreground shadow-sm transition-colors hover:border-muted-foreground focus-visible:border-ring focus-visible:outline-1 focus-visible:outline-offset-0 disabled:opacity-50 sm:h-14 sm:text-lg"
      >
        {selected && (
          <>
            <span aria-hidden="true">{flagEmoji(selected.code)}</span>
            <span id={valueId} className="min-w-0 flex-1 truncate">
              {selected.name} ({displayCode(selected.code)})
              <span className="hidden sm:inline">
                {" "}
                — {selected.width} × {selected.height} px
              </span>
            </span>
          </>
        )}
        <svg
          viewBox="0 0 20 20"
          aria-hidden="true"
          className={cn("size-5 shrink-0 text-muted-foreground transition-transform", open && "rotate-180")}
          fill="none"
          stroke="currentColor"
          strokeWidth={1.75}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="m5 7.5 5 5 5-5" />
        </svg>
      </button>

      {open && (
        <div className="absolute inset-x-0 top-full z-20 mt-2 overflow-hidden rounded-lg border bg-surface-raised shadow-lg">
          <div className="border-b p-2">
            <div className="relative">
              <svg
                viewBox="0 0 24 24"
                aria-hidden="true"
                className="pointer-events-none absolute top-1/2 left-3 size-5 -translate-y-1/2 text-muted-foreground"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.75}
              >
                <circle cx="11" cy="11" r="7" />
                <path strokeLinecap="round" d="m20 20-4-4" />
              </svg>
              <input
                ref={searchRef}
                type="text"
                role="combobox"
                aria-label="Search country"
                aria-expanded="true"
                aria-controls={listId}
                aria-autocomplete="list"
                aria-activedescendant={matches[active] ? optionId(matches[active].code) : undefined}
                autoComplete="off"
                spellCheck={false}
                placeholder="Search country…"
                value={query}
                onChange={(event) => {
                  setQuery(event.target.value);
                  setActive(0);
                }}
                onKeyDown={onSearchKeyDown}
                className="h-11 w-full rounded-md border border-input bg-background pr-3 pl-10 text-base text-foreground placeholder:text-muted-foreground focus-visible:border-ring focus-visible:outline-1 focus-visible:outline-offset-0"
              />
            </div>
          </div>

          <ul ref={listRef} id={listId} role="listbox" aria-label="Countries" className="max-h-[min(20rem,50dvh)] overflow-y-auto overscroll-contain py-1">
            {matches.map((country, index) => (
              // Keyboard selection happens in the search box (aria-activedescendant), so options only need pointer handlers.
              // eslint-disable-next-line jsx-a11y/click-events-have-key-events
              <li
                key={country.code}
                id={optionId(country.code)}
                data-index={index}
                role="option"
                aria-selected={country.code === value}
                // Keep focus in the search box so the keyboard keeps working after a click.
                onMouseDown={(event) => event.preventDefault()}
                onMouseMove={() => setActive(index)}
                onClick={() => choose(country.code)}
                className={cn(
                  "flex cursor-pointer items-center gap-3 px-3 py-2.5 text-base sm:px-4",
                  index === active && "bg-primary-subtle text-primary-subtle-foreground",
                  country.code === value && "font-semibold",
                )}
              >
                <span aria-hidden="true">{flagEmoji(country.code)}</span>
                <span className="min-w-0 flex-1">{country.name}</span>
                <span className="shrink-0 text-sm text-muted-foreground tabular-nums">
                  {country.width}×{country.height}px
                </span>
              </li>
            ))}
          </ul>
          {/* Always mounted so screen readers hear the match count change as you type. */}
          <p role="status" className={matches.length ? "sr-only" : "px-4 py-6 text-center text-sm text-muted-foreground"}>
            {matches.length
              ? `${matches.length} ${matches.length === 1 ? "country" : "countries"}`
              : `No country matches “${query.trim()}”.`}
          </p>
        </div>
      )}
    </div>
  );
}

"use client";

import { useLayoutEffect, useSyncExternalStore } from "react";

import { cn } from "@/lib/cn";
import { isTheme, THEME_STORAGE_KEY, type Theme } from "@/lib/theme";

const listeners = new Set<() => void>();

function readTheme(): Theme {
  try {
    const stored = localStorage.getItem(THEME_STORAGE_KEY);
    return isTheme(stored) ? stored : "light";
  } catch {
    return "light";
  }
}

function applyTheme(theme: Theme) {
  const root = document.documentElement;
  if (theme === "system") root.removeAttribute("data-theme");
  else root.setAttribute("data-theme", theme);
}

function setTheme(theme: Theme) {
  try {
    if (theme === "system") localStorage.removeItem(THEME_STORAGE_KEY);
    else localStorage.setItem(THEME_STORAGE_KEY, theme);
  } catch {
    // Storage unavailable (private mode, blocked cookies): still apply for this page.
  }
  applyTheme(theme);
  listeners.forEach((listener) => listener());
}

function subscribe(listener: () => void) {
  // Keep tabs in sync when the theme changes elsewhere.
  const onStorage = (event: StorageEvent) => {
    if (event.key !== THEME_STORAGE_KEY && event.key !== null) return;
    applyTheme(readTheme());
    listener();
  };
  listeners.add(listener);
  window.addEventListener("storage", onStorage);
  return () => {
    listeners.delete(listener);
    window.removeEventListener("storage", onStorage);
  };
}

const options: { value: Theme; label: string; icon: React.ReactNode }[] = [
  { value: "system", label: "System theme", icon: <MonitorIcon /> },
  { value: "light", label: "Light theme", icon: <SunIcon /> },
  { value: "dark", label: "Dark theme", icon: <MoonIcon /> },
];

export function ThemeToggle({ className }: { className?: string }) {
  const theme = useSyncExternalStore(subscribe, readTheme, () => "light" as const);

  // Strict Mode's dev remount resets <html> attributes set by the inline
  // script; re-apply before paint. No-op in production.
  useLayoutEffect(() => applyTheme(readTheme()), []);

  return (
    <div
      role="group"
      aria-label="Color theme"
      className={cn(
        "inline-flex items-center gap-0.5 rounded-full border bg-surface p-0.5",
        className,
      )}
    >
      {options.map((option) => (
        <button
          key={option.value}
          type="button"
          aria-label={option.label}
          aria-pressed={theme === option.value}
          onClick={() => setTheme(option.value)}
          className={cn(
            "inline-flex size-7 items-center justify-center rounded-full transition-colors",
            theme === option.value
              ? "bg-surface-raised text-foreground shadow-sm"
              : "text-muted-foreground hover:text-foreground",
          )}
        >
          {option.icon}
        </button>
      ))}
    </div>
  );
}

function Icon({ children }: { children: React.ReactNode }) {
  return (
    <svg
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth={2}
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
      className="size-4"
    >
      {children}
    </svg>
  );
}

function MonitorIcon() {
  return (
    <Icon>
      <rect x="2" y="3" width="20" height="14" rx="2" />
      <path d="M8 21h8M12 17v4" />
    </Icon>
  );
}

function SunIcon() {
  return (
    <Icon>
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.93 4.93l1.41 1.41M17.66 17.66l1.41 1.41M2 12h2M20 12h2M6.34 17.66l-1.41 1.41M19.07 4.93l-1.41 1.41" />
    </Icon>
  );
}

function MoonIcon() {
  return (
    <Icon>
      <path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z" />
    </Icon>
  );
}

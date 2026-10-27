"use client";

import { useEffect, useState } from "react";

import { cn } from "@/lib/cn";

/**
 * The green rule along the bottom of the sticky header. Shown at the top of
 * the page and faded out once the page scrolls. Before hydration it's simply
 * visible, so nothing depends on JavaScript.
 */
export function HeaderRule() {
  const [scrolled, setScrolled] = useState(false);

  useEffect(() => {
    // React skips the re-render when the value hasn't flipped, so this is cheap on every scroll event.
    const update = () => setScrolled(window.scrollY > 0);
    update();
    window.addEventListener("scroll", update, { passive: true });
    return () => window.removeEventListener("scroll", update);
  }, []);

  return (
    <div
      aria-hidden="true"
      className={cn(
        "pointer-events-none absolute inset-x-0 bottom-0 h-[3px] bg-header-rule transition-opacity duration-300 motion-reduce:transition-none",
        scrolled && "opacity-0",
      )}
    />
  );
}

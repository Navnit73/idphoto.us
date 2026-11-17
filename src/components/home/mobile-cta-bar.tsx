"use client";

import { useEffect, useState } from "react";

import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/cn";

import { ArrowRightIcon } from "./icons";

/** Bottom action bar on phones, shown once the hero buttons have scrolled above the viewport. */
export function MobileCtaBar({ href }: { href: string }) {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const actions = document.getElementById("hero-actions");
    if (!actions) return;

    const observer = new IntersectionObserver(([entry]) =>
      setVisible(!entry.isIntersecting && entry.boundingClientRect.top < 0),
    );
    observer.observe(actions);
    return () => observer.disconnect();
  }, []);

  return (
    <div
      inert={!visible}
      className={cn(
        "fixed inset-x-0 bottom-0 z-30 border-t bg-background/95 px-4 pt-3 pb-[calc(0.75rem+env(safe-area-inset-bottom))] backdrop-blur-md transition-transform duration-300 md:hidden",
        visible ? "translate-y-0" : "translate-y-full",
      )}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="min-w-0">
          <p className="truncate text-sm font-semibold">Passport photo online</p>
          <p className="truncate text-xs text-muted-foreground">Free preview, ready in minutes</p>
        </div>
        <a href={href} className={buttonVariants({ className: "shrink-0" })}>
          Make photo
          <ArrowRightIcon className="size-4" />
        </a>
      </div>
    </div>
  );
}

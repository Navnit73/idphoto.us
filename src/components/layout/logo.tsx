import Link from "next/link";

import { siteConfig } from "@/config/site";

export function Logo() {
  return (
    <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
      <span aria-hidden="true" className="flex size-8 items-center justify-center rounded-lg bg-primary text-primary-foreground">
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} className="size-4">
          <rect x="4" y="3" width="16" height="18" rx="2" />
          <circle cx="12" cy="10" r="3" />
          <path d="M7 18c1-2.5 3-3.5 5-3.5s4 1 5 3.5" />
        </svg>
      </span>
      {siteConfig.name}
    </Link>
  );
}

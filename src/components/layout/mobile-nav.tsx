"use client";

import Link from "next/link";
import { useRef } from "react";

type NavItem = { label: string; href: string };

/** Disclosure menu for small screens; works before hydration, closes on navigation. */
export function MobileNav({ items }: { items: readonly NavItem[] }) {
  const details = useRef<HTMLDetailsElement>(null);
  const close = () => details.current?.removeAttribute("open");

  return (
    <details ref={details} className="group sm:hidden">
      <summary className="flex size-9 cursor-pointer list-none items-center justify-center rounded-md border hover:bg-muted [&::-webkit-details-marker]:hidden">
        <span className="sr-only">Menu</span>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" className="group-open:hidden" />
          <path d="M6 6l12 12M18 6 6 18" className="hidden group-open:block" />
        </svg>
      </summary>
      <nav aria-label="Mobile" className="absolute inset-x-0 top-full border-b bg-background shadow-md">
        <ul className="flex flex-col px-gutter py-2">
          {items.map((item) => (
            <li key={item.href}>
              <Link href={item.href} onClick={close} className="block py-3 text-base font-medium">
                {item.label}
              </Link>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}

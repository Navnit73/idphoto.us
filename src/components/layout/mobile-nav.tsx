"use client";

import { usePathname } from "next/navigation";
import { Suspense, useEffect, useRef } from "react";

import { NavLink } from "./nav-link";

type NavItem = { label: string; href: string };

/** The header persists across navigations, so any route change (logo, footer, back button) must close the menu. */
function CloseOnNavigate({ details }: { details: React.RefObject<HTMLDetailsElement | null> }) {
  const pathname = usePathname();
  useEffect(() => {
    details.current?.removeAttribute("open");
  }, [details, pathname]);
  return null;
}

/** Disclosure menu for small screens; works before hydration, closes on navigation, Escape, or a tap outside. */
export function MobileNav({ items }: { items: readonly NavItem[] }) {
  const details = useRef<HTMLDetailsElement>(null);

  useEffect(() => {
    function onPointerDown(event: PointerEvent) {
      if (details.current?.open && !details.current.contains(event.target as Node)) details.current.removeAttribute("open");
    }
    function onKeyDown(event: KeyboardEvent) {
      if (event.key !== "Escape" || !details.current?.open) return;
      details.current.removeAttribute("open");
      details.current.querySelector("summary")?.focus();
    }
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, []);

  return (
    <details ref={details} className="group sm:hidden">
      <summary className="flex size-9 cursor-pointer list-none items-center justify-center rounded-md border hover:bg-muted [&::-webkit-details-marker]:hidden">
        <span className="sr-only">Menu</span>
        <svg viewBox="0 0 24 24" aria-hidden="true" className="size-5" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round">
          <path d="M4 7h16M4 12h16M4 17h16" className="group-open:hidden" />
          <path d="M6 6l12 12M18 6 6 18" className="hidden group-open:block" />
        </svg>
      </summary>
      {/* Reads the URL, which dynamic routes only know at request time. */}
      <Suspense fallback={null}>
        <CloseOnNavigate details={details} />
      </Suspense>
      <nav aria-label="Mobile" className="absolute inset-x-0 top-full border-b bg-background shadow-md">
        <ul className="flex flex-col px-gutter py-2">
          {items.map((item) => (
            <li key={item.href}>
              {/* Tapping the current page's link doesn't change the pathname, so close explicitly too. */}
              <NavLink
                href={item.href}
                onClick={() => details.current?.removeAttribute("open")}
                className="block py-3 text-base font-medium text-muted-foreground"
              >
                {item.label}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>
    </details>
  );
}

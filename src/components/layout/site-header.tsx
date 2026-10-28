"use client";

import { usePathname } from "next/navigation";
import { Suspense, useCallback, useEffect, useState } from "react";

import { ArrowRightIcon, MenuIcon, XIcon } from "@/components/home/icons";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";

import { Logo } from "./logo";
import { NavLink } from "./nav-link";

const CTA = { label: "Make photo", href: "/#photo-tool" };

/** Calls `onChange` when the route changes. Reads the URL, which dynamic routes only know at request time. */
function OnNavigate({ onChange }: { onChange: () => void }) {
  const pathname = usePathname();
  useEffect(() => onChange(), [pathname, onChange]);
  return null;
}

export function SiteHeader() {
  const [open, setOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const close = useCallback(() => setOpen(false), []);

  // Show the bottom border only once the page has scrolled.
  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8);
    onScroll();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Close the mobile menu with Escape.
  useEffect(() => {
    if (!open) return;
    const onKey = (event: KeyboardEvent) => event.key === "Escape" && setOpen(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open]);

  return (
    <header
      className={cn(
        "sticky top-0 z-40 border-b bg-background/85 backdrop-blur-md transition-colors",
        scrolled || open ? "border-border" : "border-transparent",
      )}
    >
      <a
        href="#main"
        className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-md focus:bg-background focus:px-3 focus:py-2"
      >
        Skip to content
      </a>
      {/* The header persists across navigations, so any route change (logo, footer, back button) closes the menu. */}
      <Suspense fallback={null}>
        <OnNavigate onChange={close} />
      </Suspense>
      <Container className="flex h-header items-center justify-between gap-4">
        <Logo />

        <nav aria-label="Main" className="hidden md:block">
          <ul className="flex items-center gap-1">
            {siteConfig.nav.map((item) => (
              <li key={item.href}>
                <NavLink
                  href={item.href}
                  className="rounded-md px-3 py-2 text-sm font-medium text-muted-foreground transition-colors hover:text-foreground"
                  activeClassName="bg-muted text-foreground"
                >
                  {item.label}
                </NavLink>
              </li>
            ))}
          </ul>
        </nav>

        <div className="hidden items-center gap-3 md:flex">
          <ThemeToggle />
          <a href={CTA.href} className={buttonVariants({ size: "sm" })}>
            {CTA.label}
            <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
          </a>
        </div>

        <button
          type="button"
          onClick={() => setOpen((value) => !value)}
          aria-expanded={open}
          aria-controls="mobile-nav"
          aria-label={open ? "Close menu" : "Open menu"}
          className="flex size-10 items-center justify-center rounded-lg text-foreground hover:bg-muted md:hidden"
        >
          {open ? <XIcon /> : <MenuIcon />}
        </button>
      </Container>

      <nav
        id="mobile-nav"
        aria-label="Mobile"
        className={cn(
          "grid overflow-hidden transition-[grid-template-rows] duration-200 md:hidden",
          open ? "grid-rows-[1fr]" : "grid-rows-[0fr]",
        )}
      >
        <div className="min-h-0" inert={!open}>
          <Container className="flex flex-col gap-1 border-t py-3">
            {siteConfig.nav.map((item) => (
              <NavLink
                key={item.href}
                href={item.href}
                // Tapping the current page's link doesn't change the pathname, so close explicitly too.
                onClick={close}
                className="rounded-lg px-3 py-2.5 text-sm font-medium text-muted-foreground hover:bg-muted hover:text-foreground"
                activeClassName="bg-muted text-foreground"
              >
                {item.label}
              </NavLink>
            ))}
            <div className="mt-2 flex items-center justify-between gap-3 px-3">
              <span className="text-sm text-muted-foreground">Theme</span>
              <ThemeToggle />
            </div>
            <a href={CTA.href} onClick={close} className={buttonVariants({ className: "mt-2" })}>
              {CTA.label}
            </a>
          </Container>
        </div>
      </nav>
    </header>
  );
}

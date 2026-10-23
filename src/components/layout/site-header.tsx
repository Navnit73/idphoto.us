import Link from "next/link";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

import { MobileNav } from "./mobile-nav";
import { NavLink } from "./nav-link";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <a href="#main" className="sr-only focus:not-sr-only focus:absolute focus:top-2 focus:left-2 focus:rounded-md focus:bg-background focus:px-3 focus:py-2">
        Skip to content
      </a>
      <Container className="flex h-header items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <span aria-hidden="true" className="inline-flex size-7 items-center justify-center rounded-md bg-primary text-xs text-primary-foreground">
            ID
          </span>
          {siteConfig.name}
        </Link>

        <div className="flex items-center gap-3 sm:gap-6">
          <nav aria-label="Main" className="hidden sm:block">
            <ul className="flex items-center gap-6 text-sm text-muted-foreground">
              {siteConfig.nav.map((item) => (
                <li key={item.href}>
                  <NavLink href={item.href} className="transition-colors hover:text-foreground">
                    {item.label}
                  </NavLink>
                </li>
              ))}
            </ul>
          </nav>
          <ThemeToggle />
          <MobileNav items={siteConfig.nav} />
        </div>
      </Container>
    </header>
  );
}

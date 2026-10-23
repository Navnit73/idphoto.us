import Link from "next/link";

import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

export function SiteHeader() {
  return (
    <header className="sticky top-0 z-40 border-b bg-background/85 backdrop-blur">
      <Container className="flex h-header items-center justify-between gap-6">
        <Link href="/" className="flex items-center gap-2 font-display text-lg font-semibold tracking-tight">
          <span aria-hidden="true" className="inline-flex size-7 items-center justify-center rounded-md bg-primary text-xs text-primary-foreground">
            ID
          </span>
          {siteConfig.name}
        </Link>

        <div className="flex items-center gap-6">
          <nav aria-label="Main" className="hidden sm:block">
            <ul className="flex items-center gap-6 text-sm text-muted-foreground">
              {siteConfig.nav.map((item) => (
                <li key={item.href}>
                  <Link href={item.href} className="transition-colors hover:text-foreground">
                    {item.label}
                  </Link>
                </li>
              ))}
            </ul>
          </nav>
          <ThemeToggle />
        </div>
      </Container>
    </header>
  );
}

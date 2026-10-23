import Link from "next/link";

import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

export function SiteFooter() {
  return (
    <footer className="border-t bg-surface">
      <Container className="flex flex-col gap-10 py-12">
        <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div className="flex flex-col gap-3">
            <p className="font-display text-lg font-semibold">{siteConfig.name}</p>
            <p className="max-w-xs text-sm text-muted-foreground">{siteConfig.description}</p>
          </div>
          {siteConfig.footer.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <p className="text-sm font-semibold">{group.title}</p>
              <ul className="mt-3 flex flex-col gap-2 text-sm text-muted-foreground">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link href={link.href} className="transition-colors hover:text-foreground">
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <p className="border-t pt-6 text-xs text-muted-foreground">
          {siteConfig.name} is an independent website. It is not affiliated with, endorsed by, or acting on behalf of the U.S.
          Department of State, USCIS, or any government agency. Official requirements are set and enforced by those agencies.
        </p>
      </Container>
    </footer>
  );
}

import Link from "next/link";

import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

import { Logo } from "./logo";

export function SiteFooter() {
  return (
    // Extra bottom padding on phones clears the home page's sticky action bar.
    <footer className="border-t bg-background">
      <Container className="pt-12 pb-28 sm:pt-14 md:pb-14">
        <div className="grid grid-cols-2 gap-x-6 gap-y-10 md:grid-cols-[1.5fr_repeat(4,1fr)]">
          <div className="col-span-2 max-w-xs md:col-span-1">
            <Logo />
            <p className="mt-4 text-sm text-muted-foreground">{siteConfig.tagline}. Free, with no account needed.</p>
            <a
              href={`mailto:${siteConfig.contactEmail}`}
              className="mt-3 inline-block py-1 text-sm font-medium break-all text-foreground transition-colors hover:text-primary"
            >
              {siteConfig.contactEmail}
            </a>
          </div>

          {siteConfig.footer.map((group) => (
            <nav key={group.title} aria-label={group.title}>
              <h2 className="text-sm font-semibold">{group.title}</h2>
              <ul className="mt-3 space-y-1">
                {group.links.map((link) => (
                  <li key={link.href}>
                    <Link
                      href={link.href}
                      className="inline-block py-1.5 text-sm text-muted-foreground transition-colors hover:text-primary"
                    >
                      {link.label}
                    </Link>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>

        <div className="mt-10 space-y-3 border-t pt-6 text-sm text-muted-foreground sm:mt-12">
          <p>© 2026 {siteConfig.name}. All rights reserved.</p>
          <p className="text-xs">
            {siteConfig.name} is an independent website. It is not affiliated with, endorsed by, or acting on behalf of the
            U.S. Department of State, USCIS, or any government agency. Official requirements are set and enforced by those
            agencies.
          </p>
        </div>
      </Container>
    </footer>
  );
}

import Link from "next/link";

import type { PageSummary } from "@/lib/content/loader";
import { cn } from "@/lib/cn";

type PageCardListProps = {
  pages: PageSummary[];
  /** Heading level of each card title, so the outline stays logical where the list is used. */
  as?: "h2" | "h3";
  className?: string;
};

export function PageCardList({ pages, as: Title = "h3", className }: PageCardListProps) {
  return (
    <ul className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {pages.map((page) => (
        <li key={page.path}>
          <Link
            href={page.path}
            className="group flex h-full flex-col gap-2 rounded-lg border bg-surface-raised p-5 shadow-sm transition-colors hover:border-primary/50 sm:p-6"
          >
            <span className="text-xs font-medium tracking-wide text-primary uppercase">{page.category}</span>
            <Title className="text-lg font-semibold text-balance group-hover:text-primary">{page.heading}</Title>
            <p className="text-sm text-muted-foreground">{page.description}</p>
          </Link>
        </li>
      ))}
    </ul>
  );
}

export function RelatedPages({ pages }: { pages: PageSummary[] }) {
  if (!pages.length) return null;
  return (
    <section aria-labelledby="related-heading" className="flex flex-col gap-6">
      <h2 id="related-heading" className="font-display text-2xl font-semibold tracking-tight">
        Related pages
      </h2>
      <PageCardList pages={pages} />
    </section>
  );
}

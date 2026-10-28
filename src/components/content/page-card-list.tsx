import Link from "next/link";

import { ArrowRightIcon, CameraIcon, CropIcon, GlobeIcon, IdCardIcon, PrinterIcon } from "@/components/home/icons";

import type { PageSummary } from "@/lib/content/loader";
import type { CardIcon } from "@/lib/content/schema";
import { cn } from "@/lib/cn";

type PageCardListProps = {
  pages: PageSummary[];
  /** Heading level of each card title, so the outline stays logical where the list is used. */
  as?: "h2" | "h3";
  className?: string;
  /** Show the category label; turn off where every card shares one (hubs). */
  showCategory?: boolean;
};

export const CARD_ICON_COMPONENTS: Record<CardIcon, typeof CameraIcon> = {
  camera: CameraIcon,
  crop: CropIcon,
  globe: GlobeIcon,
  "id-card": IdCardIcon,
  printer: PrinterIcon,
};

export const ACTION_LABEL: Partial<Record<PageSummary["category"], string>> = {
  tool: "Open tool",
  checker: "Open checker",
  guide: "Read guide",
};

/** The page's card icon in a tinted tile, or nothing when it has none. */
export function PageIcon({ page, className }: { page: PageSummary; className?: string }) {
  const Icon = page.icon && CARD_ICON_COMPONENTS[page.icon];
  if (!Icon) return null;
  return (
    <span
      className={cn(
        "flex size-11 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary-subtle-foreground",
        className,
      )}
    >
      <Icon className="size-6" />
    </span>
  );
}

export function PageCardList({ pages, as: Title = "h3", className, showCategory = true }: PageCardListProps) {
  return (
    <ul className={cn("grid gap-3 sm:grid-cols-2 lg:grid-cols-3", className)}>
      {pages.map((page) => (
        <li key={page.path}>
          <Link
            href={page.path}
            className="group flex h-full gap-3 rounded-lg border bg-surface-raised p-4 transition-colors hover:border-primary/50"
          >
            <PageIcon page={page} className="size-9 rounded-md [&>svg]:size-5" />
            <div className="flex min-w-0 flex-1 flex-col gap-1">
              {showCategory && (
                <span className="text-[0.6875rem] font-medium tracking-wide text-primary uppercase">{page.category}</span>
              )}
              <Title className="text-base leading-snug font-semibold text-balance group-hover:text-primary">
                {page.heading}
              </Title>
              <p className="mb-2 line-clamp-2 text-sm text-pretty text-muted-foreground">{page.summary}</p>
              <span className="mt-auto inline-flex items-center gap-1 self-start rounded-md bg-primary px-2.5 py-1 text-xs font-semibold tracking-wide text-primary-foreground uppercase transition-colors group-hover:bg-primary-hover">
                {ACTION_LABEL[page.category] ?? "Read more"}
                <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </span>
            </div>
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

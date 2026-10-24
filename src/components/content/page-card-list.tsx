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
    <ul className={cn("grid gap-4 sm:grid-cols-2", className)}>
      {pages.map((page) => (
        <li key={page.path}>
          <Link
            href={page.path}
            className="group flex h-full flex-col gap-2 rounded-lg border bg-surface-raised p-5 shadow-sm transition-[border-color,box-shadow] hover:border-primary/50 hover:shadow-md sm:p-6"
          >
            <PageIcon page={page} className="mb-2" />
            {showCategory && <span className="text-xs font-medium tracking-wide text-primary uppercase">{page.category}</span>}
            <Title className="text-lg font-semibold text-balance group-hover:text-primary">{page.heading}</Title>
            <p className="text-sm text-pretty text-muted-foreground">{page.summary}</p>
            <span className="mt-auto flex items-center gap-1.5 pt-2 text-sm font-medium text-primary">
              {ACTION_LABEL[page.category] ?? "Read more"}
              <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
            </span>
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

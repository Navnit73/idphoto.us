import type { PageSummary } from "./loader";
import { CATEGORY_ROUTE_PREFIX, type SchemaType, type TemplateName } from "./schema";
import type { Crumb } from "@/lib/seo/json-ld";

export const DEFAULT_SCHEMA_TYPE: Record<TemplateName, SchemaType> = {
  tool: "WebApplication",
  guide: "Article",
  faq: "FAQPage",
  legal: "WebPage",
  info: "WebPage",
  hub: "CollectionPage",
};

/** Home → category hub (when the category has one) → page. */
export function buildBreadcrumbs(page: PageSummary, all: PageSummary[]): Crumb[] {
  const crumbs: Crumb[] = [{ name: "Home", path: "/" }];
  const prefix = CATEGORY_ROUTE_PREFIX[page.category];
  const hub = prefix && page.path !== prefix ? all.find((candidate) => candidate.path === prefix) : undefined;
  if (hub) crumbs.push({ name: hub.breadcrumbLabel, path: hub.path });
  crumbs.push({ name: page.breadcrumbLabel, path: page.path });
  return crumbs;
}

/** Pages listed on a hub: everything else in its category, newest first. */
export function categoryListing(page: PageSummary, all: PageSummary[]) {
  return all
    .filter((candidate) => candidate.category === page.category && candidate.template !== "hub" && candidate.indexable)
    .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt));
}

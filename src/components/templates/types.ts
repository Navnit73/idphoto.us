import type { Page, PageSummary } from "@/lib/content/loader";
import type { Crumb } from "@/lib/seo/json-ld";

export type TemplateProps = {
  page: Page;
  crumbs: Crumb[];
  /** Other published pages in the same category (used by hub templates). */
  categoryPages: PageSummary[];
};

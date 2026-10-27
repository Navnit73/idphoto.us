import type { Page, PageSummary } from "@/lib/content/loader";
import type { Crumb } from "@/lib/seo/json-ld";

export type TemplateProps = {
  page: Page;
  crumbs: Crumb[];
  /** Other published pages in the same category (used by hub templates). */
  categoryPages: PageSummary[];
};

/** Id of the section holding a page's widget; the header button scrolls to it. */
export const TOOL_ANCHOR = "tool";

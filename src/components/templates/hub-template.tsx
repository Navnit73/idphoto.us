import { Markdown } from "@/components/content/markdown";
import { PageCardList } from "@/components/content/page-card-list";
import { PageHeader } from "@/components/content/page-header";
import { Container } from "@/components/ui/container";

import type { TemplateProps } from "./types";

/** Category landing page (e.g. /tool): intro copy plus every page in the category. */
export function HubTemplate({ page, crumbs, categoryPages }: TemplateProps) {
  return (
    <Container className="py-10 sm:py-14">
      <div className="flex flex-col gap-12">
        <PageHeader page={page} crumbs={crumbs} />
        <section aria-labelledby="hub-list-heading" className="flex flex-col gap-6">
          <h2 id="hub-list-heading" className="sr-only">
            All {page.breadcrumbLabel.toLowerCase()}
          </h2>
          <PageCardList pages={categoryPages} />
        </section>
        <Markdown tree={page.tree} className="max-w-prose" />
      </div>
    </Container>
  );
}

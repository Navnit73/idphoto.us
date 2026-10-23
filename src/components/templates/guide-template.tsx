import { Disclaimer } from "@/components/content/disclaimer";
import { FaqSection } from "@/components/content/faq-section";
import { Markdown } from "@/components/content/markdown";
import { RelatedPages } from "@/components/content/page-card-list";
import { PageHeader } from "@/components/content/page-header";
import { Sources } from "@/components/content/sources";
import { TableOfContents } from "@/components/content/table-of-contents";
import { Container } from "@/components/ui/container";
import { Feedback } from "@/components/widgets/feedback";

import type { TemplateProps } from "./types";

export function GuideTemplate({ page, crumbs }: TemplateProps) {
  const { frontmatter } = page;
  const toc = frontmatter.showTableOfContents;

  return (
    <Container className="py-10 sm:py-14">
      <article className="flex flex-col gap-10">
        <PageHeader page={page} crumbs={crumbs} byline />

        <div className={toc ? "grid gap-10 lg:grid-cols-[minmax(0,1fr)_16rem]" : undefined}>
          {toc && (
            <TableOfContents headings={page.headings} className="lg:sticky lg:top-24 lg:order-last lg:self-start" />
          )}
          <div className="flex max-w-prose min-w-0 flex-col gap-12">
            {frontmatter.showDisclaimer && <Disclaimer />}
            <Markdown tree={page.tree} />
            <FaqSection faq={page.faq} />
            <Sources sources={frontmatter.sources} />
            <Feedback path={page.path} />
          </div>
        </div>

        <RelatedPages pages={page.related} />
      </article>
    </Container>
  );
}

import { FaqSection } from "@/components/content/faq-section";
import { Markdown } from "@/components/content/markdown";
import { RelatedPages } from "@/components/content/page-card-list";
import { PageHeader } from "@/components/content/page-header";
import { TableOfContents } from "@/components/content/table-of-contents";
import { Container } from "@/components/ui/container";
import { Widget } from "@/components/widgets/registry";

import type { TemplateProps } from "./types";

/** About, contact, and policy pages. An optional widget (e.g. the contact form) follows the content. */
export function InfoTemplate({ page, crumbs }: TemplateProps) {
  const { frontmatter } = page;

  return (
    <Container className="pt-page pb-10 sm:pb-14">
      <article className="flex flex-col gap-12">
        <PageHeader page={page} crumbs={crumbs} />
        <div className="flex max-w-prose flex-col gap-12">
          {frontmatter.showTableOfContents && <TableOfContents headings={page.headings} />}
          <Markdown tree={page.tree} />
          {frontmatter.widget && <Widget name={frontmatter.widget} country={frontmatter.country} />}
          <FaqSection faq={page.faq} title={frontmatter.faqTitle} />
        </div>
        <RelatedPages pages={page.related} />
      </article>
    </Container>
  );
}

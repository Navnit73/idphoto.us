import { Markdown } from "@/components/content/markdown";
import { PageHeader } from "@/components/content/page-header";
import { TableOfContents } from "@/components/content/table-of-contents";
import { Container } from "@/components/ui/container";

import type { TemplateProps } from "./types";

export function LegalTemplate({ page, crumbs }: TemplateProps) {
  return (
    <Container className="py-10 sm:py-14">
      <article className="mx-auto flex max-w-prose flex-col gap-10">
        <PageHeader page={page} crumbs={crumbs} />
        {page.frontmatter.showTableOfContents && <TableOfContents headings={page.headings} />}
        <Markdown tree={page.tree} />
      </article>
    </Container>
  );
}

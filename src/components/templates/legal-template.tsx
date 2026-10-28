import { Markdown } from "@/components/content/markdown";
import { PageHeader } from "@/components/content/page-header";
import { TableOfContents } from "@/components/content/table-of-contents";
import { Container } from "@/components/ui/container";

import type { TemplateProps } from "./types";

/** Policy text with a sticky table of contents beside it on desktop. */
export function LegalTemplate({ page, crumbs }: TemplateProps) {
  const toc = page.frontmatter.showTableOfContents;

  return (
    <article>
      <PageHeader page={page} crumbs={crumbs} />
      <Container
        className={toc ? "grid gap-10 pt-10 pb-16 sm:pt-14 sm:pb-24 lg:grid-cols-[13.75rem_minmax(0,1fr)] lg:gap-16" : "pt-10 pb-16 sm:pt-14 sm:pb-24"}
      >
        {toc && (
          <TableOfContents
            headings={page.headings}
            className="lg:sticky lg:top-[calc(var(--spacing-header)+2rem)] lg:self-start"
          />
        )}
        <Markdown tree={page.tree} className="max-w-prose min-w-0" />
      </Container>
    </article>
  );
}

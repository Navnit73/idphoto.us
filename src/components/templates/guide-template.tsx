import { Disclaimer } from "@/components/content/disclaimer";
import { FaqSection } from "@/components/content/faq-section";
import { Markdown } from "@/components/content/markdown";
import { RelatedPages } from "@/components/content/page-card-list";
import { PageHeader } from "@/components/content/page-header";
import { Sources } from "@/components/content/sources";
import { TableOfContents } from "@/components/content/table-of-contents";
import { Container } from "@/components/ui/container";
import { Feedback } from "@/components/widgets/feedback";
import { Widget } from "@/components/widgets/registry";

import { TOOL_ANCHOR, type TemplateProps } from "./types";

export function GuideTemplate({ page, crumbs }: TemplateProps) {
  const { frontmatter } = page;
  const toc = frontmatter.showTableOfContents;

  return (
    <article>
      <PageHeader
        page={page}
        crumbs={crumbs}
        byline
        band={frontmatter.heroStyle === "band"}
        cta={frontmatter.widget ? { label: frontmatter.ctaLabel ?? "Try the tool", href: `#${TOOL_ANCHOR}` } : undefined}
        image={frontmatter.heroImage}
        facts={frontmatter.heroFacts}
      />
      <Container className="flex flex-col gap-12 pt-10 pb-16 sm:pt-14 sm:pb-24">
        {/* Optional: lets a guide embed a tool, e.g. the photo editor preset to the guide's country. */}
        {frontmatter.widget && (
          <section id={TOOL_ANCHOR} aria-labelledby="tool-heading" className="w-full">
            {/* The widget's own headings are H3s, so this keeps the outline from skipping a level. */}
            <h2 id="tool-heading" className="sr-only">
              Photo tool
            </h2>
            <Widget name={frontmatter.widget} country={frontmatter.country} />
          </section>
        )}

        <div className={toc ? "grid gap-10 lg:grid-cols-[13.75rem_minmax(0,1fr)] lg:gap-16" : undefined}>
          {toc && (
            <TableOfContents
              headings={page.headings}
              className="lg:sticky lg:top-[calc(var(--spacing-header)+2rem)] lg:self-start"
            />
          )}
          <div className="flex max-w-prose min-w-0 flex-col gap-12">
            {frontmatter.showDisclaimer && <Disclaimer />}
            <Markdown tree={page.tree} />
            <FaqSection faq={page.faq} title={frontmatter.faqTitle} />
            <Sources sources={frontmatter.sources} />
            <Feedback path={page.path} />
          </div>
        </div>

        <RelatedPages pages={page.related} />
      </Container>
    </article>
  );
}

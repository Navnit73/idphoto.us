import { Disclaimer } from "@/components/content/disclaimer";
import { FaqSection } from "@/components/content/faq-section";
import { Markdown } from "@/components/content/markdown";
import { RelatedPages } from "@/components/content/page-card-list";
import { PageHeader } from "@/components/content/page-header";
import { Sources } from "@/components/content/sources";
import { SupportedCountries } from "@/components/content/supported-countries";
import { Container } from "@/components/ui/container";
import { Widget } from "@/components/widgets/registry";

import { TOOL_ANCHOR, type TemplateProps } from "./types";

/** Tool first, explanation second: the widget sits right under the header, and the header button jumps to it. */
export function ToolTemplate({ page, crumbs }: TemplateProps) {
  const { frontmatter } = page;

  return (
    <article>
      <PageHeader
        page={page}
        crumbs={crumbs}
        band={frontmatter.heroStyle === "band"}
        cta={frontmatter.widget ? { label: frontmatter.ctaLabel ?? "Get started", href: `#${TOOL_ANCHOR}` } : undefined}
        image={frontmatter.heroImage}
        facts={frontmatter.heroFacts}
      />
      <Container className="flex flex-col gap-8 pt-10 pb-16 sm:gap-12 sm:pt-14 sm:pb-24">
        {frontmatter.widget && (
          <section id={TOOL_ANCHOR} aria-labelledby="tool-heading" className="w-full scroll-mt-20">
            {/* The widget's own headings are H3s, so this keeps the outline from skipping a level. */}
            <h2 id="tool-heading" className="sr-only">
              {page.breadcrumbLabel}
            </h2>
            <Widget name={frontmatter.widget} country={frontmatter.country} />
          </section>
        )}
        <div className="mx-auto flex w-full max-w-4xl flex-col gap-10 border-t pt-10 sm:gap-12 sm:pt-16">
          {frontmatter.showDisclaimer && <Disclaimer />}
          <Markdown tree={page.tree} />
          {frontmatter.widget === "photo-editor" && <SupportedCountries />}
          <FaqSection faq={page.faq} title={frontmatter.faqTitle} />
          <Sources sources={frontmatter.sources} />
        </div>
        <RelatedPages pages={page.related} />
      </Container>
    </article>
  );
}

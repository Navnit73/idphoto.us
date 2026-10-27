import { Disclaimer } from "@/components/content/disclaimer";
import { FaqSection } from "@/components/content/faq-section";
import { Markdown } from "@/components/content/markdown";
import { RelatedPages } from "@/components/content/page-card-list";
import { PageHeader } from "@/components/content/page-header";
import { Sources } from "@/components/content/sources";
import { SupportedCountries } from "@/components/content/supported-countries";
import { Container } from "@/components/ui/container";
import { Widget } from "@/components/widgets/registry";
import { cn } from "@/lib/cn";

import { TOOL_ANCHOR, type TemplateProps } from "./types";

/** Tool first, explanation second: the widget sits right under the H1, and the header button jumps to it. */
export function ToolTemplate({ page, crumbs }: TemplateProps) {
  const { frontmatter } = page;
  const band = frontmatter.heroStyle === "band";

  const header = (
    <PageHeader
      page={page}
      crumbs={crumbs}
      band={band}
      cta={frontmatter.widget ? { label: frontmatter.ctaLabel ?? "Get started", href: `#${TOOL_ANCHOR}` } : undefined}
      image={frontmatter.heroImage}
      facts={frontmatter.heroFacts}
    />
  );

  return (
    <article>
      {/* The band header is full-bleed, so it sits outside the page Container. */}
      {band && header}
      <Container className={cn("flex flex-col gap-8 pb-10 sm:gap-12 sm:pb-14", band ? "pt-10 sm:pt-14" : "pt-page")}>
        {!band && header}
        {frontmatter.widget && (
          <section id={TOOL_ANCHOR} aria-labelledby="tool-heading" className="mx-auto w-full max-w-6xl scroll-mt-20">
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
        <div className="mx-auto w-full max-w-6xl">
          <RelatedPages pages={page.related} />
        </div>
      </Container>
    </article>
  );
}

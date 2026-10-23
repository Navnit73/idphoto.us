import { Disclaimer } from "@/components/content/disclaimer";
import { FaqSection } from "@/components/content/faq-section";
import { Markdown } from "@/components/content/markdown";
import { RelatedPages } from "@/components/content/page-card-list";
import { PageHeader } from "@/components/content/page-header";
import { Sources } from "@/components/content/sources";
import { Container } from "@/components/ui/container";
import { Feedback } from "@/components/widgets/feedback";
import { Widget } from "@/components/widgets/registry";

import type { TemplateProps } from "./types";

/** Tool first, explanation second: the widget sits right under the H1. */
export function ToolTemplate({ page, crumbs }: TemplateProps) {
  const { frontmatter } = page;

  return (
    <Container className="py-10 sm:py-14">
      <article className="flex flex-col gap-12">
        <PageHeader page={page} crumbs={crumbs} />
        {frontmatter.widget && (
          <section aria-label="Tool">
            <Widget name={frontmatter.widget} />
          </section>
        )}
        <div className="flex max-w-prose flex-col gap-12">
          {frontmatter.showDisclaimer && <Disclaimer />}
          <Markdown tree={page.tree} />
          <FaqSection faq={page.faq} />
          <Sources sources={frontmatter.sources} />
          <Feedback path={page.path} />
        </div>
        <RelatedPages pages={page.related} />
      </article>
    </Container>
  );
}

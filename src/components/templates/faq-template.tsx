import { Disclaimer } from "@/components/content/disclaimer";
import { FaqSection } from "@/components/content/faq-section";
import { Markdown } from "@/components/content/markdown";
import { RelatedPages } from "@/components/content/page-card-list";
import { PageHeader } from "@/components/content/page-header";
import { Sources } from "@/components/content/sources";
import { Container } from "@/components/ui/container";
import { Feedback } from "@/components/widgets/feedback";

import type { TemplateProps } from "./types";

/** FAQ entries lead; the Markdown body adds context after them. */
export function FaqTemplate({ page, crumbs }: TemplateProps) {
  const { frontmatter } = page;

  return (
    <Container className="pt-page pb-10 sm:pb-14">
      <article className="flex flex-col gap-12">
        <PageHeader page={page} crumbs={crumbs} />
        <div className="flex max-w-prose flex-col gap-12">
          {frontmatter.showDisclaimer && <Disclaimer />}
          <FaqSection faq={page.faq} title={frontmatter.faqTitle ?? "Questions and answers"} />
          <Markdown tree={page.tree} />
          <Sources sources={frontmatter.sources} />
          <Feedback path={page.path} />
        </div>
        <RelatedPages pages={page.related} />
      </article>
    </Container>
  );
}

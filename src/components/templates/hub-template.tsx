import Link from "next/link";

import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { Markdown } from "@/components/content/markdown";
import { CARD_ICON_COMPONENTS, PageCardList } from "@/components/content/page-card-list";
import { PageHeader } from "@/components/content/page-header";
import { ArrowRightIcon, CheckIcon } from "@/components/home/icons";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow, SectionHeading } from "@/components/ui/section-heading";
import type { PageSummary } from "@/lib/content/loader";

import type { TemplateProps } from "./types";

const TOOL_POINTS = ["Free preview", "No account needed", "60+ countries"];

const arrow = <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />;

/** Category landing page (e.g. /tool): intro copy plus every page in the category. */
export function HubTemplate(props: TemplateProps) {
  if (props.page.category === "tool") return <ToolHub {...props} />;

  const { page, crumbs, categoryPages } = props;
  return (
    <>
      <PageHeader page={page} crumbs={crumbs} />
      <Container className="flex flex-col gap-12 pt-10 pb-16 sm:pt-14 sm:pb-24">
        <section aria-labelledby="hub-list-heading">
          <h2 id="hub-list-heading" className="sr-only">
            All {page.breadcrumbLabel.toLowerCase()}
          </h2>
          <PageCardList pages={categoryPages} showCategory={false} className="sm:gap-4" />
        </section>
        <Markdown tree={page.tree} className="mx-auto w-full max-w-prose border-t pt-12 sm:pt-16" />
      </Container>
    </>
  );
}

/** The /tool hub: an app-style landing page that leads with the first tool, then the rest as a grid. */
function ToolHub({ page, crumbs, categoryPages }: TemplateProps) {
  const [featured, ...others] = categoryPages;

  return (
    <>
      <section className="border-b bg-surface">
        <Container className="flex flex-col gap-8 py-12 sm:py-16 md:py-20">
          <Breadcrumbs crumbs={crumbs} />
          <div className="mx-auto flex max-w-3xl flex-col items-center text-center">
            <Eyebrow>Photo tools</Eyebrow>
            <h1 className="mt-4 font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl md:text-5xl">
              {page.heading}
            </h1>
            <p className="mt-4 max-w-2xl text-base text-pretty text-muted-foreground sm:text-lg">{page.description}</p>
            <div className="mt-8 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              {featured && (
                <Link href={featured.path} className={buttonVariants({ size: "lg" })}>
                  Make my photo
                  {arrow}
                </Link>
              )}
              <a href="#all-tools" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Browse all tools
              </a>
            </div>
            <ul className="mt-6 flex flex-wrap justify-center gap-x-6 gap-y-2 text-sm text-muted-foreground">
              {TOOL_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-2">
                  <CheckIcon className="size-4 text-primary" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section id="all-tools" aria-labelledby="all-tools-heading" className="scroll-mt-header py-section">
        <Container className="flex flex-col gap-10 sm:gap-16">
          <SectionHeading id="all-tools-heading" eyebrow="All tools" title="Pick the tool for your job">
            Each tool does one thing well. Not sure where to start? The first one handles most passport photos.
          </SectionHeading>
          <div className="flex flex-col gap-3 sm:gap-4">
            {featured && <FeaturedTool page={featured} />}
            {others.length > 0 && <PageCardList pages={others} showCategory={false} className="sm:gap-4" />}
          </div>
        </Container>
      </section>

      <section className="border-t bg-surface py-section">
        <Container>
          <Markdown tree={page.tree} className="mx-auto w-full max-w-prose" />
        </Container>
      </section>
    </>
  );
}

/** Dark highlight card for the tool most people need. */
function FeaturedTool({ page }: { page: PageSummary }) {
  const Icon = page.icon && CARD_ICON_COMPONENTS[page.icon];
  return (
    <Link
      href={page.path}
      className="group flex flex-col gap-5 rounded-lg bg-contrast p-6 text-contrast-foreground sm:flex-row sm:items-center sm:p-7"
    >
      {Icon && (
        <span className="flex size-12 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
          <Icon className="size-6" />
        </span>
      )}
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-xs font-semibold text-contrast-muted-foreground">Start here</span>
        <h3 className="text-xl font-semibold text-balance">{page.breadcrumbLabel}</h3>
        <p className="max-w-2xl text-sm text-pretty text-contrast-muted-foreground">{page.summary}</p>
      </div>
      <span className={buttonVariants({ className: "sm:self-center" })}>
        Open tool
        {arrow}
      </span>
    </Link>
  );
}

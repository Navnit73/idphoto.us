import Link from "next/link";

import { Breadcrumbs } from "@/components/content/breadcrumbs";
import { Markdown } from "@/components/content/markdown";
import { ACTION_LABEL, PageCardList, PageIcon } from "@/components/content/page-card-list";
import { PageHeader } from "@/components/content/page-header";
import { ArrowRightIcon, CheckIcon } from "@/components/home/icons";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { cn } from "@/lib/cn";
import type { PageSummary } from "@/lib/content/loader";

import type { TemplateProps } from "./types";

const TOOL_POINTS = ["Free to use", "No account needed", "60+ countries"];

/** Category landing page (e.g. /tool): intro copy plus every page in the category. */
export function HubTemplate(props: TemplateProps) {
  if (props.page.category === "tool") return <ToolHub {...props} />;

  const { page, crumbs, categoryPages } = props;
  return (
    <Container className="pt-page pb-10 sm:pb-14">
      <div className="flex flex-col gap-12">
        <PageHeader page={page} crumbs={crumbs} />
        <section aria-labelledby="hub-list-heading" className="flex flex-col gap-6">
          <h2 id="hub-list-heading" className="sr-only">
            All {page.breadcrumbLabel.toLowerCase()}
          </h2>
          <PageCardList pages={categoryPages} showCategory={false} className="lg:gap-6" />
        </section>
        <Markdown tree={page.tree} className="mx-auto w-full max-w-prose border-t pt-12 sm:pt-16" />
      </div>
    </Container>
  );
}

/** The /tool hub: an app-style landing page that leads with the first tool, then the rest as a grid. */
function ToolHub({ page, crumbs, categoryPages }: TemplateProps) {
  const [featured, ...others] = categoryPages;

  return (
    <>
      <section className="border-b bg-surface pt-page pb-12 sm:pb-16">
        <Container className="flex flex-col gap-8">
          <Breadcrumbs crumbs={crumbs} />
          <div className="mx-auto flex max-w-3xl flex-col items-center gap-5 text-center">
            <h1 className="font-display text-4xl font-semibold tracking-tight text-balance sm:text-5xl">{page.heading}</h1>
            <p className="max-w-2xl text-lg text-pretty text-muted-foreground">{page.description}</p>
            <div className="mt-2 flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              {featured && (
                <Link href={featured.path} className={buttonVariants({ size: "lg", className: "group" })}>
                  Make my photo
                  <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
                </Link>
              )}
              <a href="#all-tools" className={buttonVariants({ variant: "outline", size: "lg" })}>
                Browse all tools
              </a>
            </div>
            <ul className="flex flex-wrap justify-center gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {TOOL_POINTS.map((point) => (
                <li key={point} className="flex items-center gap-1.5">
                  <CheckIcon className="size-4 text-success" />
                  {point}
                </li>
              ))}
            </ul>
          </div>
        </Container>
      </section>

      <section id="all-tools" aria-labelledby="all-tools-heading" className="scroll-mt-header py-section">
        <Container className="flex flex-col gap-8">
          <div className="flex max-w-2xl flex-col gap-3">
            <h2 id="all-tools-heading" className="font-display text-3xl font-semibold tracking-tight text-balance">
              Pick the tool for your job
            </h2>
            <p className="text-lg text-pretty text-muted-foreground">
              Each tool does one thing well. Not sure where to start? The first one handles most passport photos.
            </p>
          </div>
          {featured && <FeaturedTool page={featured} />}
          {others.length > 0 && (
            <ul className="grid gap-3 sm:grid-cols-2 lg:grid-cols-3">
              {others.map((tool) => (
                <li key={tool.path}>
                  <ToolCard page={tool} />
                </li>
              ))}
            </ul>
          )}
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

function FeaturedTool({ page }: { page: PageSummary }) {
  return (
    <Link
      href={page.path}
      className="group flex flex-col gap-4 rounded-lg border bg-surface-raised p-4 transition-colors hover:border-primary/50 sm:flex-row sm:items-center sm:p-5"
    >
      <PageIcon page={page} className="size-11 rounded-md" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <span className="text-[0.6875rem] font-semibold tracking-wide text-primary uppercase">Start here</span>
        <h3 className="text-lg leading-snug font-semibold text-balance group-hover:text-primary">{page.breadcrumbLabel}</h3>
        <p className="max-w-2xl text-sm text-pretty text-muted-foreground">{page.summary}</p>
      </div>
      <ActionChip className="sm:self-center" />
    </Link>
  );
}

function ToolCard({ page }: { page: PageSummary }) {
  return (
    <Link
      href={page.path}
      className="group flex h-full gap-3 rounded-lg border bg-surface-raised p-4 transition-colors hover:border-primary/50"
    >
      <PageIcon page={page} className="size-9 rounded-md [&>svg]:size-5" />
      <div className="flex min-w-0 flex-1 flex-col gap-1">
        <h3 className="text-base leading-snug font-semibold text-balance group-hover:text-primary">{page.breadcrumbLabel}</h3>
        <p className="mb-2 line-clamp-2 text-sm text-pretty text-muted-foreground">{page.summary}</p>
        <ActionChip className="mt-auto" />
      </div>
    </Link>
  );
}

/** Small flat filled "Open tool" label; the whole card is the link. */
function ActionChip({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 self-start rounded-md bg-primary px-2.5 py-1 text-xs font-semibold tracking-wide text-primary-foreground uppercase transition-colors group-hover:bg-primary-hover",
        className,
      )}
    >
      {ACTION_LABEL.tool}
      <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
    </span>
  );
}

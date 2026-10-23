import Link from "next/link";

import type { Page } from "@/lib/content/loader";
import type { Crumb } from "@/lib/seo/json-ld";

import { Breadcrumbs } from "./breadcrumbs";
import { FormattedDate } from "./formatted-date";

type PageHeaderProps = {
  page: Page;
  crumbs: Crumb[];
  /** Show author, reviewer, and reading time (guides). */
  byline?: boolean;
};

export function PageHeader({ page, crumbs, byline = false }: PageHeaderProps) {
  return (
    <header className="flex flex-col gap-4 border-b pb-8">
      <Breadcrumbs crumbs={crumbs} />
      <h1 className="font-display text-4xl font-semibold tracking-tight text-balance">{page.heading}</h1>
      <p className="max-w-prose text-lg text-pretty text-muted-foreground">{page.description}</p>
      <dl className="flex flex-wrap gap-x-6 gap-y-1 text-sm text-muted-foreground">
        {byline && (
          <div className="flex gap-1.5">
            <dt>Written by</dt>
            <dd className="font-medium text-foreground">
              {page.author.url ? (
                <Link href={page.author.url} className="hover:text-primary">
                  {page.author.name}
                </Link>
              ) : (
                page.author.name
              )}
            </dd>
          </div>
        )}
        {byline && page.reviewer && (
          <div className="flex gap-1.5">
            <dt>Reviewed by</dt>
            <dd className="font-medium text-foreground">{page.reviewer.name}</dd>
          </div>
        )}
        <div className="flex gap-1.5">
          <dt>Last updated</dt>
          <dd className="font-medium text-foreground">
            <FormattedDate iso={page.updatedAt} />
          </dd>
        </div>
        {byline && (
          <div className="flex gap-1.5">
            <dt className="sr-only">Reading time</dt>
            <dd>{page.readingMinutes} min read</dd>
          </div>
        )}
      </dl>
    </header>
  );
}

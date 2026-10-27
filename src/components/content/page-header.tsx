import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon } from "@/components/home/icons";
import { buttonVariants } from "@/components/ui/button";

import type { Page } from "@/lib/content/loader";
import type { Crumb } from "@/lib/seo/json-ld";

import { Breadcrumbs } from "./breadcrumbs";
import { FormattedDate } from "./formatted-date";

type PageHeaderProps = {
  page: Page;
  crumbs: Crumb[];
  /** Show author, reviewer, and reading time (guides). */
  byline?: boolean;
  /** Button that jumps to an anchor on the page (tools: the widget). */
  cta?: { label: string; href: `#${string}` };
  /** Image shown to the right of the text on large screens. */
  image?: { src: string; width: number; height: number; alt: string };
};

export function PageHeader({ page, crumbs, byline = false, cta, image }: PageHeaderProps) {
  const intro = (
    <div className="flex flex-col gap-4">
      <h1 className="font-display text-3xl font-semibold sm:text-4xl tracking-tight text-balance">{page.heading}</h1>
      <p className="max-w-prose text-base text-pretty sm:text-lg text-muted-foreground">{page.description}</p>
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
            <dd className="font-medium text-foreground">
              {page.reviewer.url ? (
                <a href={page.reviewer.url} className="hover:text-primary">
                  {page.reviewer.name}
                </a>
              ) : (
                page.reviewer.name
              )}
            </dd>
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
      {cta && (
        <a href={cta.href} className={buttonVariants({ size: "lg", className: "group mt-2 w-full sm:w-auto sm:self-start" })}>
          {cta.label}
          <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
        </a>
      )}
    </div>
  );

  return (
    <header className="flex flex-col gap-4 border-b pb-6 sm:pb-8">
      <Breadcrumbs crumbs={crumbs} />
      {image ? (
        <div className="grid items-center gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-12">
          {intro}
          <figure className="mx-auto w-full max-w-sm rounded-xl bg-photo-backdrop p-2 sm:p-4 lg:mx-0 lg:max-w-none">
            <Image
              src={image.src}
              width={image.width}
              height={image.height}
              alt={image.alt}
              sizes="(min-width: 64rem) 22rem, 24rem"
              preload
              className="mx-auto h-auto w-full max-w-sm lg:max-w-none"
            />
          </figure>
        </div>
      ) : (
        intro
      )}
    </header>
  );
}

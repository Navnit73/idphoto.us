import Image from "next/image";
import Link from "next/link";

import { ArrowRightIcon } from "@/components/home/icons";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Eyebrow } from "@/components/ui/section-heading";
import { cn } from "@/lib/cn";
import type { Category } from "@/lib/content/schema";

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
  image?: { src: string; width: number; height: number; alt: string; credit?: { name: string; url: string } };
  /** Key figures under the intro, like the home page hero's stats. */
  facts?: { value: string; label: string }[];
  /** The home page hero's look: a white (dark: black) band with a larger image, instead of the tinted band. */
  band?: boolean;
};

const EYEBROW: Record<Category, string> = {
  tool: "Free tool",
  checker: "Photo checker",
  guide: "Guide",
  legal: "Legal",
  about: "About",
};

/** Full-width header band. It brings its own Container, so templates render it outside theirs. */
export function PageHeader({ page, crumbs, byline = false, cta, image, facts, band = false }: PageHeaderProps) {
  const intro = (
    <div className="flex flex-col gap-4">
      <Eyebrow>{EYEBROW[page.category]}</Eyebrow>
      <h1
        className={cn(
          "max-w-4xl font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl",
          page.frontmatter.template !== "tool" && page.frontmatter.template !== "guide" && "md:text-5xl",
        )}
      >
        {page.heading}
      </h1>
      <p className="max-w-3xl text-base text-pretty text-muted-foreground sm:text-lg">{page.description}</p>
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
        <a href={cta.href} className={buttonVariants({ size: "lg", className: "mt-2 w-full sm:w-auto sm:self-start" })}>
          {cta.label}
          <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
        </a>
      )}
      {facts?.length ? (
        <dl className="mt-2 grid w-full grid-cols-3 rounded-lg border bg-background">
          {facts.map((fact, i) => (
            <div key={fact.label} className={cn("flex flex-col px-2 py-4 text-center", i > 0 && "border-l")}>
              <dt className="order-last mt-1 text-xs text-muted-foreground">{fact.label}</dt>
              <dd className="font-mono text-lg font-semibold tracking-tight sm:text-xl">{fact.value}</dd>
            </div>
          ))}
        </dl>
      ) : null}
    </div>
  );

  const body = image ? (
    <div
      className={cn(
        "grid items-center",
        band ? "gap-10 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-16" : "gap-8 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-12",
      )}
    >
      {intro}
      {/*
        The band matches the home page hero: no frame, and in light mode a slight brightness lift plus
        multiply blends the image's white background into the page. Multiply over black would hide
        the image, so dark mode sets it on a light panel instead.
      */}
      <figure
        className={cn(
          band
            ? "mx-auto w-full max-w-sm dark:rounded-lg dark:bg-photo-backdrop lg:mx-0 lg:max-w-none"
            : "mx-auto w-full max-w-sm rounded-lg border bg-photo-backdrop p-2 sm:p-3 lg:mx-0 lg:max-w-none",
        )}
      >
        <Image
          src={image.src}
          width={image.width}
          height={image.height}
          alt={image.alt}
          sizes={band ? "(min-width: 64rem) 24rem, 100vw" : "(min-width: 64rem) 22rem, 24rem"}
          preload
          className={cn(
            "h-auto w-full",
            band ? "brightness-[1.03] mix-blend-multiply dark:mix-blend-normal" : "mx-auto max-w-sm rounded-md lg:max-w-none",
          )}
        />
        {image.credit && (
          <figcaption className="mt-2 text-center text-xs text-muted-foreground">
            Image credit:{" "}
            <a href={image.credit.url} target="_blank" rel="noopener" className="underline underline-offset-2">
              {image.credit.name}
            </a>
          </figcaption>
        )}
      </figure>
    </div>
  ) : (
    intro
  );

  return (
    <header className={cn("border-b", band ? "bg-background" : "bg-surface")}>
      <Container className="flex flex-col gap-8 py-12 sm:py-16 md:py-20">
        <Breadcrumbs crumbs={crumbs} />
        {body}
      </Container>
    </header>
  );
}

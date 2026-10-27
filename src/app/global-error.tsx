"use client";

import { Button, buttonVariants } from "@/components/ui/button";
import { siteConfig } from "@/config/site";
import { themeInitScript } from "@/lib/theme";

import "./globals.css";

/**
 * Replaces the root layout when the layout itself throws, so it renders its
 * own document: no header, footer, or fonts, but the same tokens and theme.
 */
export default function GlobalError({ retry }: { error: unknown; retry: () => void }) {
  return (
    <html lang="en-US" suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: themeInitScript }} />
        <title>{`Something went wrong | ${siteConfig.name}`}</title>
      </head>
      <body className="flex min-h-full flex-col">
        <main className="mx-auto flex w-full max-w-3xl flex-col items-start gap-6 px-gutter pt-page pb-section">
          <h1 className="font-display text-4xl font-semibold tracking-tight">Something went wrong</h1>
          <p className="max-w-prose text-lg text-muted-foreground">
            Sorry — the site hit an unexpected error. Please try again in a moment.
          </p>
          <div className="flex flex-wrap gap-3">
            <Button onClick={retry}>Try again</Button>
            {/* A full page load, since client navigation may be what's broken. */}
            {/* eslint-disable-next-line @next/next/no-html-link-for-pages */}
            <a href="/" className={buttonVariants({ variant: "outline" })}>
              Go to the home page
            </a>
          </div>
        </main>
      </body>
    </html>
  );
}

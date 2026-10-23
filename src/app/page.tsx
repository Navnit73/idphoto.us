import Link from "next/link";

import { PageCardList } from "@/components/content/page-card-list";
import { JsonLd } from "@/components/seo/json-ld";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";
import { getPageSummaries } from "@/lib/content/loader";
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

export const ensureStatic = "navigation";

export const metadata = buildMetadata({
  title: `${siteConfig.name} — Passport & ID Photo Tools and Guides`,
  absoluteTitle: true,
  description: siteConfig.description,
  path: "/",
  ogImage: "/og",
});

const principles = [
  {
    title: "Private by design",
    body: "Our photo tools run entirely in your browser. Your images are never uploaded to our servers.",
  },
  {
    title: "Checked against official sources",
    body: "Guides cite the Department of State and other agencies directly, and show when they were last reviewed.",
  },
  {
    title: "Honest about limits",
    body: "We explain what a tool can and can't do. The agency reviewing your application always has the final say.",
  },
];

export default async function Home() {
  const pages = await getPageSummaries();
  const tools = pages.filter((page) => page.category === "tool" && page.template !== "hub");
  const guides = pages.filter((page) => page.category === "guide" && page.template !== "hub");

  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd()]} />

      <section className="border-b pt-page pb-section">
        <Container className="flex flex-col items-start gap-6">
          <p className="rounded-full bg-primary-subtle px-3 py-1 text-xs font-medium tracking-wide text-primary-subtle-foreground uppercase">
            Free · No sign-up · Nothing uploaded
          </p>
          <h1 className="max-w-3xl font-display text-5xl font-semibold tracking-tight text-balance">
            Passport and ID photos, sized right the first time
          </h1>
          <p className="max-w-prose text-lg text-pretty text-muted-foreground">
            Crop a photo to the U.S. passport 2 × 2 inch format, shrink files to fit online upload limits, and read plain-English
            guides to the official requirements — all from your phone or computer.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href="/tool/passport-photo-maker" className={buttonVariants({ size: "lg" })}>
              Make a passport photo
            </Link>
            <Link href="/guide/passport-photo-requirements" className={buttonVariants({ variant: "outline", size: "lg" })}>
              Read the requirements
            </Link>
          </div>
        </Container>
      </section>

      <section aria-labelledby="tools-heading" className="py-section">
        <Container className="flex flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="tools-heading" className="font-display text-3xl font-semibold tracking-tight">
              Photo tools
            </h2>
            <Link href="/tool" className="text-sm font-medium text-primary hover:text-primary-hover">
              All tools →
            </Link>
          </div>
          <PageCardList pages={tools} />
        </Container>
      </section>

      <section aria-labelledby="guides-heading" className="border-y bg-surface py-section">
        <Container className="flex flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="guides-heading" className="font-display text-3xl font-semibold tracking-tight">
              Guides
            </h2>
            <Link href="/guide" className="text-sm font-medium text-primary hover:text-primary-hover">
              All guides →
            </Link>
          </div>
          <PageCardList pages={guides} />
        </Container>
      </section>

      <section aria-labelledby="principles-heading" className="py-section">
        <Container className="flex flex-col gap-8">
          <h2 id="principles-heading" className="font-display text-3xl font-semibold tracking-tight">
            How we work
          </h2>
          <ul className="grid gap-8 md:grid-cols-3">
            {principles.map((item) => (
              <li key={item.title} className="flex flex-col gap-2">
                <h3 className="text-xl font-semibold">{item.title}</h3>
                <p className="text-muted-foreground">{item.body}</p>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
            Read our{" "}
            <Link href="/editorial-policy" className="font-medium text-primary underline underline-offset-4">
              editorial policy
            </Link>{" "}
            and{" "}
            <Link href="/content-methodology" className="font-medium text-primary underline underline-offset-4">
              content methodology
            </Link>
            .
          </p>
        </Container>
      </section>
    </>
  );
}

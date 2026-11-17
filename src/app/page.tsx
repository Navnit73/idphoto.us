import Image from "next/image";
import Link from "next/link";

import { PageCardList } from "@/components/content/page-card-list";
import {
  ArrowRightIcon,
  CameraIcon,
  CheckIcon,
  ClockIcon,
  CropIcon,
  DownloadIcon,
  GlobeIcon,
  IdCardIcon,
  PlusIcon,
  PrinterIcon,
  ShieldIcon,
  UploadCloudIcon,
  XIcon,
} from "@/components/home/icons";
import { MobileCtaBar } from "@/components/home/mobile-cta-bar";
import { JsonLd } from "@/components/seo/json-ld";
import { BackgroundBeams } from "@/components/ui/background-beams";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { SectionHeading } from "@/components/ui/section-heading";
import { Widget } from "@/components/widgets/registry";
import { cn } from "@/lib/cn";
import { getPageSummaries } from "@/lib/content/loader";
import { flagEmoji, PHOTO_COUNTRIES, type CountryCode } from "@/lib/photo/countries";
import { PHOTO_RESULT_TTL_DAYS } from "@/lib/photo/limits";
import { faqPageJsonLd, homePageJsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

export const ensureStatic = "navigation";

/**
 * This page owns "passport photo online" and the broad maker terms.
 * It does not target requirements, size, 2x2, crop/converter, checker, visa or
 * near-me terms. Each of those gets one sentence and a link to its own page.
 */
const title = "Passport Photo Online: Maker with Free Preview";
const description =
  "Make a passport photo online: upload and preview it free, then pay once to download. Built for U.S. passports and 60+ countries. No account needed.";

export const metadata = buildMetadata({
  title,
  absoluteTitle: true,
  description,
  path: "/",
  ogImage: "/og",
  keywords: [
    "passport photo online",
    "passport photo maker",
    "passport photo free preview",
    "us passport picture",
    "make passport photo at home",
    "id photo editor online",
    "photo id maker",
    "photo id photo",
    "passport id picture",
  ],
});

const heroImage = {
  src: "https://res.cloudinary.com/dipzpwbbk/image/upload/v1793201051/passport-photo-hero-image_clabua.webp",
  width: 1535,
  height: 1024,
  alt: "Passport photo with framing guides, a checklist of passed photo checks, and a 4×6 in print sheet ready",
};

/** Internal link targets. Each must be a published page (or an anchor on this one). */
const links = {
  tool: "#photo-tool",
  requirements: "/guide/passport-photo-requirements",
  faq: "/faq",
} as const;

const heroHighlights = ["No account needed", "Retake as often as you like", "Privacy-first by default"];

const heroStats = [
  { value: "60+", label: "Countries supported" },
  { value: "Free", label: "Preview, no account" },
  { value: "< 5 min", label: "Time to download" },
  { value: `${PHOTO_RESULT_TTL_DAYS} days`, label: "Then your result expires" },
];

/** Country tiles show names only; sizes live on the owning size page. */
const stripCountries: { code: CountryCode; label?: string }[] = [
  { code: "US", label: "United States" },
  { code: "GB", label: "United Kingdom" },
  { code: "CA" },
  { code: "IN" },
  { code: "AU" },
  { code: "EU" },
];

const countryTiles = stripCountries.flatMap(({ code, label }) => {
  const spec = PHOTO_COUNTRIES.find((country) => country.code === code);
  return spec ? [{ code, name: label ?? spec.name }] : [];
});

const steps = [
  {
    icon: CameraIcon,
    title: "Take or upload a photo",
    body: "Snap a photo with your phone, or pick a recent one. A plain wall and soft daylight work best.",
    meta: "JPEG, PNG or WebP",
  },
  {
    icon: CropIcon,
    title: "Pick your country",
    body: "Choose the U.S. or any of 60+ countries. The maker finds your face and builds your passport picture.",
    meta: "60+ country specs",
  },
  {
    icon: DownloadIcon,
    title: "Download your photo",
    body: "Save a high-resolution file. Print it at home, send it to a photo lab, or upload it online.",
    meta: "Print or digital file",
  },
];

const usPeople = ["First-time applicants", "Renewals", "Parents and families", "Americans abroad"];

const features = [
  {
    icon: PrinterIcon,
    title: "Print at home or at a lab",
    body: "Print on photo paper at 100% scale, or send the file to a photo lab or pharmacy counter. Check it with a ruler before you mail it.",
  },
  {
    icon: UploadCloudIcon,
    title: "Upload a digital photo",
    body: "Online renewals and e-forms ask for a digital photo. Our editor saves a JPEG you can upload right away.",
  },
  {
    icon: ClockIcon,
    title: "Ready in minutes",
    body: "No account, no waiting on a studio appointment. Upload, crop, and download — most people finish in under five minutes.",
  },
  {
    icon: GlobeIcon,
    title: "60+ countries",
    body: `Beyond the U.S., choose from ${PHOTO_COUNTRIES.length - 1} other photo specs, from the UK and Canada to India and the Schengen visa.`,
  },
];

/** Practical tips for taking the photo. The full rules live on the requirements guide. */
const photoDos = [
  "Plain white or off-white background",
  "Even light, with no shadows on your face or behind you",
  "Neutral expression or a natural smile, both eyes open",
  "Face the camera straight on, head centered",
  "Taken within the last six months",
];

const photoDonts = [
  "Glasses (unless you have a doctor's statement)",
  "Hats or head coverings*",
  "Filters, retouching, or AI edits",
  "Uniforms or camouflage clothing",
  "Patterns, objects, or other people in the frame",
];

const principles = [
  {
    icon: ShieldIcon,
    title: "Clear about your data",
    body: `We tell you before a photo uploads, expire your result page after ${PHOTO_RESULT_TTL_DAYS} days, and never sell your information.`,
  },
  {
    icon: CheckIcon,
    title: "Checked against official sources",
    body: "Our guides cite the Department of State and other agencies, and show when we last reviewed them.",
  },
  {
    icon: GlobeIcon,
    title: "Honest about limits",
    body: "We explain what our tools can and can't do. The agency reviewing your application has the final say.",
  },
];

const faqs = [
  {
    question: "Is this passport photo maker free?",
    answer:
      "Partly. Uploading, previewing and checking your photo is free, with no account. Downloading the full-resolution file is a one-time paid purchase (from $7.99 in U.S. dollars, priced in your local currency in some countries), with a refund if a government agency rejects the photo. If you print at a store or lab, that business sets its own price.",
  },
  {
    question: "Can I make my own U.S. passport photo online?",
    answer:
      "Yes. The State Department accepts photos you take yourself, as long as they meet its rules. Take a clear, front-facing photo, upload it, and let the maker build your U.S. passport picture.",
  },
  {
    question: "Will the State Department accept a photo I made online?",
    answer:
      "It will if the final photo meets the official rules. How you made the photo doesn't matter. Our tool prepares the file, but the agency reviewing your application makes the final decision.",
  },
  {
    question: "Can I make a passport photo for another country?",
    answer:
      "Yes. Choose your country in the tool, and it formats the photo for that country. Over 60 countries are available.",
  },
  {
    question: "Is this also an ID photo editor online, not just for passports?",
    answer:
      "Yes. Beyond a passport ID picture, our photo ID maker also builds visa photos, 2x2 ID photos, and other official ID photo formats. Pick the format you need in the tool.",
  },
  {
    question: "Can I print my passport photo at home?",
    answer:
      "Yes. Print it on photo-quality paper at 100% scale, or send the file to a photo lab or pharmacy counter. Check the printed result with a ruler before you mail it.",
  },
  {
    question: "How long does it take to make a passport photo online?",
    answer:
      "Most people finish in a few minutes. Taking a good photo takes the longest. Processing takes up to a minute, and then you can download your file.",
  },
];

const textLink = "font-medium text-primary underline underline-offset-4 hover:text-primary-hover";
const arrowLink = "group inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover";
const arrow = <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />;

export default async function Home() {
  const pages = await getPageSummaries();
  const tools = pages.filter((page) => page.category === "tool" && page.template !== "hub");
  const guides = pages.filter((page) => page.category === "guide" && page.template !== "hub");

  return (
    <>
      <JsonLd
        data={[organizationJsonLd(), websiteJsonLd(), homePageJsonLd({ title, description }), faqPageJsonLd("/", faqs)]}
      />

      {/* Hero */}
      <section className="relative overflow-hidden border-b">
        <BackgroundBeams>
          <div className="relative z-10 mx-auto grid max-w-wide items-center gap-10 px-gutter pt-10 pb-12 sm:gap-14 sm:pt-16 sm:pb-20 md:pt-24 lg:grid-cols-[1fr_1.15fr] lg:gap-10">
            <div className="text-center lg:text-left">
              <a
                href={links.tool}
                className="group inline-flex items-center gap-2 rounded-lg border bg-background py-1.5 pr-3 pl-1.5 text-xs font-medium text-muted-foreground transition-colors hover:border-border-strong"
              >
                <span className="rounded-md bg-primary px-2 py-0.5 font-semibold text-primary-foreground">Free preview</span>
                Photos for 60+ countries
                <ArrowRightIcon className="size-3.5 transition-transform group-hover:translate-x-0.5" />
              </a>

              <h1 className="mt-7 font-display text-4xl leading-tight font-semibold tracking-tight text-balance sm:text-5xl lg:text-5xl">
                Passport photos, <span className="text-primary">done right</span>, in minutes.
              </h1>
              <p className="mx-auto mt-5 max-w-xl text-base text-pretty text-muted-foreground sm:mt-6 sm:text-lg lg:mx-0">
                Make a U.S. passport photo online, or choose from 60+ other countries. Upload a photo and the editor crops,
                resizes, and checks it. Preview the result free, then pay once to download, print, or submit it online.
              </p>

              <div id="hero-actions" className="mt-8 flex flex-col justify-center gap-3 sm:mt-9 sm:flex-row lg:justify-start">
                <a href={links.tool} className={buttonVariants({ size: "lg" })}>
                  Make my photo
                  {arrow}
                </a>
                <Link href={links.requirements} className={buttonVariants({ variant: "outline", size: "lg" })}>
                  See photo requirements
                </Link>
              </div>

              <ul className="mt-6 grid grid-cols-3 gap-2 text-xs leading-tight text-muted-foreground sm:mt-8 sm:flex sm:flex-wrap sm:justify-center sm:gap-x-6 sm:text-sm lg:justify-start">
                {heroHighlights.map((point) => (
                  <li key={point} className="flex flex-col items-center gap-1.5 text-center sm:flex-row sm:gap-2 sm:text-left">
                    <CheckIcon className="size-4 text-primary" />
                    {point}
                  </li>
                ))}
              </ul>
            </div>

            {/*
              Crops the image's empty white margins so the mockup fills the column. In light mode,
              a slight brightness lift turns its off-white background pure white, and multiply blends it
              into the page. Multiply over black would hide the image,
              so dark mode sets it on a light panel instead.
            */}
            <div className="relative -mx-gutter aspect-[1100/740] overflow-hidden sm:mx-auto sm:w-full sm:max-w-2xl dark:mx-0 dark:rounded-lg dark:bg-photo-backdrop">
              <Image
                src={heroImage.src}
                width={heroImage.width}
                height={heroImage.height}
                alt={heroImage.alt}
                sizes="(min-width: 80rem) 58rem, (min-width: 64rem) 75vw, 140vw"
                preload
                className="absolute top-[-18.2%] left-[-30.7%] w-[139.5%] max-w-none brightness-[1.03] mix-blend-multiply"
              />
            </div>
          </div>
        </BackgroundBeams>

        {/* Stats */}
        <div className="relative border-t bg-background">
          <dl className="mx-auto grid max-w-wide grid-cols-2 px-gutter md:grid-cols-4">
            {heroStats.map((stat, i) => (
              <div
                key={stat.label}
                className={cn(
                  "flex flex-col px-2 py-5 text-center sm:py-6 md:py-8",
                  i % 2 === 1 && "border-l",
                  i > 1 && "border-t md:border-t-0",
                  i === 2 && "md:border-l",
                )}
              >
                <dt className="order-last mt-1 text-xs text-muted-foreground sm:text-sm">{stat.label}</dt>
                <dd className="font-mono text-lg font-semibold tracking-tight sm:text-xl md:text-2xl">{stat.value}</dd>
              </div>
            ))}
          </dl>
        </div>
      </section>

      {/* Countries strip */}
      <section aria-label="Popular countries" className="bg-surface">
        <Container className="py-12">
          <p className="text-center text-sm font-medium text-muted-foreground">The right photo for</p>
          <ul className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {countryTiles.map((country) => (
              <li
                key={country.code}
                className="rounded-lg border bg-surface-raised px-4 py-3 text-center transition-colors hover:border-primary/50"
              >
                <span aria-hidden="true" className="block text-xl leading-none">
                  {flagEmoji(country.code)}
                </span>
                <span className="mt-1.5 block text-sm font-medium">{country.name}</span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Photo tool: the hero's main button scrolls here. */}
      <section id="photo-tool" aria-labelledby="photo-tool-heading" className="scroll-mt-header border-t py-section">
        <Container className="flex flex-col gap-10 sm:gap-16">
          <SectionHeading id="photo-tool-heading" eyebrow="The tool" title="Make your passport photo online">
            Choose your country and upload a photo. This photo ID maker builds your passport ID picture and opens it on
            its own page, ready to download.
          </SectionHeading>
          <Widget name="photo-editor" />
        </Container>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="border-y bg-surface py-section">
        <Container>
          <SectionHeading id="how-heading" eyebrow="How it works" title="Three steps to a finished photo">
            You need a phone, a plain wall, and good light. Our maker handles the rest.
          </SectionHeading>

          <ol className="relative mt-10 grid gap-8 sm:mt-16 md:grid-cols-3">
            {/* Horizontal connector between steps on desktop */}
            <div aria-hidden="true" className="absolute top-6 right-[16%] left-[16%] hidden border-t border-dashed border-border-strong md:block" />

            {steps.map((step, i) => (
              <li key={step.title} className="relative flex gap-5 md:flex-col md:items-center md:gap-0 md:text-center">
                {/* Vertical connector on mobile */}
                {i < steps.length - 1 && (
                  <span aria-hidden="true" className="absolute top-14 -bottom-6 left-6 border-l border-dashed border-border-strong md:hidden" />
                )}

                <span className="relative flex size-12 shrink-0 items-center justify-center rounded-lg border bg-surface-raised text-primary">
                  <step.icon className="size-5" />
                  <span className="absolute -top-2 -right-2 flex size-5 items-center justify-center rounded-md bg-foreground font-mono text-[10px] font-semibold text-background">
                    <span className="sr-only">Step </span>
                    {i + 1}
                  </span>
                </span>

                <div className="md:flex md:flex-col md:items-center">
                  <h3 className="pt-1 text-lg font-semibold md:mt-6 md:pt-0">{step.title}</h3>
                  <p className="mt-1.5 text-sm text-muted-foreground md:mt-2 md:max-w-xs">{step.body}</p>
                  <p className="mt-3 inline-block rounded-md border bg-background px-2.5 py-1 font-mono text-xs text-muted-foreground md:mt-4">
                    {step.meta}
                  </p>
                </div>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* Features */}
      <section aria-labelledby="features-heading" className="py-section">
        <Container>
          <SectionHeading id="features-heading" eyebrow="Features" title="Built for every photo need">
            People across the U.S. use our maker and photo ID editor for every kind of application. People
            in 60+ countries use it too.
          </SectionHeading>

          <div className="mt-10 grid gap-3 sm:mt-16 sm:grid-cols-2 sm:gap-4 lg:grid-cols-3">
            {/* Highlight card */}
            <div className="flex flex-col justify-between rounded-lg bg-contrast p-6 text-contrast-foreground sm:col-span-2 sm:p-7 lg:col-span-1 lg:row-span-2">
              <div>
                <span className="flex size-10 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                  <IdCardIcon className="size-5" />
                </span>
                <h3 className="mt-6 text-xl font-semibold">U.S. passport photos, made at home</h3>
                <p className="mt-3 text-sm text-contrast-muted-foreground">
                  Apply for your first passport, renew with a fresh selfie, make a photo for your child, or get one from
                  anywhere in the world.
                </p>
              </div>
              <ul className="mt-6 grid grid-cols-2 gap-2 sm:mt-8">
                {usPeople.map((person) => (
                  <li
                    key={person}
                    className="flex items-center gap-2 rounded-md border border-contrast-border bg-contrast-raised px-3 py-2 text-xs text-contrast-foreground"
                  >
                    <CheckIcon className="size-3.5 text-primary" />
                    {person}
                  </li>
                ))}
              </ul>
              <a
                href={links.tool}
                className="group mt-6 inline-flex items-center gap-1.5 text-sm font-semibold text-contrast-foreground underline-offset-4 hover:underline"
              >
                Make a U.S. passport picture
                {arrow}
              </a>
            </div>

            {features.map((feature) => (
              <div
                key={feature.title}
                className="group flex gap-4 rounded-lg border bg-surface-raised p-5 transition-colors hover:border-primary/50 sm:block sm:p-6"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary-subtle-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <feature.icon className="size-5" />
                </span>
                <div>
                  <h3 className="text-base font-semibold sm:mt-5">{feature.title}</h3>
                  <p className="mt-1 text-sm text-muted-foreground sm:mt-2">{feature.body}</p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Photo tips */}
      <section aria-labelledby="tips-heading" className="border-y bg-surface py-section">
        <Container>
          <SectionHeading id="tips-heading" eyebrow="Before you start" title="Take a photo that's ready to use">
            Small details like a shadow or a pair of glasses cause most problems. Get these right before you upload. For
            every rule, see the{" "}
            <Link href={links.requirements} className={textLink}>
              passport photo requirements
            </Link>
            .
          </SectionHeading>

          <div className="mt-10 grid gap-3 sm:mt-16 sm:gap-4 md:grid-cols-2">
            <div className="rounded-lg border bg-surface-raised">
              <div className="flex items-center gap-3 border-b px-5 py-4 sm:px-6">
                <span className="flex size-7 items-center justify-center rounded-md bg-primary text-primary-foreground">
                  <CheckIcon className="size-4" />
                </span>
                <h3 className="font-semibold">Do</h3>
              </div>
              <ul className="space-y-3.5 p-5 sm:p-6">
                {photoDos.map((tip) => (
                  <li key={tip} className="flex items-start gap-3 text-sm">
                    <CheckIcon className="mt-0.5 size-4 text-primary" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>

            <div className="rounded-lg border bg-muted">
              <div className="flex items-center gap-3 border-b border-border-strong px-5 py-4 sm:px-6">
                <span className="flex size-7 items-center justify-center rounded-md bg-foreground text-background">
                  <XIcon className="size-4" />
                </span>
                <h3 className="font-semibold">Avoid</h3>
              </div>
              <ul className="space-y-3.5 p-5 sm:p-6">
                {photoDonts.map((tip) => (
                  <li key={tip} className="flex items-start gap-3 text-sm text-muted-foreground">
                    <XIcon className="mt-0.5 size-4" />
                    {tip}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          <p className="mt-6 text-center text-xs text-muted-foreground">
            *Allowed for religious or medical reasons with a signed statement. These tips follow U.S. rules; other countries
            differ.
          </p>
        </Container>
      </section>

      {/* Tools and guides */}
      <section aria-labelledby="resources-heading" className="py-section">
        <Container className="flex flex-col gap-10 sm:gap-16">
          <SectionHeading id="resources-heading" eyebrow="Resources" title="Passport photo tools and guides">
            Plain-English explanations of official rules, with links to the agency sources we used.
          </SectionHeading>

          <div className="flex flex-col gap-10">
            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-semibold">Photo tools</h3>
                <Link href="/tool" className={arrowLink}>
                  All tools
                  {arrow}
                </Link>
              </div>
              <PageCardList pages={tools} />
            </div>

            <div className="flex flex-col gap-4">
              <div className="flex items-center justify-between gap-4">
                <h3 className="text-xl font-semibold">Guides</h3>
                <Link href="/guide" className={arrowLink}>
                  All guides
                  {arrow}
                </Link>
              </div>
              <PageCardList pages={guides} />
            </div>
          </div>
        </Container>
      </section>

      {/* How we work */}
      <section aria-labelledby="principles-heading" className="border-t py-section">
        <Container>
          <SectionHeading id="principles-heading" eyebrow="Our standards" title="How we work" />
          <ul className="mt-10 grid gap-3 sm:mt-16 sm:gap-4 md:grid-cols-3">
            {principles.map((principle) => (
              <li
                key={principle.title}
                className="group flex flex-col items-start gap-5 rounded-lg border bg-surface-raised p-5 transition-colors hover:border-primary/50 sm:p-6"
              >
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary-subtle-foreground transition-colors group-hover:bg-primary group-hover:text-primary-foreground">
                  <principle.icon className="size-5" />
                </span>
                <div>
                  <h3 className="font-semibold">{principle.title}</h3>
                  <p className="mt-2 text-sm text-muted-foreground">{principle.body}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="mt-8 text-center text-sm text-muted-foreground">
            Read our{" "}
            <Link href="/editorial-policy" className={textLink}>
              editorial policy
            </Link>{" "}
            and{" "}
            <Link href="/content-methodology" className={textLink}>
              content methodology
            </Link>
            .
          </p>
        </Container>
      </section>

      {/* FAQ */}
      <section aria-labelledby="faq-heading" className="border-t bg-surface py-section">
        <Container className="grid gap-8 sm:gap-12 lg:grid-cols-[1fr_1.6fr] lg:gap-16">
          <div className="lg:sticky lg:top-[calc(var(--spacing-header)+2rem)] lg:self-start">
            <SectionHeading id="faq-heading" eyebrow="FAQ" title="Passport photo online: frequently asked questions" align="left">
              Can&apos;t find your answer? See the full FAQ.
            </SectionHeading>
            <Link href={links.faq} className={cn(arrowLink, "mt-4 py-2")}>
              Read the full FAQ
              {arrow}
            </Link>
          </div>

          <div className="divide-y rounded-lg border bg-surface-raised">
            {faqs.map((faq) => (
              <details key={faq.question} className="group px-5 sm:px-6">
                <summary className="flex list-none items-center justify-between gap-4 py-5 [&::-webkit-details-marker]:hidden">
                  <h3 className="text-base font-medium">{faq.question}</h3>
                  <span className="flex size-7 shrink-0 items-center justify-center rounded-md border text-muted-foreground transition-all group-open:rotate-45 group-open:border-primary group-open:bg-primary group-open:text-primary-foreground">
                    <PlusIcon className="size-4" />
                  </span>
                </summary>
                <p className="pr-10 pb-5 text-sm text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      {/* Closing call to action */}
      <section className="border-t">
        <Container className="py-16 sm:py-24">
          <div className="relative overflow-hidden rounded-lg bg-primary px-5 py-12 text-center text-primary-foreground sm:px-12 sm:py-16 md:py-20">
            <div aria-hidden="true" className="bg-grid fade-edges pointer-events-none absolute inset-0 opacity-20 [--grid-line:var(--color-primary-foreground)]" />
            <div className="relative">
              <h2 className="mx-auto max-w-2xl font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Make your passport photo today
              </h2>
              <p className="mx-auto mt-4 max-w-xl text-base opacity-85">
                Skip the photo booth. Make your photo from home in a few minutes. Preview it free, with no account, and pay only to download.
              </p>
              <div className="mt-8 flex flex-col justify-center gap-3 sm:flex-row">
                <a href={links.tool} className={buttonVariants({ variant: "inverse", size: "lg" })}>
                  Make my photo
                  {arrow}
                </a>
                <Link href={links.requirements} className={buttonVariants({ variant: "inverse-outline", size: "lg" })}>
                  Check requirements
                </Link>
              </div>
            </div>
          </div>
        </Container>
      </section>

      <MobileCtaBar href={links.tool} />
    </>
  );
}

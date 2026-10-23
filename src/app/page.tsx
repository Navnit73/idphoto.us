import Image from "next/image";
import Link from "next/link";

import { PageCardList } from "@/components/content/page-card-list";
import {
  ArrowRightIcon,
  CameraIcon,
  CheckIcon,
  CropIcon,
  DownloadIcon,
  GlobeIcon,
  PlusIcon,
  PrinterIcon,
  ShieldIcon,
  UploadCloudIcon,
} from "@/components/home/icons";
import { JsonLd } from "@/components/seo/json-ld";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Widget } from "@/components/widgets/registry";
import { siteConfig } from "@/config/site";
import { cn } from "@/lib/cn";
import { getPageSummaries } from "@/lib/content/loader";
import { PHOTO_COUNTRIES, type CountryCode } from "@/lib/photo/countries";
import { faqPageJsonLd, homePageJsonLd, organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

export const ensureStatic = "navigation";

/**
 * This page owns "passport photo online" and the broad maker terms.
 * It does not target requirements, size, 2x2, crop/converter, checker, visa or
 * near-me terms. Each of those gets one sentence and a link to its own page.
 */
const title = "Passport Photo Online: Free Passport Photo Maker";
const description =
  "Make a passport photo online for free. Our passport photo maker creates a U.S. passport picture or a photo for 60+ countries. Download, print, or upload.";

export const metadata = buildMetadata({
  title,
  absoluteTitle: true,
  description,
  path: "/",
  ogImage: "/og",
  keywords: [
    "passport photo online",
    "passport photo maker",
    "free passport photo",
    "us passport picture",
    "make passport photo at home",
  ],
});

const heroImage = {
  src: "https://res.cloudinary.com/dipzpwbbk/image/upload/v1791864231/Upload_Edit_Print__Passport_Photos_uqasb5.webp",
  width: 1774,
  height: 887,
  alt: "Two example U.S. passport photos, a man and a woman, each with the head centered against a plain background.",
};

/** Internal link targets. Each must be a published page (or an anchor on this one). */
const links = {
  tool: "#photo-tool",
  requirements: "/guide/passport-photo-requirements",
  faq: "/faq",
} as const;

const steps = [
  {
    icon: CameraIcon,
    title: "Take or upload a photo",
    body: "Snap a photo with your phone, or pick a recent one. JPEG, PNG, and WebP files all work.",
  },
  {
    icon: CropIcon,
    title: "Pick your country",
    body: "Choose the U.S. or any of 60+ countries. The maker finds your face and builds your passport picture.",
  },
  {
    icon: DownloadIcon,
    title: "Download your photo",
    body: "Save a high-resolution file. Print it at home, send it to a photo lab, or upload it online.",
  },
];

const usPeople = [
  {
    title: "First-time applicants",
    body: "Apply for your first U.S. passport with a photo you made at home.",
  },
  {
    title: "Renewals",
    body: "Renew with a fresh passport photo made from a recent selfie.",
  },
  {
    title: "Parents and families",
    body: "Make a passport picture for your child, baby, or the whole family.",
  },
  {
    title: "Americans abroad",
    body: "Get a U.S. passport photo online, wherever you live.",
  },
];

/** Country tiles show names only; sizes live on the owning size page. */
const internationalCountries: { code: CountryCode; label?: string }[] = [
  { code: "GB", label: "United Kingdom" },
  { code: "CA" },
  { code: "IN" },
  { code: "AU" },
  { code: "DE" },
  { code: "FR" },
  { code: "MX" },
  { code: "PH" },
  { code: "CN" },
  { code: "EU" },
];

const countryTiles = internationalCountries.flatMap(({ code, label }) => {
  const spec = PHOTO_COUNTRIES.find((country) => country.code === code);
  return spec ? [{ code, name: label ?? spec.name }] : [];
});
const moreCountries = PHOTO_COUNTRIES.length - 1 - countryTiles.length;



const principles = [
  {
    icon: ShieldIcon,
    title: "Clear about your data",
    body: "We tell you before a photo uploads, expire your result page after 7 days, and never sell your information.",
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
      "Yes. You can make, edit, and download your passport photo for free, with no account. If you print at a store or lab, that business sets its own price.",
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
    question: "Can I print my passport photo at home?",
    answer:
      "Yes. Print it on photo-quality paper at 100% scale, or send the file to a photo lab. Check the printed result with a ruler before you mail it.",
  },
  {
    question: "How long does it take to make a passport photo online?",
    answer:
      "Most people finish in a few minutes. Taking a good photo takes the longest. Processing takes up to a minute, and then you can download your file.",
  },
];


const textLink = "font-medium text-primary underline underline-offset-4 hover:text-primary-hover";
const arrowLink = "group inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover";
const card = "rounded-xl border bg-surface-raised shadow-sm";

function SectionHeader({
  id,
  title,
  children,
  className,
}: {
  id: string;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex max-w-2xl flex-col gap-3", className)}>
      <h2 id={id} className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
        {title}
      </h2>
      {children && <p className="text-lg text-pretty text-muted-foreground">{children}</p>}
    </div>
  );
}

function ArrowLink({ href, children }: { href: string; children: React.ReactNode }) {
  const content = (
    <>
      {children}
      <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
    </>
  );
  return href.startsWith("#") ? (
    <a href={href} className={arrowLink}>
      {content}
    </a>
  ) : (
    <Link href={href} className={arrowLink}>
      {content}
    </Link>
  );
}

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
      <section className="border-b pt-page pb-12 sm:pb-16">
        <Container className="grid items-center gap-10 lg:grid-cols-2 lg:gap-12 lg:py-8">
          <div className="flex flex-col items-start gap-6 text-left">
            <h1 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Passport Photo Online: Free Passport Photo Maker
            </h1>
            <p className="max-w-xl text-lg text-pretty text-muted-foreground">
              Make a U.S. passport photo online in minutes, or choose from 60+ other countries. Upload a photo,
              download your file, and print it or submit it online.
            </p>
            <div className="flex w-full flex-col gap-3 sm:w-auto sm:flex-row">
              <a href={links.tool} className={buttonVariants({ size: "lg", className: "group" })}>
                Make my passport photo
                <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
              </a>
              <Link href={links.requirements} className={buttonVariants({ variant: "outline", size: "lg" })}>
                See photo requirements
              </Link>
            </div>
            <ul className="flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              {["No account needed", "Retake as often as you like", "Print or digital file"].map((point) => (
                <li key={point} className="flex items-center gap-1.5">
                  <CheckIcon className="size-4 text-success" />
                  {point}
                </li>
              ))}
            </ul>
          </div>

          <figure className="rounded-xl bg-photo-backdrop p-2 sm:p-4">
            <Image
              src={heroImage.src}
              width={heroImage.width}
              height={heroImage.height}
              alt={heroImage.alt}
              sizes="(min-width: 80rem) 35rem, (min-width: 64rem) 45vw, 100vw"
              preload
              className="h-auto w-full"
            />
          </figure>
        </Container>
      </section>

      {/* Photo tool: the hero's main button scrolls here. */}
      <section id="photo-tool" aria-labelledby="photo-tool-heading" className="scroll-mt-header py-section">
        <Container className="flex flex-col gap-10">
          <SectionHeader id="photo-tool-heading" title="Make your passport photo online">
            Choose your country and upload a photo. Your finished passport picture opens on its own page, ready to
            download.
          </SectionHeader>

          <Widget name="photo-editor" />
        </Container>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="border-y py-section">
        <Container className="flex flex-col gap-10">
          <SectionHeader id="how-heading" title="How to make a passport photo online in 3 steps">
            You need a phone, a plain wall, and good light. Our passport photo maker handles the rest.
          </SectionHeader>

          <ol className="grid gap-4 md:grid-cols-3 md:gap-6">
            {steps.map(({ icon: Icon, title, body }, index) => (
              <li key={title} className={cn(card, "relative flex flex-col gap-4 p-6 sm:p-7")}>
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                    <Icon className="size-5" />
                  </span>
                  <span aria-hidden="true" className="font-display text-4xl font-semibold text-muted-foreground">
                    {index + 1}
                  </span>
                </div>
                <h3 className="text-xl font-semibold">
                  <span className="sr-only">Step {index + 1}: </span>
                  {title}
                </h3>
                <p className="text-muted-foreground">{body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>

      {/* People in the U.S. and other countries */}
      <section aria-labelledby="people-heading" className="py-section">
        <Container className="flex flex-col gap-10">
          <SectionHeader id="people-heading" title="Who makes a passport photo online with us">
            People across the U.S. use our passport photo maker for every kind of application. People in 60+ countries
            use it too.
          </SectionHeader>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className={cn(card, "flex flex-col gap-5 p-6 sm:p-8")}>
              <div className="flex items-center gap-3">
                <span className="flex h-7 items-center rounded-md bg-primary-subtle px-2 text-xs font-bold text-primary-subtle-foreground">
                  US
                </span>
                <h3 className="text-xl font-semibold">U.S. passport photo</h3>
              </div>
              <ul className="flex flex-col divide-y">
                {usPeople.map((person) => (
                  <li key={person.title} className="flex flex-col gap-0.5 py-3 first:pt-0">
                    <span className="font-medium">{person.title}</span>
                    <span className="text-sm text-muted-foreground">{person.body}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <ArrowLink href={links.tool}>Make a U.S. passport picture</ArrowLink>
              </div>
            </div>

            <div className={cn(card, "flex flex-col gap-5 p-6 sm:p-8")}>
              <div className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-md bg-primary-subtle text-primary-subtle-foreground">
                  <GlobeIcon className="size-4" />
                </span>
                <h3 className="text-xl font-semibold">Passport photos for other countries</h3>
              </div>
              <ul className="grid grid-cols-2 gap-2 sm:grid-cols-3 sm:gap-3">
                {countryTiles.map((country) => (
                  <li key={country.code} className="rounded-lg border px-3 py-2.5">
                    <span className="block text-sm font-medium break-words">{country.name}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto">
                <ArrowLink href={links.tool}>Choose from {moreCountries} more countries</ArrowLink>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Print or digital */}
      <section aria-labelledby="output-heading" className="border-y py-section">
        <Container className="flex flex-col gap-10">
          <SectionHeader id="output-heading" title="Print your passport photo or upload it online">
            Every download is a high-resolution file, so you can use one photo on paper and on screen.
          </SectionHeader>

          <div className="grid gap-6 md:grid-cols-2">
            <div className={cn(card, "flex flex-col gap-4 p-6 sm:p-8")}>
              <span className="flex size-11 items-center justify-center rounded-lg bg-primary-subtle text-primary-subtle-foreground">
                <PrinterIcon />
              </span>
              <h3 className="text-xl font-semibold">Print at home or at a lab</h3>
              <p className="text-muted-foreground">
                Print on photo paper at 100% scale, or send the file to a photo lab or pharmacy counter. Check the
                printed photo with a ruler before you mail your application.
              </p>
            </div>
            <div className={cn(card, "flex flex-col gap-4 p-6 sm:p-8")}>
              <span className="flex size-11 items-center justify-center rounded-lg bg-primary-subtle text-primary-subtle-foreground">
                <UploadCloudIcon />
              </span>
              <h3 className="text-xl font-semibold">Upload a digital passport photo</h3>
              <p className="text-muted-foreground">
                Online renewals and e-forms ask for a digital photo. Our editor saves a JPEG you can upload right away.
              </p>
            </div>
          </div>
        </Container>
      </section>

     

      {/* Tools and guides */}
      <section aria-labelledby="resources-heading" className="border-y py-section">
        <Container className="flex flex-col gap-10">
          <SectionHeader id="resources-heading" title="Free passport photo tools and guides">
            Plain-English explanations of official rules, with links to the agency sources we used.
          </SectionHeader>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-semibold">Photo tools</h3>
              <ArrowLink href="/tool">All tools</ArrowLink>
            </div>
            <PageCardList pages={tools} />
          </div>

          <div className="flex flex-col gap-4">
            <div className="flex items-center justify-between gap-4">
              <h3 className="text-xl font-semibold">Guides</h3>
              <ArrowLink href="/guide">All guides</ArrowLink>
            </div>
            <PageCardList pages={guides} />
          </div>
        </Container>
      </section>

      {/* How we work */}
      <section aria-labelledby="principles-heading" className="py-section">
        <Container className="flex flex-col gap-10">
          <SectionHeader id="principles-heading" title="How we work" />
          <ul className="grid gap-6 md:grid-cols-3">
            {principles.map(({ icon: Icon, title, body }) => (
              <li key={title} className="flex gap-4">
                <span className="flex size-10 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary-subtle-foreground">
                  <Icon />
                </span>
                <div className="flex flex-col gap-1">
                  <h3 className="font-semibold">{title}</h3>
                  <p className="text-sm text-muted-foreground">{body}</p>
                </div>
              </li>
            ))}
          </ul>
          <p className="text-sm text-muted-foreground">
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
      <section aria-labelledby="faq-heading" className="border-t py-section">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
          <SectionHeader
            id="faq-heading"
            title="Passport photo online: frequently asked questions"
            className="lg:sticky lg:top-[calc(var(--spacing-header)+2rem)] lg:self-start"
          >
            Can&apos;t find your answer? See the{" "}
            <Link href={links.faq} className={textLink}>
              full FAQ
            </Link>
            .
          </SectionHeader>
          <div className="flex flex-col gap-3">
            {faqs.map((faq) => (
              <details key={faq.question} className={cn(card, "group shadow-none open:shadow-sm")}>
                <summary className="flex cursor-pointer list-none items-center justify-between gap-4 rounded-xl p-5 [&::-webkit-details-marker]:hidden">
                  <h3 className="text-base font-semibold sm:text-lg">{faq.question}</h3>
                  <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-muted text-muted-foreground transition-transform group-open:rotate-45">
                    <PlusIcon className="size-4" />
                  </span>
                </summary>
                <p className="-mt-1 px-5 pb-5 text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      
    </>
  );
}
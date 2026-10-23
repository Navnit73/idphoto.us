import Image from "next/image";
import Link from "next/link";
import type { FAQPage } from "schema-dts";

import { PageCardList } from "@/components/content/page-card-list";
import {
  ArrowRightIcon,
  CameraIcon,
  CheckIcon,
  ClockIcon,
  CropIcon,
  DeviceIcon,
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
import { organizationJsonLd, websiteJsonLd } from "@/lib/seo/json-ld";
import { buildMetadata } from "@/lib/seo/metadata";

export const ensureStatic = "navigation";

export const metadata = buildMetadata({
  title: `Passport Photo Online Free: Passport Size Photo Maker | ${siteConfig.name}`,
  absoluteTitle: true,
  description:
    "Free passport photo maker online. Convert any photo to passport size: 2x2 inch for U.S. passports and visas, or 35 × 45 mm and more for 60+ countries.",
  path: "/",
  ogImage: "/og",
  keywords: [
    "passport photo online",
    "passport size photo maker",
    "free passport photo maker",
    "convert photo to passport size",
    "2x2 passport photo online free",
    "online passport photo editor",
    "print passport photo at home",
    "id photo maker",
  ],
});

const heroImage = {
  src: "https://res.cloudinary.com/dipzpwbbk/image/upload/v1791864231/Upload_Edit_Print__Passport_Photos_uqasb5.webp",
  width: 1774,
  height: 887,
  alt: "Two example U.S. passport photos, a man and a woman, each measured at 2 × 2 inches (600 × 600 pixels) with the head centered.",
};

/**
 * Internal link targets. Only pages that exist today are linked, so the home
 * page never sends visitors or crawlers to a 404. Add a link here when its
 * guide or tool is published.
 */
const links = {
  /** The photo tool section on this page. */
  tool: "#photo-tool",
  requirements: "/guide/passport-photo-requirements",
  size: "/guide/us-passport-photo-size",
  compressor: "/tool/photo-compressor",
  faq: "/faq",
} as const;

const highlights = [
  { icon: ShieldIcon, title: "100% free", body: "Make and download your photo. No account or payment details." },
  { icon: GlobeIcon, title: "U.S. + 60 countries", body: "2 × 2 inch, 35 × 45 mm, 50 × 70 mm, and more." },
  { icon: ClockIcon, title: "Ready in minutes", body: "Processing takes up to a minute after you upload." },
  { icon: DeviceIcon, title: "Any device", body: "Works on iPhone, Android, tablets, and computers." },
];

const tips = [
  "Stand in front of a plain white or off-white wall.",
  "Face a window for soft, even light with no shadows.",
  "Hold the camera at eye level, about 4 feet away.",
  "Take off glasses and skip filters or beauty modes.",
  "Use the rear camera and turn off portrait mode.",
];

const steps = [
  {
    icon: CameraIcon,
    title: "Take or upload a photo",
    body: "Take a passport photo at home with your phone, or use a recent photo you already have. Any JPEG, PNG, or WebP works, as long as your face is clear and front-facing.",
  },
  {
    icon: CropIcon,
    title: "We crop it to passport size",
    body: "Choose your country. The tool finds your face, checks the background, and converts the photo to the right size: 2 × 2 inches for the U.S., or your country's format.",
  },
  {
    icon: DownloadIcon,
    title: "Download, print, or upload",
    body: "Save a high-resolution file to print at home or at a photo lab, or upload it with an online application such as a passport renewal or the DS-160.",
  },
];

const usDocuments = [
  { title: "U.S. passport book and card", detail: "2 × 2 in (51 × 51 mm), first-time or renewal" },
  { title: "U.S. visa (DS-160)", detail: "Square digital file, 600 × 600 px or larger" },
  { title: "Green card and USCIS forms", detail: "2 × 2 in prints for forms like the I-485 and N-400" },
  { title: "Baby and child passports", detail: "2 × 2 in, with the same rules as adults" },
  { title: "Any 2 × 2 photo", detail: "Badges, IDs, and other square-format forms" },
];

/** Print sizes are listed only where they're well established; otherwise the tool's digital output is shown. */
const internationalCountries: { code: CountryCode; label?: string; size?: string }[] = [
  { code: "GB", label: "United Kingdom", size: "35 × 45 mm" },
  { code: "CA", size: "50 × 70 mm" },
  { code: "IN" },
  { code: "EU", size: "35 × 45 mm" },
  { code: "AU", size: "35 × 45 mm" },
  { code: "DE", size: "35 × 45 mm" },
  { code: "FR", size: "35 × 45 mm" },
  { code: "MX" },
  { code: "PH" },
  { code: "CN" },
];

const countryTiles = internationalCountries.flatMap(({ code, label, size }) => {
  const spec = PHOTO_COUNTRIES.find((country) => country.code === code);
  return spec ? [{ code, name: label ?? spec.name, size: size ?? `${spec.width} × ${spec.height} px` }] : [];
});
const moreSizes = PHOTO_COUNTRIES.length - 1 - countryTiles.length;

const comparison = [
  { label: "Cost to make the photo", online: "Free", store: "Set by each store" },
  { label: "Where you take it", online: "Anywhere, on your own schedule", store: "During store or office hours" },
  { label: "Retakes", online: "As many as you like", store: "Depends on the location" },
  { label: "Digital file for online renewal", online: "Included in every download", store: "Not always available" },
  { label: "Sizes for other countries", online: "60+ countries", store: "Often only 2 × 2 inch" },
];

const usRules = [
  "Measures exactly 2 × 2 inches (51 × 51 mm).",
  "Head is 1 to 1 3/8 inches from chin to top of head.",
  "Plain white or off-white background with no shadows.",
  "Taken in color within the last six months.",
  "Glasses off, unless you have a signed medical statement.",
  "No filters, retouching, or edits that change how you look.",
];

const internationalRules = [
  "The U.K., Australia, and most of Europe use 35 × 45 mm. Canada uses 50 × 70 mm.",
  "Head-size limits are set in millimeters and differ by country.",
  "Some countries accept light gray or cream backgrounds instead of white.",
  "Many require a neutral expression with your mouth closed, even where the U.S. allows a natural smile.",
  "Visa photos can follow different rules than the same country's passport photos.",
];

const principles = [
  {
    icon: ShieldIcon,
    title: "Clear about your data",
    body: "We tell you before a photo is uploaded, expire your result page after 7 days, and never sell your information.",
  },
  {
    icon: CheckIcon,
    title: "Checked against official sources",
    body: "Guides cite the Department of State and other agencies directly, and show when they were last reviewed.",
  },
  {
    icon: GlobeIcon,
    title: "Honest about limits",
    body: "We explain what a tool can and can't do. The agency reviewing your application always has the final say.",
  },
];

const faqs = [
  {
    question: "Is this passport photo maker free?",
    answer:
      "Yes. Making, editing, and downloading your passport photo is free, with no account needed. If you choose to print at a store or photo lab, that business sets its own price.",
  },
  {
    question: "How do I convert a photo to passport size?",
    answer:
      "Choose your country, then upload the photo. The tool finds your face and crops and resizes the photo to that country's passport size. For the U.S., that's 2 × 2 inches, or 600 × 600 pixels. Start with a recent, front-facing photo taken against a plain, light background.",
  },
  {
    question: "What size is a passport photo in other countries?",
    answer:
      "It depends on the country. The U.S. uses 2 × 2 inches (51 × 51 mm). The U.K., Australia, and most of Europe use 35 × 45 mm, and Canada uses 50 × 70 mm. Choose your country in the tool, and it crops to that size.",
  },
  {
    question: "Can I make my own U.S. passport photo online?",
    answer:
      "Yes. The State Department accepts photos you take yourself, as long as they meet every requirement. Take a clear photo against a plain white or off-white background, crop it to 2 × 2 inches with the tool, and print it or upload it.",
  },
  {
    question: "Will the State Department accept a photo I made online?",
    answer:
      "It will if the final photo meets the official rules for size, head position, background, lighting, and expression. How you made the photo doesn't matter. Our tool handles the size and crop, but the agency reviewing your application makes the final decision.",
  },
  {
    question: "Can I print my passport photo at home?",
    answer:
      "Yes. Print it on matte or glossy photo-quality paper at 100% scale so it measures exactly 2 × 2 inches, or your country's size. You can also send the file to a photo lab and pick up prints the same day.",
  },
  {
    question: "How long does it take to make a passport photo online?",
    answer:
      "Most people finish in a few minutes. Taking a good photo usually takes the longest. Processing takes up to a minute, and then your photo is ready to download.",
  },
  {
    question: "Do you store my photos?",
    answer:
      "Your photo is uploaded to our processing service so it can be cropped and checked. Your result page and its download link expire after 7 days, so save the file before then. Our privacy policy explains exactly what is kept.",
  },
];

const faqJsonLd: FAQPage = {
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

const textLink = "font-medium text-primary underline underline-offset-4 hover:text-primary-hover";
const arrowLink = "group inline-flex items-center gap-1.5 text-sm font-semibold text-primary hover:text-primary-hover";
const card = "rounded-xl border bg-surface-raised shadow-sm";

function SectionHeader({
  id,
  eyebrow,
  title,
  children,
  className,
}: {
  id: string;
  eyebrow: string;
  title: string;
  children?: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("flex max-w-2xl flex-col gap-3", className)}>
      <p className="text-sm font-semibold tracking-wide text-primary uppercase">{eyebrow}</p>
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
      <JsonLd data={[organizationJsonLd(), websiteJsonLd(), faqJsonLd]} />

      {/* Hero */}
      <section className="border-b pt-page pb-12 sm:pb-16">
        <Container className="grid items-center gap-10 lg:grid-cols-[minmax(0,11fr)_minmax(0,9fr)] lg:gap-12 lg:py-8">
          <div className="flex flex-col items-start gap-6 text-left">
            <p className="inline-flex items-center gap-2 rounded-full border bg-surface-raised px-3 py-1 text-xs font-medium text-muted-foreground shadow-sm sm:text-sm">
              <span aria-hidden="true" className="size-2 rounded-full bg-success" />
              Free · No sign-up · U.S. and 60+ countries
            </p>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Passport Photo Online: <span className="text-primary">Free Passport Size Photo Maker</span>
            </h1>
            <p className="max-w-xl text-lg text-pretty text-muted-foreground">
              Convert any photo to passport size in minutes. Make a 2 × 2 inch photo for a U.S. passport, visa, or green
              card, or the right size for 60+ other countries, including the U.K., Canada, India, and the Schengen area.
              Then download it to print at home or upload online.
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

          <figure className="mx-auto w-full max-w-[26.5rem] rounded-xl bg-photo-backdrop p-2 sm:max-w-[31rem] sm:p-4 lg:mx-0 lg:justify-self-end">
            <Image
              src={heroImage.src}
              width={heroImage.width}
              height={heroImage.height}
              alt={heroImage.alt}
              sizes="(min-width: 80rem) 31rem, (min-width: 64rem) 40vw, (min-width: 40rem) 31rem, min(26.5rem, 100vw)"
              preload
              className="h-auto w-full"
            />
          </figure>
        </Container>

        <Container className="mt-12 sm:mt-16">
          <ul className="grid gap-3 sm:grid-cols-2 sm:gap-4 lg:grid-cols-4">
            {highlights.map(({ icon: Icon, title, body }) => (
              <li key={title} className={cn(card, "flex gap-3 p-4 sm:p-5")}>
                <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary-subtle-foreground">
                  <Icon />
                </span>
                <span className="flex flex-col gap-0.5">
                  <span className="font-semibold">{title}</span>
                  <span className="text-sm text-muted-foreground">{body}</span>
                </span>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Photo tool: the hero's main button scrolls here. */}
      <section id="photo-tool" aria-labelledby="photo-tool-heading" className="py-section">
        <Container className="flex flex-col gap-10">
          <SectionHeader id="photo-tool-heading" eyebrow="Online passport photo editor" title="Upload a photo and convert it to passport size">
            Choose your country and upload a photo. We find your face, check the background, and crop it to the right size.
            Your result opens on its own page, ready to download.
          </SectionHeader>

          <div className="grid items-start gap-6 lg:grid-cols-[minmax(0,1fr)_20rem] lg:gap-8">
            <Widget name="photo-editor" />

            <aside aria-labelledby="tips-heading" className={cn(card, "flex flex-col gap-4 p-5 sm:p-6")}>
              <h3 id="tips-heading" className="text-lg font-semibold">
                Tips for a photo that passes
              </h3>
              <ul className="flex flex-col gap-3 text-sm">
                {tips.map((tip) => (
                  <li key={tip} className="flex gap-2.5">
                    <CheckIcon className="mt-0.5 size-4 text-success" />
                    <span className="text-muted-foreground">{tip}</span>
                  </li>
                ))}
              </ul>
              <ArrowLink href={links.requirements}>Full photo requirements</ArrowLink>
            </aside>
          </div>
        </Container>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="border-y py-section">
        <Container className="flex flex-col gap-10">
          <SectionHeader id="how-heading" eyebrow="How it works" title="How to make a passport photo online in 3 steps">
            You need a camera, a plain wall, and good light. Our passport photo maker handles the measurements.
          </SectionHeader>

          <ol className="grid gap-4 md:grid-cols-3 md:gap-6">
            {steps.map(({ icon: Icon, title, body }, index) => (
              <li key={title} className={cn(card, "relative flex flex-col gap-4 p-6 sm:p-7")}>
                <div className="flex items-center justify-between">
                  <span className="flex size-11 items-center justify-center rounded-lg bg-primary text-primary-foreground shadow-sm">
                    <Icon className="size-5" />
                  </span>
                  <span aria-hidden="true" className="font-display text-4xl font-semibold text-border-strong">
                    {String(index + 1).padStart(2, "0")}
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

          <p className="text-sm text-muted-foreground">
            Want the exact measurements? Read our guide to the{" "}
            <Link href={links.size} className={textLink}>
              U.S. passport photo size
            </Link>{" "}
            in inches, millimeters, and pixels.
          </p>
        </Container>
      </section>

      {/* Sizes: U.S. documents and international formats */}
      <section aria-labelledby="sizes-heading" className="py-section">
        <Container className="flex flex-col gap-10">
          <SectionHeader id="sizes-heading" eyebrow="Photo sizes" title="Passport photo sizes for the U.S. and 60+ countries">
            One tool for every format. Make a 2 × 2 photo for U.S. documents, or a passport size photo for your home country
            or your next visa.
          </SectionHeader>

          <div className="grid gap-6 lg:grid-cols-2">
            <div className={cn(card, "flex flex-col gap-5 p-6 sm:p-8")}>
              <div className="flex items-center gap-3">
                <span className="flex h-7 items-center rounded-md bg-primary-subtle px-2 text-xs font-bold text-primary-subtle-foreground">
                  US
                </span>
                <h3 className="text-xl font-semibold">United States: 2 × 2 inch photos</h3>
              </div>
              <ul className="flex flex-col divide-y">
                {usDocuments.map((doc) => (
                  <li key={doc.title} className="flex flex-col gap-0.5 py-3 first:pt-0 sm:flex-row sm:items-baseline sm:justify-between sm:gap-4">
                    <span className="font-medium">{doc.title}</span>
                    <span className="text-sm text-muted-foreground sm:text-right">{doc.detail}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-wrap gap-x-6 gap-y-2">
                <ArrowLink href={links.tool}>Make a 2 × 2 photo</ArrowLink>
                <ArrowLink href={links.size}>U.S. size guide</ArrowLink>
              </div>
            </div>

            <div className={cn(card, "flex flex-col gap-5 p-6 sm:p-8")}>
              <div className="flex items-center gap-3">
                <span className="flex size-7 items-center justify-center rounded-md bg-primary-subtle text-primary-subtle-foreground">
                  <GlobeIcon className="size-4" />
                </span>
                <h3 className="text-xl font-semibold">Around the world</h3>
              </div>
              <ul className="grid grid-cols-2 gap-2 sm:gap-3">
                {countryTiles.map((country) => (
                  <li key={country.code} className="flex flex-col rounded-lg border px-3 py-2.5">
                    <span className="truncate text-sm font-medium">{country.name}</span>
                    <span className="text-xs text-muted-foreground">{country.size}</span>
                  </li>
                ))}
              </ul>
              <div className="mt-auto flex flex-col gap-2">
                <p className="text-xs text-muted-foreground">Print size, or the digital size the tool creates, in pixels.</p>
                <ArrowLink href={links.tool}>Choose from {moreSizes} more sizes in the tool</ArrowLink>
              </div>
            </div>
          </div>
        </Container>
      </section>

      {/* Print or digital */}
      <section aria-labelledby="output-heading" className="border-y py-section">
        <Container className="flex flex-col gap-10">
          <SectionHeader id="output-heading" eyebrow="Print or digital" title="Print your passport photo at home, or upload it online">
            Every download is a high-resolution file, so you can use the same photo on paper and in online applications.
          </SectionHeader>

          <div className="grid gap-6 md:grid-cols-2">
            <div className={cn(card, "flex flex-col gap-4 p-6 sm:p-8")}>
              <span className="flex size-11 items-center justify-center rounded-lg bg-primary-subtle text-primary-subtle-foreground">
                <PrinterIcon />
              </span>
              <h3 className="text-xl font-semibold">Print a 2 × 2 photo at home or at a lab</h3>
              <p className="text-muted-foreground">
                Print on matte or glossy photo paper at 100% scale, so a U.S. photo measures exactly 2 × 2 inches. Or send
                the file to a photo lab or pharmacy photo counter and pick up prints the same day. Check the size with a
                ruler before you mail your application.
              </p>
            </div>
            <div className={cn(card, "flex flex-col gap-4 p-6 sm:p-8")}>
              <span className="flex size-11 items-center justify-center rounded-lg bg-primary-subtle text-primary-subtle-foreground">
                <UploadCloudIcon />
              </span>
              <h3 className="text-xl font-semibold">Get a digital passport photo for online forms</h3>
              <p className="text-muted-foreground">
                Online passport renewals, the DS-160 visa form, and many foreign e-visa portals ask for a digital photo
                with pixel and file-size limits. If your file is too large, shrink it with our{" "}
                <Link href={links.compressor} className={textLink}>
                  free photo compressor
                </Link>
                .
              </p>
            </div>
          </div>
        </Container>
      </section>

      {/* Why online */}
      <section aria-labelledby="why-heading" className="py-section">
        <Container className="flex flex-col gap-10">
          <SectionHeader id="why-heading" eyebrow="Online vs. in store" title="Why use an online passport photo maker instead of a store">
            Pharmacies such as Walgreens and CVS, post offices, and photo studios take passport photos, and they&apos;re a
            good choice if you&apos;d rather hand the job to someone else. Making your photo online gives you more control
            and a digital file for online applications.
          </SectionHeader>

          {/* Phones get stacked cards; a three-column table is too cramped there. */}
          <ul className="flex flex-col gap-3 sm:hidden">
            {comparison.map((row) => (
              <li key={row.label} className={cn(card, "flex flex-col gap-3 p-4")}>
                <span className="font-semibold">{row.label}</span>
                <dl className="grid grid-cols-2 gap-3 text-sm">
                  <div className="flex flex-col gap-0.5 rounded-lg bg-primary-subtle p-3">
                    <dt className="text-xs font-medium text-primary-subtle-foreground">{siteConfig.name}</dt>
                    <dd className="font-medium">{row.online}</dd>
                  </div>
                  <div className="flex flex-col gap-0.5 rounded-lg border p-3">
                    <dt className="text-xs font-medium text-muted-foreground">Pharmacy or post office</dt>
                    <dd className="text-muted-foreground">{row.store}</dd>
                  </div>
                </dl>
              </li>
            ))}
          </ul>

          <div className={cn(card, "hidden overflow-hidden sm:block")}>
            <table className="w-full text-left">
              <caption className="sr-only">Online passport photo maker compared with an in-store passport photo</caption>
              <thead>
                <tr className="border-b">
                  <th scope="col" className="p-4 font-semibold sm:p-5">
                    <span className="sr-only">Compare</span>
                  </th>
                  <th scope="col" className="bg-primary-subtle p-4 font-semibold text-primary-subtle-foreground sm:p-5">
                    {siteConfig.name}
                  </th>
                  <th scope="col" className="p-4 font-semibold sm:p-5">
                    Pharmacy or post office
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {comparison.map((row) => (
                  <tr key={row.label}>
                    <th scope="row" className="p-4 font-medium sm:p-5">
                      {row.label}
                    </th>
                    <td className="bg-primary-subtle/40 p-4 sm:p-5">
                      <span className="flex items-center gap-2">
                        <CheckIcon className="size-4 text-success" />
                        {row.online}
                      </span>
                    </td>
                    <td className="p-4 text-muted-foreground sm:p-5">{row.store}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Container>
      </section>

      {/* Compliance checklist */}
      <section aria-labelledby="accepted-heading" className="border-y py-section">
        <Container className="flex flex-col gap-10">
          <SectionHeader id="accepted-heading" eyebrow="Requirements" title="What makes a passport photo get accepted">
            Most rejected photos fail for a handful of avoidable reasons, such as shadows, the wrong head size, or glasses.
            Run through the checklist for your country before you print.
          </SectionHeader>

          <div className="grid gap-6 md:grid-cols-2">
            {[
              { title: "U.S. passport and visa photos", rules: usRules },
              { title: "Passport photos for other countries", rules: internationalRules },
            ].map((group) => (
              <div key={group.title} className={cn(card, "flex flex-col gap-4 p-6 sm:p-8")}>
                <h3 className="text-xl font-semibold">{group.title}</h3>
                <ul className="flex flex-col gap-3">
                  {group.rules.map((rule) => (
                    <li key={rule} className="flex gap-3">
                      <span className="mt-0.5 flex size-5 shrink-0 items-center justify-center rounded-full bg-success-subtle text-success">
                        <CheckIcon className="size-3.5" />
                      </span>
                      <span className="text-muted-foreground">{rule}</span>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          <p className="max-w-prose text-pretty text-muted-foreground">
            Your clothes matter, too. A white shirt can blend into a white background, so choose a darker or colored top.
            Skip uniforms, camouflage, and headphones, and keep your hair away from your eyes. Read the full{" "}
            <Link href={links.requirements} className={textLink}>
              passport photo requirements
            </Link>
            .
          </p>
        </Container>
      </section>

      {/* Tools and guides */}
      <section aria-labelledby="resources-heading" className="py-section">
        <Container className="flex flex-col gap-10">
          <SectionHeader id="resources-heading" eyebrow="Tools and guides" title="Free passport photo tools and guides">
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
      <section aria-labelledby="principles-heading" className="border-y py-section">
        <Container className="flex flex-col gap-10">
          <SectionHeader id="principles-heading" eyebrow="Our approach" title="How we work" />
          <ul className="grid gap-4 md:grid-cols-3 md:gap-6">
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
      <section aria-labelledby="faq-heading" className="py-section">
        <Container className="grid gap-10 lg:grid-cols-[minmax(0,20rem)_minmax(0,1fr)] lg:gap-16">
          <SectionHeader id="faq-heading" eyebrow="FAQ" title="Passport photo online: frequently asked questions" className="lg:sticky lg:top-[calc(var(--spacing-header)+2rem)] lg:self-start">
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

      {/* Final CTA */}
      <section aria-labelledby="cta-heading" className="pb-section">
        <Container>
          <div className={cn(card, "flex flex-col items-start gap-6 p-8 sm:p-12 lg:flex-row lg:items-center lg:justify-between")}>
            <div className="flex max-w-2xl flex-col gap-3">
              <h2 id="cta-heading" className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
                Make your passport photo now. It&apos;s free.
              </h2>
              <p className="text-lg text-pretty text-muted-foreground">
                Grab your phone, find a plain wall near a window, and get a print-ready 2 × 2 inch photo, or your
                country&apos;s size, in a few minutes.
              </p>
            </div>
            <a
              href={links.tool}
              className={buttonVariants({ size: "lg", className: "group w-full sm:w-auto" })}
            >
              Make my passport photo
              <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
            </a>
          </div>
        </Container>
      </section>
    </>
  );
}

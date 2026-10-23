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
  title: `Passport Photo Online: Make a U.S. Passport Photo in Minutes | ${siteConfig.name}`,
  absoluteTitle: true,
  description:
    "Make a 2 × 2 inch U.S. passport photo online. Crop to the official head size, shrink files for upload limits, and download. Your photo never leaves your device.",
  path: "/",
  ogImage: "/og",
});

/**
 * Internal link targets from the content plan (Internal Linking sheet).
 * Paths follow the site's /tool/ and /guide/ convention. Confirm each slug
 * exists before deploying, or point it at the closest live page.
 */
const links = {
  maker: "/tool/passport-photo-maker",
  requirements: "/guide/passport-photo-requirements",
  converter: "/tool/passport-photo-converter",
  twoByTwo: "/tool/2x2-photo-maker",
  visaTool: "/tool/us-visa-photo",
  visaRequirements: "/guide/us-visa-photo-requirements",
  greenCard: "/guide/green-card-photo",
  baby: "/guide/baby-passport-photo",
  idPhoto: "/tool/id-photo-maker",
  size: "/guide/us-passport-photo-size",
  examples: "/guide/passport-photo-examples",
  digital: "/guide/digital-passport-photo",
  renewal: "/guide/passport-renewal-photo",
  atHome: "/guide/how-to-take-passport-photo-at-home",
  print: "/guide/print-passport-photos",
  cost: "/guide/passport-photo-cost",
  nearMe: "/guide/passport-photos-near-me",
  bySize: "/guide/passport-photo-size-by-country",
  indian: "/guide/indian-passport-photo",
  canadian: "/guide/canadian-passport-photo",
  schengen: "/guide/schengen-visa-photo",
} as const;

const trustPoints = [
  "Sized to U.S. Department of State specifications",
  "Processed in your browser, never uploaded",
  "Works on any phone, tablet, or computer",
];

const documents = [
  {
    title: "U.S. passport",
    body: "Book and card applications, first-time or renewal. 2 × 2 inches.",
    href: links.maker,
  },
  {
    title: "U.S. visa (DS-160)",
    body: "A square digital file sized for the online visa application.",
    href: links.visaTool,
  },
  {
    title: "Green card and citizenship",
    body: "2 × 2 inch photos for USCIS forms such as the I-485 and N-400.",
    href: links.greenCard,
  },
  {
    title: "Baby or child passport",
    body: "Extra tips for newborns who can't sit up or hold still.",
    href: links.baby,
  },
  {
    title: "Any 2 × 2 photo",
    body: "The same square format for IDs, badges, and other forms.",
    href: links.twoByTwo,
  },
  {
    title: "Another country",
    body: "Compare 35 × 45 mm, 50 × 70 mm, and other foreign sizes.",
    href: links.bySize,
  },
];

const steps = [
  {
    title: "Step 1: Take a selfie or upload an existing photo",
    body: "Stand in front of a plain white or off-white wall, face a window for soft, even light, and ask someone to take the photo from about 4 feet away. A photo you already have works too, as long as you took it in the last six months.",
    link: { href: links.atHome, label: "how to take a passport photo at home" },
  },
  {
    title: "Step 2: Crop to the correct head size",
    body: "Line up the on-screen guides with your chin and the top of your head. The tool sizes the frame to 2 × 2 inches and keeps your head between 1 and 1 3/8 inches tall, the range the State Department requires.",
    link: { href: links.size, label: "U.S. passport photo size" },
  },
  {
    title: "Step 3: Download for print or online upload",
    body: "Save a high-resolution file to print at home or at a photo lab, or shrink it to meet the file-size limit of an online application, such as an online passport renewal or the DS-160.",
    link: { href: links.digital, label: "digital passport photo specs" },
  },
];

const comparison = [
  { label: "Where you take it", online: "Anywhere, on your own schedule", store: "During store or office hours" },
  { label: "Retakes", online: "As many as you like", store: "Depends on the location" },
  { label: "Digital file for online renewal", online: "Included in every download", store: "Not always available" },
  { label: "Who handles your image", online: "Only you, on your device", store: "Store staff and equipment" },
  { label: "Best for", online: "Planning ahead and online renewals", store: "Hands-off help on the same day" },
];

const useCases = [
  {
    title: "U.S. passport book and card applications",
    body: "First-time applicants, renewals by mail, and online renewals all use the same 2 × 2 inch photo. Renewing? You need a new photo, not the one in your current passport. Children and newborns need their own photo, too, even when a parent applies for them.",
    links: [
      { href: links.requirements, label: "Passport photo requirements" },
      { href: links.renewal, label: "Renewal photo rules" },
      { href: links.baby, label: "Infant passport photos" },
    ],
  },
  {
    title: "U.S. visa, green card, and USCIS forms",
    body: "Visa applicants upload a square digital photo with strict pixel and file-size limits. USCIS forms ask for printed 2 × 2 inch photos, and some ask for more than one copy. Follow the instructions on your specific form for how many to send and how to label them.",
    links: [
      { href: links.visaRequirements, label: "U.S. visa photo requirements" },
      { href: links.greenCard, label: "Green card photo size" },
      { href: links.idPhoto, label: "ID photo maker" },
    ],
  },
  {
    title: "Foreign passports and visas for U.S. residents",
    body: "Many countries use a different size than the U.S. Canada uses 50 × 70 mm, and most of Europe uses 35 × 45 mm. Check your country's size before you print, because U.S. stores often print only the 2 × 2 inch format.",
    links: [
      { href: links.indian, label: "Indian passport photo" },
      { href: links.canadian, label: "Canadian passport photo" },
      { href: links.schengen, label: "Schengen visa photo" },
    ],
  },
];

const faqs = [
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
    question: "How long does it take to make a passport photo online?",
    answer:
      "Most people finish in a few minutes. Taking a good photo usually takes the longest, and cropping and downloading take less than a minute.",
  },
  {
    question: "Can I print my passport photo at home?",
    answer:
      "Yes. Print it on matte or glossy photo-quality paper at 100% scale so it measures exactly 2 × 2 inches. You can also send the file to a photo lab and pick up prints the same day.",
  },
  {
    question: "Do you store my photos?",
    answer:
      "No. Our photo tools run entirely in your browser, so your images are never uploaded to our servers. Close the page, and the photo is gone unless you saved it.",
  },
];

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

const faqJsonLd = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: faqs.map((faq) => ({
    "@type": "Question",
    name: faq.question,
    acceptedAnswer: { "@type": "Answer", text: faq.answer },
  })),
};

const textLink = "font-medium text-primary underline underline-offset-4 hover:text-primary-hover";
const sectionHeading = "font-display text-3xl font-semibold tracking-tight text-balance";

export default async function Home() {
  const pages = await getPageSummaries();
  const tools = pages.filter((page) => page.category === "tool" && page.template !== "hub");
  const guides = pages.filter((page) => page.category === "guide" && page.template !== "hub");

  return (
    <>
      <JsonLd data={[organizationJsonLd(), websiteJsonLd(), faqJsonLd]} />

      {/* Hero */}
      <section className="border-b pt-page pb-section">
        <Container className="flex flex-col items-start gap-6">
          <h1 className="max-w-3xl font-display text-5xl font-semibold tracking-tight text-balance">
            Passport Photo Online: Create a Compliant U.S. Passport Photo in Minutes
          </h1>
          <p className="max-w-prose text-lg text-pretty text-muted-foreground">
            Make a passport photo online without leaving home. Take a picture with your phone, crop it to the official 2 × 2
            inch U.S. format, and download a file you can print or upload. You skip the store line, retake as often as you
            like, and keep your photo private, because it never leaves your device.
          </p>
          <div className="flex flex-wrap gap-3">
            <Link href={links.maker} className={buttonVariants({ size: "lg" })}>
              Make a passport photo
            </Link>
            <Link href={links.requirements} className={buttonVariants({ variant: "outline", size: "lg" })}>
              Read the requirements
            </Link>
          </div>
          <ul className="flex flex-col gap-2 text-sm text-muted-foreground sm:flex-row sm:flex-wrap sm:gap-x-6">
            {trustPoints.map((point) => (
              <li key={point} className="flex items-center gap-2">
                <span aria-hidden="true" className="size-1.5 rounded-full bg-primary" />
                {point}
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* Document selector */}
      <section aria-labelledby="documents-heading" className="py-section">
        <Container className="flex flex-col gap-8">
          <div className="flex max-w-prose flex-col gap-3">
            <h2 id="documents-heading" className={sectionHeading}>
              Choose your document
            </h2>
            <p className="text-pretty text-muted-foreground">
              Each document has its own size and rules. Pick yours, and we'll show you the right tool or guide.
            </p>
          </div>
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
            {documents.map((doc) => (
              <li key={doc.title}>
                <Link
                  href={doc.href}
                  className="flex h-full flex-col gap-1 rounded-lg border p-5 transition-colors hover:border-primary focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary"
                >
                  <span className="font-semibold">{doc.title}</span>
                  <span className="text-sm text-muted-foreground">{doc.body}</span>
                </Link>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      {/* How it works */}
      <section aria-labelledby="how-heading" className="border-y bg-surface py-section">
        <Container className="flex flex-col gap-8">
          <div className="flex max-w-prose flex-col gap-3">
            <h2 id="how-heading" className={sectionHeading}>
              How our online passport photo maker works
            </h2>
            <p className="text-pretty text-muted-foreground">
              You need a camera, a plain wall, and good light. The tool handles the measurements.
            </p>
          </div>
          <ol className="grid gap-8 md:grid-cols-3">
            {steps.map((step) => (
              <li key={step.title} className="flex flex-col gap-2">
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.body}</p>
                <p className="text-sm">
                  Learn more:{" "}
                  <Link href={step.link.href} className={textLink}>
                    {step.link.label}
                  </Link>
                </p>
              </li>
            ))}
          </ol>
          <p className="max-w-prose text-pretty text-muted-foreground">
            Working on a phone? Use the rear camera instead of the front camera when you can, and turn off portrait mode.
            Portrait mode blurs the edges around your hair and shoulders, which can make an otherwise good photo look edited.
            A friend, a tripod, or a self-timer helps you keep the camera level with your eyes.
          </p>
        </Container>
      </section>

      {/* Why online */}
      <section aria-labelledby="why-heading" className="py-section">
        <Container className="flex flex-col gap-8">
          <div className="flex max-w-prose flex-col gap-3">
            <h2 id="why-heading" className={sectionHeading}>
              Why use an online passport photo maker instead of a store
            </h2>
            <p className="text-pretty text-muted-foreground">
              Pharmacies, post offices, and photo studios take passport photos, and they're a good choice if you'd rather
              hand the job to someone else. A passport photo maker gives you more control, more privacy, and a digital file
              you can use for online applications.
            </p>
          </div>

          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold">Retake as many times as you like</h3>
              <p className="text-muted-foreground">
                Blinked? Squinted? Shadow behind your ear? Take another photo. You can keep trying until you're happy,
                without paying for a second sitting or waiting in line again.
              </p>
            </div>
            <div className="flex flex-col gap-2">
              <h3 className="text-xl font-semibold">Keep your photo on your own device</h3>
              <p className="text-muted-foreground">
                Our tools process your image in your browser. Nobody else sees it, and we can't store it, sell it, or
                train anything on it.
              </p>
            </div>
          </div>

          <div className="overflow-x-auto rounded-lg border">
            <table className="w-full min-w-[36rem] text-left text-sm">
              <caption className="sr-only">Online passport photo maker compared with an in-store passport photo</caption>
              <thead className="bg-surface">
                <tr>
                  <th scope="col" className="p-4 font-semibold">
                    Compare
                  </th>
                  <th scope="col" className="p-4 font-semibold">
                    Online photo maker
                  </th>
                  <th scope="col" className="p-4 font-semibold">
                    Pharmacy or post office
                  </th>
                </tr>
              </thead>
              <tbody>
                {comparison.map((row) => (
                  <tr key={row.label} className="border-t">
                    <th scope="row" className="p-4 font-medium">
                      {row.label}
                    </th>
                    <td className="p-4 text-muted-foreground">{row.online}</td>
                    <td className="p-4 text-muted-foreground">{row.store}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <p className="text-sm text-muted-foreground">
            Prefer a store? Compare{" "}
            <Link href={links.cost} className={textLink}>
              passport photo prices
            </Link>{" "}
            or find{" "}
            <Link href={links.nearMe} className={textLink}>
              passport photos near you
            </Link>
            .
          </p>
        </Container>
      </section>

      {/* Use cases */}
      <section aria-labelledby="uses-heading" className="border-y bg-surface py-section">
        <Container className="flex flex-col gap-8">
          <h2 id="uses-heading" className={sectionHeading}>
            Every photo document you can create
          </h2>
          <div className="grid gap-8 md:grid-cols-3">
            {useCases.map((group) => (
              <div key={group.title} className="flex flex-col gap-3">
                <h3 className="text-xl font-semibold">{group.title}</h3>
                <p className="text-muted-foreground">{group.body}</p>
                <ul className="flex flex-col gap-1 text-sm">
                  {group.links.map((item) => (
                    <li key={item.href}>
                      <Link href={item.href} className={textLink}>
                        {item.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* Compliance checklist */}
      <section aria-labelledby="accepted-heading" className="py-section">
        <Container className="flex flex-col gap-8">
          <div className="flex max-w-prose flex-col gap-3">
            <h2 id="accepted-heading" className={sectionHeading}>
              What makes a passport photo get accepted
            </h2>
            <p className="text-pretty text-muted-foreground">
              Most rejected photos fail for a handful of avoidable reasons, such as shadows, the wrong head size, or glasses.
              Run through this checklist before you print.
            </p>
          </div>
          <h3 className="text-xl font-semibold">Quick compliance checklist at a glance</h3>
          <div className="grid gap-8 md:grid-cols-2">
            <div className="flex flex-col gap-3">
              <h4 className="font-semibold">Size, head position, and background</h4>
              <ul className="flex list-disc flex-col gap-2 pl-5 text-muted-foreground">
                <li>The photo measures exactly 2 × 2 inches (51 × 51 mm).</li>
                <li>Your head measures 1 to 1 3/8 inches from chin to top of head.</li>
                <li>The background is plain white or off-white, with no shadows or patterns.</li>
                <li>You took the photo in color within the last six months.</li>
              </ul>
            </div>
            <div className="flex flex-col gap-3">
              <h4 className="font-semibold">Expression, glasses, and head coverings</h4>
              <ul className="flex list-disc flex-col gap-2 pl-5 text-muted-foreground">
                <li>You face the camera with both eyes open and a neutral expression or natural smile.</li>
                <li>You removed your glasses. Exceptions require a signed medical statement.</li>
                <li>You wear no hat or head covering unless it's for religious or medical reasons.</li>
                <li>No filters, retouching, or edits change how you look.</li>
              </ul>
            </div>
          </div>
          <p className="max-w-prose text-pretty text-muted-foreground">
            Your clothes matter more than you might think. A white shirt can blend into a white background, so choose a
            darker or colored top. Skip uniforms, camouflage, headphones, and large reflective jewelry. Keep your hair away
            from your eyes so your full face stays visible.
          </p>
          <p className="text-sm text-muted-foreground">
            Read the full{" "}
            <Link href={links.requirements} className={textLink}>
              U.S. passport photo requirements
            </Link>{" "}
            or see{" "}
            <Link href={links.examples} className={textLink}>
              acceptable and rejected photo examples
            </Link>
            . Already have a photo?{" "}
            <Link href={links.converter} className={textLink}>
              Convert it to passport size
            </Link>
            .
          </p>
        </Container>
      </section>

      {/* Tools */}
      <section aria-labelledby="tools-heading" className="border-y bg-surface py-section">
        <Container className="flex flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <h2 id="tools-heading" className={sectionHeading}>
              Photo tools
            </h2>
            <Link href="/tool" className="text-sm font-medium text-primary hover:text-primary-hover">
              All tools →
            </Link>
          </div>
          <PageCardList pages={tools} />
        </Container>
      </section>

      {/* Guides */}
      <section aria-labelledby="guides-heading" className="py-section">
        <Container className="flex flex-col gap-8">
          <div className="flex flex-wrap items-end justify-between gap-4">
            <div className="flex max-w-prose flex-col gap-3">
              <h2 id="guides-heading" className={sectionHeading}>
                Passport photo guides and resources
              </h2>
              <p className="text-pretty text-muted-foreground">
                Plain-English explanations of official rules, with links to the agency sources we used.
              </p>
            </div>
            <Link href="/guide" className="text-sm font-medium text-primary hover:text-primary-hover">
              All guides →
            </Link>
          </div>
          <PageCardList pages={guides} />
        </Container>
      </section>

      {/* How we work */}
      <section aria-labelledby="principles-heading" className="border-y bg-surface py-section">
        <Container className="flex flex-col gap-8">
          <h2 id="principles-heading" className={sectionHeading}>
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
        <Container className="flex max-w-3xl flex-col gap-8">
          <h2 id="faq-heading" className={sectionHeading}>
            Passport photo online: frequently asked questions
          </h2>
          <div className="flex flex-col divide-y border-y">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-4">
                <summary className="cursor-pointer list-none font-semibold [&::-webkit-details-marker]:hidden focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-primary">
                  <h3 className="inline text-lg">{faq.question}</h3>
                </summary>
                <p className="mt-3 text-muted-foreground">{faq.answer}</p>
              </details>
            ))}
          </div>
        </Container>
      </section>

      {/* Final CTA */}
      <section aria-labelledby="cta-heading" className="border-t bg-surface py-section">
        <Container className="flex flex-col items-start gap-4">
          <h2 id="cta-heading" className={sectionHeading}>
            Ready to make your passport photo?
          </h2>
          <p className="max-w-prose text-pretty text-muted-foreground">
            Grab your phone, find a plain wall near a window, and have a print-ready 2 × 2 inch photo in a few minutes. Not sure your photo will pass? Check it against the requirements first, then download with confidence.
          </p>
          <Link href={links.maker} className={buttonVariants({ size: "lg" })}>
            Make a passport photo
          </Link>
        </Container>
      </section>
    </>
  );
}
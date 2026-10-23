import Link from "next/link";

import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { siteConfig } from "@/config/site";

const photoTypes = [
  { name: "U.S. passport", size: "2 × 2 in", detail: "600 × 600 px digital, head 1–1⅜ in" },
  { name: "U.S. visa", size: "2 × 2 in", detail: "Digital upload for the DS-160" },
  { name: "Green card & USCIS", size: "2 × 2 in", detail: "Forms I-90, I-131, I-485 and more" },
  { name: "Driver's license & state ID", size: "Varies", detail: "Formatted to your state's rules" },
];

const steps = [
  { title: "Take a photo", body: "Use your phone against any plain wall in good light." },
  { title: "We check it", body: "Size, framing, background, and lighting are checked automatically." },
  { title: "Print or upload", body: "Download a print-ready sheet or a compliant digital file." },
];

export default function Home() {
  return (
    <>
      <section className="py-section">
        <Container className="grid items-center gap-12 lg:grid-cols-[1.2fr_1fr]">
          <div className="flex flex-col items-start gap-6">
            <p className="rounded-full bg-primary-subtle px-3 py-1 text-xs font-medium tracking-wide text-primary-subtle-foreground uppercase">
              Ready in minutes
            </p>
            <h1 className="max-w-prose font-display text-5xl font-semibold tracking-tight text-balance">
              {siteConfig.tagline}
            </h1>
            <p className="max-w-prose text-lg text-pretty text-muted-foreground">{siteConfig.description}</p>
            <div className="flex flex-wrap gap-3">
              <Link href="/#photo-types" className={buttonVariants({ size: "lg" })}>
                Make your photo
              </Link>
              <Link href="/#how-it-works" className={buttonVariants({ variant: "outline", size: "lg" })}>
                How it works
              </Link>
            </div>
          </div>

          <PhotoGuide />
        </Container>
      </section>

      <section id="photo-types" className="border-y bg-surface py-section">
        <Container className="flex flex-col gap-10">
          <SectionHeading title="Photo types" description="Sized and checked for the most common U.S. documents." />
          <ul className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {photoTypes.map((type) => (
              <li key={type.name} className="flex flex-col gap-2 rounded-lg border bg-surface-raised p-6 shadow-sm">
                <span className="font-mono text-sm text-primary">{type.size}</span>
                <h3 className="text-lg font-semibold">{type.name}</h3>
                <p className="text-sm text-muted-foreground">{type.detail}</p>
              </li>
            ))}
          </ul>
        </Container>
      </section>

      <section id="how-it-works" className="py-section">
        <Container className="flex flex-col gap-10">
          <SectionHeading title="How it works" description="Three steps, no studio visit." />
          <ol className="grid gap-8 md:grid-cols-3">
            {steps.map((step, index) => (
              <li key={step.title} className="flex flex-col gap-3">
                <span className="inline-flex size-10 items-center justify-center rounded-full bg-primary text-sm font-semibold text-primary-foreground">
                  {index + 1}
                </span>
                <h3 className="text-xl font-semibold">{step.title}</h3>
                <p className="text-muted-foreground">{step.body}</p>
              </li>
            ))}
          </ol>
        </Container>
      </section>
    </>
  );
}

function SectionHeading({ title, description }: { title: string; description: string }) {
  return (
    <div className="flex max-w-prose flex-col gap-2">
      <h2 className="font-display text-3xl font-semibold tracking-tight">{title}</h2>
      <p className="text-muted-foreground">{description}</p>
    </div>
  );
}

/** Illustrative 2 × 2 in passport frame with head-size guides. */
function PhotoGuide() {
  return (
    <figure className="mx-auto flex w-full max-w-sm flex-col gap-4">
      <div className="relative aspect-square rounded-xl border bg-surface-raised p-6 shadow-lg">
        <svg viewBox="0 0 200 200" className="size-full" aria-hidden="true">
          <rect x="0" y="0" width="200" height="200" rx="6" className="fill-muted" />
          <g className="fill-border-strong">
            <ellipse cx="100" cy="88" rx="38" ry="48" />
            <path d="M30 200c4-38 34-58 70-58s66 20 70 58Z" />
          </g>
          <g className="stroke-primary" strokeWidth="1.5" strokeDasharray="4 4" fill="none">
            <line x1="20" y1="40" x2="180" y2="40" />
            <line x1="20" y1="136" x2="180" y2="136" />
            <line x1="100" y1="12" x2="100" y2="188" />
          </g>
        </svg>
      </div>
      <figcaption className="flex justify-between text-sm text-muted-foreground">
        <span>2 × 2 in</span>
        <span>Head: 1–1⅜ in</span>
      </figcaption>
    </figure>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { FormattedDate } from "@/components/content/formatted-date";
import { EmailPhotoForm } from "@/components/tools/email-photo-form";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Alert } from "@/components/ui/field";
import type { PhotoResultDoc } from "@/lib/db/collections";
import { getCountry } from "@/lib/photo/countries";
import { downloadUrl, getPhotoResult } from "@/lib/photo/results";
import { buildMetadata } from "@/lib/seo/metadata";

const EDITOR_PATH = "/tool/passport-photo-editor";

// Result pages are private links: never indexed, and their links aren't followed.
export const metadata = buildMetadata({
  title: "Your passport photo",
  description: "Preview, download, or email the passport photo you just made with idphoto.us. This link expires automatically.",
  path: "/preview",
  indexable: false,
  follow: false,
  noarchive: true,
  maxImagePreview: "none",
});

/**
 * Shows a processed photo by its result id. Ids aren't known at build time,
 * so the lookup runs per request inside <Suspense>; the header is static.
 */
export default function PreviewPage({ params }: PageProps<"/preview/[id]">) {
  return (
    <Container className="pt-page pb-10 sm:pb-14">
      <article className="flex flex-col gap-10">
        <header className="flex flex-col gap-4 border-b pb-8">
          <h1 className="font-display text-4xl font-semibold tracking-tight text-balance">Your passport photo</h1>
          <p className="max-w-prose text-lg text-pretty text-muted-foreground">
            Check the result, then download it or send it to your email. Compare it against the official requirements before you
            submit it.
          </p>
        </header>
        <Suspense fallback={<PreviewSkeleton />}>
          <PhotoPreview params={params} />
        </Suspense>
      </article>
    </Container>
  );
}

async function PhotoPreview({ params }: Pick<PageProps<"/preview/[id]">, "params">) {
  const { id } = await params;
  const result = await getPhotoResult(id);
  if (!result) notFound();

  const country = getCountry(result.countryCode);
  const countryName = country?.name ?? result.countryCode;
  const [width, height] = result.dimensions.split("x").map(Number);

  return (
    <div className="grid gap-10 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      <figure className="flex flex-col gap-3">
        <div className="flex justify-center rounded-xl border bg-surface p-4 sm:p-6">
          {/* eslint-disable-next-line @next/next/no-img-element -- private, short-lived image; next/image would copy it into our cache */}
          <img
            src={result.previewUrl ?? result.imageUrl}
            alt={`Your processed ${countryName} passport photo`}
            width={width}
            height={height}
            className="h-auto max-h-[28rem] w-auto max-w-full rounded-md border"
          />
        </div>
        <figcaption className="text-sm text-muted-foreground">
          {countryName} passport · {width} × {height} px · {result.format} · {result.sizeKb} KB
        </figcaption>
      </figure>

      <div className="flex flex-col gap-8">
        <div className="flex flex-col gap-3 sm:flex-row">
          <a href={downloadUrl(result.imageUrl, `passport-photo-${result.countryCode}`)} className={buttonVariants({ size: "lg" })}>
            Download photo
          </a>
          <Link href={EDITOR_PATH} className={buttonVariants({ variant: "outline", size: "lg" })}>
            Make another photo
          </Link>
        </div>

        <BackgroundNotice metrics={result.metrics} />

        <section aria-labelledby="measurements-heading" className="flex flex-col gap-3">
          <h2 id="measurements-heading" className="font-display text-xl font-semibold tracking-tight">
            Measurements
          </h2>
          <dl className="grid gap-x-6 gap-y-2 text-sm sm:grid-cols-[auto_1fr]">
            <dt className="text-muted-foreground">Head height</dt>
            <dd className="font-medium">{formatPct(result.metrics.headHeightPct)} of photo height</dd>
            <dt className="text-muted-foreground">Eye line</dt>
            <dd className="font-medium">{formatPct(result.metrics.eyePositionPct)} up from the bottom</dd>
            <dt className="text-muted-foreground">Space above head</dt>
            <dd className="font-medium">{formatPct(result.metrics.topMarginPct)} of photo height</dd>
          </dl>
          <p className="text-sm text-muted-foreground">
            These are measured automatically. They help you spot a bad crop, but they aren&apos;t an official check, and the
            agency that receives your application decides whether to accept the photo.
          </p>
        </section>

        <EmailPhotoForm resultId={result._id} />

        <p className="text-sm text-muted-foreground">
          This page expires on <FormattedDate iso={result.expiresAt.toISOString()} />. Download your photo before then.
        </p>
      </div>
    </div>
  );
}

function BackgroundNotice({ metrics }: { metrics: PhotoResultDoc["metrics"] }) {
  if (metrics.backgroundCorrected) {
    return (
      <Alert tone="warning">
        <p className="font-semibold">The background was replaced automatically</p>
        <p className="mt-1">
          Your original background didn&apos;t pass the check, so it was changed by software. Some agencies don&apos;t accept
          photos edited this way. Check your country&apos;s rules, and if in doubt, retake the photo against a plain, light wall.
        </p>
      </Alert>
    );
  }
  if (!metrics.backgroundValid) {
    return (
      <Alert tone="warning">
        <p className="font-semibold">The background may not meet the requirements</p>
        <p className="mt-1">Retake the photo against a plain, evenly lit, light-colored wall with no shadows or objects.</p>
      </Alert>
    );
  }
  return (
    <Alert tone="success">
      <p className="font-semibold">Background check passed</p>
    </Alert>
  );
}

function formatPct(value: number) {
  return `${Math.round(value * 10) / 10}%`;
}

/** Same footprint as the loaded preview, so the page doesn't jump when it streams in. */
function PreviewSkeleton() {
  return (
    <div role="status" className="grid gap-10 lg:grid-cols-[minmax(0,24rem)_minmax(0,1fr)]">
      <div className="flex aspect-[4/5] items-center justify-center rounded-xl border bg-surface text-sm text-muted-foreground">
        Loading your photo…
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-12 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-20 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}

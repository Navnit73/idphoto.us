import { notFound } from "next/navigation";
import { Suspense } from "react";

import { FormattedDate } from "@/components/content/formatted-date";
import { PhotoDownload } from "@/components/tools/photo-download";
import { Container } from "@/components/ui/container";
import { Alert } from "@/components/ui/field";
import type { PhotoResultDoc } from "@/lib/db/collections";
import { flagEmoji, getCountry } from "@/lib/photo/countries";
import { downloadUrl, getPhotoResult } from "@/lib/photo/results";
import { buildMetadata } from "@/lib/seo/metadata";

// Result pages are private links: never indexed, and their links aren't followed.
export const metadata = buildMetadata({
  title: "Your passport photo",
  description:
    "Preview, download, or email the passport photo you just made with idphoto.us. This link expires automatically.",
  path: null,
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
      <article className="flex flex-col gap-6">
        <header className="flex flex-col gap-2">
          <h1 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
            Your passport photo
          </h1>
          <p className="max-w-prose text-pretty text-muted-foreground">
            Check the result, then download it or send it to your email. Compare
            it against the official requirements before you submit it.
          </p>
        </header>
        <Suspense fallback={<PreviewSkeleton />}>
          <PhotoPreview params={params} />
        </Suspense>
      </article>
    </Container>
  );
}

async function PhotoPreview({
  params,
}: Pick<PageProps<"/preview/[id]">, "params">) {
  const { id } = await params;
  const result = await getPhotoResult(id);
  if (!result) notFound();

  const country = getCountry(result.countryCode);
  const countryName = country?.name ?? result.countryCode;
  const [width, height] = result.dimensions.split("x").map(Number);

  return (
    <PhotoDownload
      resultId={result._id}
      previewSrc={result.previewUrl ?? result.imageUrl}
      downloadHref={downloadUrl(
        result.imageUrl,
        `passport-photo-${result.countryCode}`,
      )}
      alt={`Your processed ${countryName} passport photo`}
      width={width}
      height={height}
      caption={
        <>
          {country && (
            <span aria-hidden="true">{flagEmoji(country.code)} </span>
          )}
          {countryName} passport · {width} × {height} px · {result.format} ·{" "}
          {result.sizeKb} KB
        </>
      }
    >
      <BackgroundNotice metrics={result.metrics} />

      <section
        aria-labelledby="measurements-heading"
        className="flex flex-col gap-2"
      >
        <h2
          id="measurements-heading"
          className="font-display text-lg font-semibold tracking-tight"
        >
          Measurements
        </h2>
        <dl className="grid grid-cols-3 gap-4 text-sm">
          <div>
            <dt className="text-muted-foreground">Head height</dt>
            <dd className="font-medium">
              {formatPct(result.metrics.headHeightPct)} of photo
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Eye line</dt>
            <dd className="font-medium">
              {formatPct(result.metrics.eyePositionPct)} from bottom
            </dd>
          </div>
          <div>
            <dt className="text-muted-foreground">Above head</dt>
            <dd className="font-medium">
              {formatPct(result.metrics.topMarginPct)} of photo
            </dd>
          </div>
        </dl>
        <p className="text-xs text-muted-foreground">
          These are measured automatically. They help you spot a bad crop, but
          they aren&apos;t an official check, and the agency that receives your
          application decides whether to accept the photo.
        </p>
      </section>

      <p className="text-sm text-muted-foreground">
        This page expires on{" "}
        <FormattedDate iso={result.expiresAt.toISOString()} />. Download your
        photo before then.
      </p>
    </PhotoDownload>
  );
}

function BackgroundNotice({ metrics }: { metrics: PhotoResultDoc["metrics"] }) {
  if (metrics.backgroundCorrected) return null;
  if (!metrics.backgroundValid) {
    return (
      <Alert tone="warning">
        <p className="font-semibold">
          The background may not meet the requirements
        </p>
        <p className="mt-1">
          Retake the photo against a plain, evenly lit, light-colored wall with
          no shadows or objects.
        </p>
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
    <div
      role="status"
      className="grid gap-8 lg:grid-cols-[minmax(0,22rem)_minmax(0,1fr)]"
    >
      <div className="flex aspect-square max-h-[22rem] animate-pulse items-center justify-center rounded-md bg-muted text-sm text-muted-foreground">
        Loading your photo…
      </div>
      <div className="flex flex-col gap-3">
        <div className="h-12 w-48 animate-pulse rounded-md bg-muted" />
        <div className="h-20 animate-pulse rounded-md bg-muted" />
      </div>
    </div>
  );
}

import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { FormattedDate } from "@/components/content/formatted-date";
import {
  AlertIcon,
  ArrowRightIcon,
  CameraIcon,
  CheckIcon,
  CropIcon,
  MailIcon,
} from "@/components/home/icons";
import { PhotoDownload } from "@/components/tools/photo-download";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Alert } from "@/components/ui/field";
import { cn } from "@/lib/cn";
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
 * so the lookup (and the header, which names the country) runs per request
 * inside <Suspense>.
 */
export default function PreviewPage({ params }: PageProps<"/preview/[id]">) {
  return (
    <Container className="pt-page pb-24 lg:pb-12">
      <Suspense fallback={<PreviewSkeleton />}>
        <PhotoPreview params={params} />
      </Suspense>
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
  const { metrics } = result;
  const backgroundOk = metrics.backgroundCorrected || metrics.backgroundValid;
  const expires = <FormattedDate iso={result.expiresAt.toISOString()} />;

  return (
    <article className="flex flex-col gap-4 lg:gap-5">
      <header className="flex flex-col gap-2.5">
        <h1 className="font-display text-2xl font-bold tracking-tight text-balance sm:text-4xl">
          Your <span className="text-primary">passport photo</span> is ready
          <span className="text-muted-foreground"> · </span>
          {country && (
            <span aria-hidden="true">{flagEmoji(country.code)} </span>
          )}
          {countryName}
        </h1>
        <ul className="flex flex-wrap gap-2 text-xs font-medium sm:text-sm">
          <li
            className={cn(
              "inline-flex items-center gap-1.5 rounded-full border px-3 py-1",
              backgroundOk
                ? "border-success/40 bg-success-subtle"
                : "border-warning/40 bg-warning-subtle",
            )}
          >
            {backgroundOk ? (
              <CheckIcon className="size-4 text-success" />
            ) : (
              <AlertIcon className="size-4 text-warning" />
            )}
            {metrics.backgroundCorrected
              ? "Background corrected"
              : backgroundOk
                ? "Background check passed"
                : "Check the background"}
          </li>
          <li className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary-subtle px-3 py-1 text-primary-subtle-foreground">
            <CropIcon className="size-4" />
            Sized for {countryName}
          </li>
        </ul>
      </header>

      <PhotoDownload
        resultId={result._id}
        imageSrc={result.imageUrl}
        guidesSrc={result.previewUrl ?? undefined}
        downloadHref={downloadUrl(
          result.imageUrl,
          `passport-photo-${result.countryCode}`,
        )}
        alt={`Your processed ${countryName} passport photo`}
        width={width}
        height={height}
        title={
          <>
            {country && (
              <span aria-hidden="true">{flagEmoji(country.code)} </span>
            )}
            {countryName} passport photo
          </>
        }
        badge={
          <span className="rounded-full bg-primary-subtle px-2.5 py-0.5 text-xs font-semibold text-primary-subtle-foreground">
            {width} × {height} px
          </span>
        }
        caption={
          <>
            {result.format} · {result.sizeKb} KB
          </>
        }
        summary={{
          title: `${countryName} passport photo`,
          meta: result.format,
          includes: [
            `Sized to ${width} × ${height} px`,
            metrics.backgroundCorrected
              ? "Background corrected"
              : "Background checked",
            "Measurement guide preview",
            `Digital file · ${result.sizeKb} KB`,
          ],
        }}
        expires={expires}
      >
        <BackgroundNotice metrics={metrics} />

        <section
          aria-labelledby="checks-heading"
          className="rounded-xl border border-border bg-surface-raised p-4 sm:p-5"
        >
          <div className="flex items-center gap-2.5">
            <span className="flex size-9 items-center justify-center rounded-lg bg-primary-subtle text-primary-subtle-foreground">
              <CameraIcon />
            </span>
            <h2
              id="checks-heading"
              className="font-display text-lg font-semibold tracking-tight"
            >
              Automatic checks
            </h2>
          </div>
          <dl className="mt-2 divide-y divide-border">
            <CheckRow ok label="Cropped and sized">
              {width} × {height} px
            </CheckRow>
            <CheckRow ok={backgroundOk} label="Background">
              {metrics.backgroundCorrected
                ? "Replaced"
                : backgroundOk
                  ? "Passed"
                  : "Needs attention"}
            </CheckRow>
            <CheckRow ok label="Head height">
              {formatPct(metrics.headHeightPct)} of photo
            </CheckRow>
            <CheckRow ok label="Eye line">
              {formatPct(metrics.eyePositionPct)} from bottom
            </CheckRow>
            <CheckRow ok label="Space above head">
              {formatPct(metrics.topMarginPct)} of photo
            </CheckRow>
          </dl>
          {metrics.backgroundCorrected && (
            <p className="mt-2 flex items-center gap-2 rounded-lg border border-success/40 bg-success-subtle px-3 py-2 text-sm font-medium">
              <CheckIcon className="size-4 text-success" />
              Background replaced with a plain, even background
            </p>
          )}
          <p className="mt-3 text-xs text-muted-foreground">
            These are measured automatically. They help you spot a bad crop, but
            they aren&apos;t an official check, and the agency that receives
            your application decides whether to accept the photo.
          </p>
        </section>

        <section
          aria-labelledby="help-heading"
          className="flex flex-col gap-3 rounded-xl border border-primary/30 bg-primary-subtle p-4 sm:flex-row sm:items-center sm:p-5"
        >
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary text-primary-foreground">
            <MailIcon />
          </span>
          <div className="flex-1">
            <h2
              id="help-heading"
              className="font-display font-semibold tracking-tight"
            >
              Questions about your photo?
            </h2>
            <p className="text-sm text-muted-foreground">
              Ask about sizing, printing, or the requirements. We reply by
              email.
            </p>
          </div>
          <Link
            href="/contact"
            className={buttonVariants({
              className: "shadow-none! sm:self-center",
            })}
          >
            Contact us
            <ArrowRightIcon className="size-4" />
          </Link>
        </section>
      </PhotoDownload>
    </article>
  );
}

function CheckRow({
  ok,
  label,
  children,
}: {
  ok: boolean;
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div className="flex items-center gap-3 py-2.5 text-sm">
      <dt className="flex items-center gap-2.5 font-medium">
        <span
          className={cn(
            "flex size-6 shrink-0 items-center justify-center rounded-full",
            ok
              ? "bg-success-subtle text-success"
              : "bg-warning-subtle text-warning",
          )}
        >
          {ok ? (
            <CheckIcon className="size-4" />
          ) : (
            <AlertIcon className="size-4" />
          )}
        </span>
        {label}
      </dt>
      <dd className="ml-auto text-right text-muted-foreground">{children}</dd>
    </div>
  );
}

/** Only the failing case needs more than the chip: what to do about it. */
function BackgroundNotice({ metrics }: { metrics: PhotoResultDoc["metrics"] }) {
  if (metrics.backgroundCorrected || metrics.backgroundValid) return null;
  return (
    <Alert tone="warning">
      <p className="font-semibold">
        The background may not meet the requirements
      </p>
      <p className="mt-1">
        Retake the photo against a plain, evenly lit, light-colored wall with no
        shadows or objects.
      </p>
    </Alert>
  );
}

function formatPct(value: number) {
  return `${Math.round(value * 10) / 10}%`;
}

/** Same footprint as the loaded preview, so the page doesn't jump when it streams in. */
function PreviewSkeleton() {
  return (
    <div role="status" className="flex flex-col gap-4 lg:gap-5">
      <h1 className="font-display text-2xl font-bold tracking-tight sm:text-4xl">
        Your <span className="text-primary">passport photo</span> is ready
      </h1>
      <div className="h-7 w-72 max-w-full animate-pulse rounded-full bg-muted" />
      <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] lg:gap-5">
        <div className="flex h-[calc(min(27svh,14.5rem)+5.5rem)] animate-pulse items-center justify-center rounded-xl bg-muted text-sm text-muted-foreground sm:h-[calc(min(43svh,25rem)+6rem)]">
          Loading your photo…
        </div>
        <div className="flex flex-col gap-3 rounded-xl border border-border p-4 sm:p-5">
          <div className="h-36 animate-pulse rounded-lg bg-muted" />
          <div className="h-11 animate-pulse rounded-md bg-muted" />
          <div className="h-11 animate-pulse rounded-md bg-muted" />
        </div>
      </div>
    </div>
  );
}

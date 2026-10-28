import { headers } from "next/headers";
import Link from "next/link";
import { notFound } from "next/navigation";
import { Suspense } from "react";

import { CheckoutPanel } from "@/components/checkout/checkout-panel";
import { FormattedDate } from "@/components/content/formatted-date";
import { AlertIcon, ArrowRightIcon, CheckIcon, CropIcon, DownloadIcon, MailIcon } from "@/components/home/icons";
import { PhotoResult } from "@/components/tools/photo-result";
import { buttonVariants } from "@/components/ui/button";
import { Container } from "@/components/ui/container";
import { Alert } from "@/components/ui/field";
import { cn } from "@/lib/cn";
import type { PaymentDoc, PhotoResultDoc } from "@/lib/db/collections";
import { resolveCurrencyFromHeaders } from "@/lib/payments/currency";
import { getPaidPaymentByResultId } from "@/lib/payments/payment-service";
import { flagEmoji, getCountry } from "@/lib/photo/countries";
import { getPhotoResult } from "@/lib/photo/results";
import { buildMetadata } from "@/lib/seo/metadata";

// Result pages are private links: never indexed, and their links aren't followed.
export const metadata = buildMetadata({
  title: "Your passport photo",
  description: "Preview and buy the passport photo you just made with idphoto.us. This link expires automatically.",
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
    // Bottom padding below lg clears the sticky pay bar.
    <Container className="pt-page pb-28 lg:pb-16">
      <Suspense fallback={<PreviewSkeleton />}>
        <PhotoPreview params={params} />
      </Suspense>
    </Container>
  );
}

async function PhotoPreview({ params }: Pick<PageProps<"/preview/[id]">, "params">) {
  const { id } = await params;
  // getPhotoResult opts out of prerendering, so it runs before the payments query.
  const result = await getPhotoResult(id);
  if (!result) notFound();
  const paid = await getPaidPaymentByResultId(id);

  // Price in the visitor's currency from the country header (create-order re-checks it)
  const { country: geoCountry, currency } = resolveCurrencyFromHeaders(await headers());

  const country = getCountry(result.countryCode);
  const countryName = country?.name ?? result.countryCode;
  const [width, height] = result.dimensions.split("x").map(Number);
  const { metrics } = result;
  const backgroundOk = metrics.backgroundCorrected || metrics.backgroundValid;

  return (
    <article>
      <PhotoResult
        // In the photo column, so the checkout panel starts at the top of the page.
        intro={
          <header className="flex flex-col gap-2">
            {/* One row on wide screens: the stepper sits opposite the country label. */}
            <div className="flex flex-col gap-4 lg:flex-row-reverse lg:items-center lg:justify-between">
              <Stepper done={!!paid} />
              <p className="flex items-center gap-2 text-sm font-semibold text-muted-foreground">
                {country && <span aria-hidden="true">{flagEmoji(country.code)}</span>}
                {countryName} passport photo
              </p>
            </div>
            <h1 className="font-display text-3xl font-semibold tracking-tight text-balance sm:text-4xl">
              Your photo is ready.
            </h1>
            {/* The chips and spec sheet repeat this, so it only shows where there's room. */}
            <p className="hidden text-muted-foreground text-pretty sm:block">
              Cropped to {width} × {height} px and checked automatically. Review it, then download the clean,
              full-resolution file.
            </p>
          </header>
        }
        // Only the guides preview reaches the browser before payment.
        imageSrc={result.previewUrl ?? result.imageUrl}
        alt={`Preview of your processed ${countryName} passport photo${result.previewUrl ? ", with measurement guides" : ""}`}
        width={width}
        height={height}
        chips={
          <>
            <li
              className={cn(
                "inline-flex items-center gap-1.5 rounded-full px-3 py-1 font-semibold",
                backgroundOk ? "bg-success-subtle" : "bg-warning-subtle",
              )}
            >
              {backgroundOk ? <CheckIcon className="size-4 text-success" /> : <AlertIcon className="size-4 text-warning" />}
              {metrics.backgroundCorrected ? "Background corrected" : backgroundOk ? "Background passed" : "Check the background"}
            </li>
            <li className="inline-flex items-center gap-1.5 rounded-full bg-muted px-3 py-1 font-semibold">
              <CropIcon className="size-4 text-primary" />
              Sized for {countryName}
            </li>
          </>
        }
        caption={result.previewUrl ? "Guides are for review only. Your download is the clean photo." : `${result.format} · ${result.sizeKb} KB`}
        panel={
          paid ? (
            <PurchasedTile resultId={result._id} payment={paid} />
          ) : (
            <CheckoutPanel
              id={result._id}
              initialCurrency={currency}
              geoDetected={!!geoCountry}
              description={`${countryName} passport photo (${result.dimensions} px)`}
            />
          )
        }
      >
        <BackgroundNotice metrics={metrics} />

        <section aria-labelledby="specs-heading" className="flex flex-col gap-3">
          <div className="flex flex-wrap items-baseline justify-between gap-x-4 gap-y-1">
            <h2 id="specs-heading" className="font-display text-xl font-semibold tracking-tight sm:text-2xl">
              Measured automatically
            </h2>
            <p className="text-sm text-muted-foreground">
              Preview available until <FormattedDate iso={result.expiresAt.toISOString()} />
            </p>
          </div>
          <dl className="grid grid-cols-3 border-t border-border">
            <Spec label="Photo size" value={`${width} × ${height}`} unit="px" />
            <Spec
              label="Background"
              value={metrics.backgroundCorrected ? "Replaced" : backgroundOk ? "Passed" : "Review"}
              tone={backgroundOk ? "success" : "warning"}
            />
            <Spec label="File" value={result.format} unit={`${result.sizeKb} KB`} />
            <Spec label="Head height" value={formatPct(metrics.headHeightPct)} unit="of photo" />
            <Spec label="Eye line" value={formatPct(metrics.eyePositionPct)} unit="from bottom" />
            <Spec label="Space above head" value={formatPct(metrics.topMarginPct)} unit="of photo" />
          </dl>
          <p className="text-xs text-muted-foreground">
            These are measured automatically. They help you spot a bad crop, but they aren&apos;t an official check, and
            the agency that receives your application decides whether to accept the photo.
          </p>
        </section>

        {!paid && <NextSteps />}

        <section
          aria-labelledby="help-heading"
          className="flex flex-col gap-3 border-t border-border pt-5 sm:flex-row sm:items-center sm:justify-between"
        >
          <div className="flex items-start gap-3">
            <MailIcon className="mt-1 size-5 text-muted-foreground" />
            <div>
              <h2 id="help-heading" className="font-semibold">
                Questions about your photo?
              </h2>
              <p className="text-sm text-muted-foreground">Sizing, printing or requirements. We reply by email.</p>
            </div>
          </div>
          <Link href="/contact" className="group inline-flex items-center gap-1 font-semibold text-primary hover:underline sm:shrink-0">
            Contact us
            <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
          </Link>
        </section>
      </PhotoResult>
    </article>
  );
}

const STEPS = ["Upload", "Review", "Download"] as const;

/** Where the visitor is in the flow: upload and review are behind them. */
function Stepper({ done }: { done: boolean }) {
  return (
    <ol aria-label="Progress" className="flex items-center gap-2 text-sm">
      {STEPS.map((step, i) => {
        const complete = i < 2 || done;
        const current = i === 2 && !done;
        return (
          <li key={step} className="flex items-center gap-2" aria-current={current ? "step" : undefined}>
            {i > 0 && <span aria-hidden="true" className={cn("h-px w-6 sm:w-10", complete ? "bg-primary" : "bg-border-strong")} />}
            <span
              className={cn(
                "flex size-6 items-center justify-center rounded-full text-xs font-semibold",
                current ? "bg-primary text-primary-foreground" : "bg-primary-subtle text-primary-subtle-foreground",
              )}
            >
              {complete ? <CheckIcon className="size-3.5" /> : i + 1}
            </span>
            <span className={cn("font-semibold", current ? "text-foreground" : "text-muted-foreground")}>
              {step}
              {complete && <span className="sr-only"> (done)</span>}
            </span>
          </li>
        );
      })}
    </ol>
  );
}

/** After checkout, in three steps, so paying feels predictable. */
function NextSteps() {
  const steps = [
    { title: "Pay securely", body: "One-time payment by card, UPI or wallet through Razorpay." },
    { title: "Download instantly", body: "The clean, full-resolution JPG, without the guides." },
    { title: "Check your inbox", body: "A copy of the photo and your invoice, for your records." },
  ];
  return (
    // Repeats the panel's assurances, so it only shows on wide screens, where it sits beside the sticky panel.
    <section aria-labelledby="next-heading" className="hidden flex-col gap-4 rounded-xl bg-surface p-6 lg:flex">
      <h2 id="next-heading" className="font-display text-xl font-semibold tracking-tight">
        What happens after you pay
      </h2>
      <ol className="grid grid-cols-3 gap-6">
        {steps.map((step, i) => (
          <li key={step.title} className="flex flex-col gap-2">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full bg-background font-display text-sm font-semibold text-primary">
              {i + 1}
            </span>
            <div>
              <p className="font-semibold">{step.title}</p>
              <p className="text-sm text-muted-foreground">{step.body}</p>
            </div>
          </li>
        ))}
      </ol>
    </section>
  );
}

/** One cell of the spec sheet: a large value over a quiet label, split by hairlines. */
function Spec({
  label,
  value,
  unit,
  tone,
}: {
  label: string;
  value: string;
  unit?: string;
  /** Pass/fail rows get an icon; plain measurements don't (the API reports a value, not a verdict). */
  tone?: "success" | "warning";
}) {
  return (
    <div className="flex flex-col gap-0.5 border-b border-border py-3 pr-2 sm:gap-1 sm:py-4 sm:pr-4">
      <dt className="text-xs text-muted-foreground sm:text-sm">{label}</dt>
      <dd className="flex flex-wrap items-baseline gap-x-1.5">
        {tone &&
          (tone === "success" ? (
            <CheckIcon className="size-4 self-center text-success sm:size-5" />
          ) : (
            <AlertIcon className="size-4 self-center text-warning sm:size-5" />
          ))}
        <span className="font-display text-lg font-semibold tracking-tight lg:text-2xl">{value}</span>
        {unit && <span className="text-xs text-muted-foreground sm:text-sm">{unit}</span>}
      </dd>
    </div>
  );
}

/** The order panel once this photo has been bought: an inverse tile, so it reads as done. */
function PurchasedTile({ resultId, payment }: { resultId: string; payment: PaymentDoc }) {
  return (
    <div className="flex flex-col gap-4 rounded-xl bg-contrast p-5 text-contrast-foreground sm:gap-5 sm:p-6">
      <span className="inline-flex w-fit items-center gap-1.5 rounded-full bg-contrast-raised px-3 py-1 text-sm font-semibold">
        <CheckIcon className="size-4" />
        Purchased
      </span>
      <div>
        <h2 id="panel-heading" className="font-display text-2xl font-semibold tracking-tight">
          This photo is yours.
        </h2>
        <p className="mt-2 text-contrast-muted-foreground">
          Download it any time from your order page. We also emailed it, with your invoice, to the address you paid
          with.
        </p>
      </div>
      <Link
        href={`/preview/${resultId}/thank-you?paymentId=${payment.paymentId}`}
        className={buttonVariants({ variant: "download", size: "lg", className: "h-12 w-full transition-transform active:scale-[0.98]" })}
      >
        <DownloadIcon />
        Go to your download
      </Link>
      <Link
        href="/tool/passport-photo-editor"
        className="group inline-flex w-fit items-center gap-1 self-center text-sm font-semibold hover:underline"
      >
        Make another photo
        <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
      </Link>
    </div>
  );
}

/** Only the failing case needs more than the chip: what to do about it. */
function BackgroundNotice({ metrics }: { metrics: PhotoResultDoc["metrics"] }) {
  if (metrics.backgroundCorrected || metrics.backgroundValid) return null;
  return (
    <Alert tone="warning">
      <p className="font-semibold">The background may not meet the requirements</p>
      <p className="mt-1">
        Retake the photo against a plain, evenly lit, light-colored wall with no shadows or objects.
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
    <div
      role="status"
      className="grid gap-5 md:grid-cols-[minmax(0,1fr)_minmax(0,22rem)] md:gap-x-8 md:gap-y-6 lg:grid-cols-[minmax(0,1fr)_minmax(0,24rem)] lg:gap-x-10"
    >
      <div className="flex flex-col gap-2 md:col-start-1">
        <div className="h-5 w-48 animate-pulse rounded-full bg-muted" />
        <h1 className="font-display text-3xl font-semibold tracking-tight sm:text-4xl">Your photo is ready.</h1>
        <div className="hidden h-6 w-full max-w-xl animate-pulse rounded-full bg-muted sm:block" />
      </div>
      <div className="flex h-[calc(min(32svh,15rem)+2.5rem)] animate-pulse items-center justify-center rounded-xl bg-surface text-sm text-muted-foreground sm:h-[calc(min(44svh,22rem)+4rem)] md:col-start-1 lg:h-[calc(min(44svh,23rem)+4rem)]">
        Loading your photo…
      </div>
      <div className="flex flex-col gap-3 rounded-xl border border-border p-6 md:col-start-2 md:row-span-2 md:row-start-1 md:self-start">
        <div className="h-8 w-48 animate-pulse rounded-full bg-muted" />
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
        <div className="h-24 animate-pulse rounded-lg bg-muted" />
        <div className="h-12 animate-pulse rounded-lg bg-muted" />
      </div>
    </div>
  );
}

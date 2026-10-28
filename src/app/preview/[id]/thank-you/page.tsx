import Link from "next/link";
import { notFound } from "next/navigation";
import { connection } from "next/server";
import { Suspense } from "react";

import { ArrowRightIcon, PrinterIcon } from "@/components/home/icons";
import { Container } from "@/components/ui/container";
import { getPaymentById } from "@/lib/payments/payment-service";
import { flagEmoji, getCountry } from "@/lib/photo/countries";
import { buildMetadata } from "@/lib/seo/metadata";
import { paymentIdSchema } from "@/lib/validation/forms";

import { PaymentStatus } from "./payment-status";

// Order pages are private links: never indexed, and their links aren't followed.
export const metadata = buildMetadata({
  title: "Thank you",
  description: "Download the passport photo you bought from idphoto.us, and view your invoice.",
  path: null,
  indexable: false,
  follow: false,
  noarchive: true,
  maxImagePreview: "none",
});

export default function ThankYouPage({ params, searchParams }: PageProps<"/preview/[id]/thank-you">) {
  return (
    <Container className="pt-page pb-12">
      <Suspense fallback={<div role="status" className="h-[32rem] animate-pulse rounded-md bg-muted" />}>
        <ThankYou params={params} searchParams={searchParams} />
      </Suspense>
    </Container>
  );
}

async function ThankYou({ params, searchParams }: PageProps<"/preview/[id]/thank-you">) {
  const [{ id }, { paymentId }] = await Promise.all([params, searchParams]);
  // The MongoDB driver reads the clock, so opt out of prerendering before querying
  await connection();
  const payment = typeof paymentId === "string" && paymentIdSchema.safeParse(paymentId).success ? await getPaymentById(paymentId) : null;
  if (!payment || payment.image.resultId !== id) notFound();

  const country = getCountry(payment.metadata.countryCode ?? "");
  const countryName = payment.metadata.countryName ?? "";
  const [width, height] = (payment.image.dimensions ?? "600x600").split("x").map(Number);

  return (
    <div className="grid gap-4 lg:grid-cols-[minmax(0,1fr)_minmax(0,1.1fr)] lg:gap-8">
      <section aria-label="Your photo" className="overflow-hidden rounded-md border border-border bg-surface-raised lg:row-span-2">
        <p className="border-b border-border px-4 py-2.5 font-display text-base font-semibold tracking-tight">
          {country && <span aria-hidden="true">{flagEmoji(country.code)} </span>}
          {countryName} passport photo
        </p>
        <div className="flex justify-center bg-surface p-5 sm:p-8">
          {payment.image.previewUrl && (
            // eslint-disable-next-line @next/next/no-img-element -- private image; next/image would copy it into our cache.
            <img
              src={payment.image.previewUrl}
              alt={`Your ${countryName} passport photo, with measurement guides`}
              width={width}
              height={height}
              className="h-auto max-h-[27.5rem] w-auto max-w-full rounded-sm border border-border bg-photo-backdrop"
            />
          )}
        </div>
      </section>

      <div className="flex flex-col gap-4">
        <PaymentStatus paymentId={payment.paymentId} email={payment.email} />

        <div className="flex gap-3 rounded-md border border-border bg-surface-raised p-4">
          <span className="flex size-9 shrink-0 items-center justify-center rounded-lg bg-primary-subtle text-primary-subtle-foreground">
            <PrinterIcon className="size-4" />
          </span>
          <p className="text-sm text-muted-foreground">
            <span className="font-semibold text-foreground">Printing?</span> Print on 4×6 in photo paper at any pharmacy or
            photo lab, then cut along the edges.
          </p>
        </div>

        <Link href="/tool/passport-photo-editor" className="group inline-flex w-fit items-center gap-1.5 text-sm font-semibold text-primary hover:underline">
          Create another photo
          <ArrowRightIcon className="size-4 transition-transform group-hover:translate-x-0.5" />
        </Link>
      </div>
    </div>
  );
}

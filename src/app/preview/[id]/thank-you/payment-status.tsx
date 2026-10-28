"use client";

import { useEffect, useState } from "react";

import { CheckIcon, DownloadIcon, MailIcon } from "@/components/home/icons";
import { buttonVariants } from "@/components/ui/button";
import { Alert } from "@/components/ui/field";
import type { PaymentStatusResult } from "@/lib/api/types";
import { apiGet } from "@/lib/http/client";
import { formatMoney } from "@/lib/payments/currency";

const POLL_MS = 2500;
const MAX_POLLS = 24; // ~1 minute; the webhook keeps working after that

export function PaymentStatus({ paymentId, email }: { paymentId: string; email: string }) {
  const [data, setData] = useState<PaymentStatusResult | null>(null);

  // Poll until fulfillment settles (verify usually finishes it before we get here)
  useEffect(() => {
    let polls = 0;
    let timer: ReturnType<typeof setTimeout>;
    let cancelled = false;

    async function load() {
      try {
        const json = await apiGet<PaymentStatusResult>(`/payments/status/${paymentId}`);
        if (cancelled) return;
        setData(json);
        // "failed" fulfillment is retried by the status endpoint, so keep polling until it completes
        if (json.fulfillmentStatus !== "completed" && ++polls < MAX_POLLS) timer = setTimeout(load, POLL_MS);
      } catch {
        if (!cancelled && ++polls < MAX_POLLS) timer = setTimeout(load, POLL_MS);
      }
    }
    load();
    return () => {
      cancelled = true;
      clearTimeout(timer);
    };
  }, [paymentId]);

  const paid = data?.status === "paid";
  const emailSent = data?.emailStatus === "sent";
  // Failed for good only once fulfillment has given up retrying
  const emailFailed = data?.emailStatus === "failed" && data.fulfillmentStatus === "completed";

  return (
    <>
      <div className="flex flex-col gap-2.5">
        <span role="status" className="inline-flex w-fit items-center gap-1.5 rounded-full border border-success/40 bg-success-subtle px-3 py-1 text-xs font-semibold sm:text-sm">
          <CheckIcon className="size-4 text-success" />
          {paid ? `Payment received · ${formatMoney(data.amount, data.currency, { trimWholeNumbers: true })}` : "Confirming payment…"}
        </span>
        <h1 className="font-display text-2xl font-bold tracking-tight text-balance sm:text-4xl">
          Thank you! Your <span className="text-primary">photo</span> is ready
        </h1>
        <p className="text-muted-foreground">Download it now. We&apos;re also emailing the photo and your invoice to {email}.</p>
        {data?.planType === "expert_edit" && paid && (
          <p className="rounded-md border border-primary/30 bg-primary-subtle p-3 text-sm">
            <span className="font-semibold">Expert edit included.</span> A photo specialist is reviewing and retouching your
            photo by hand. We&apos;ll email you the final version.
          </p>
        )}
      </div>

      <div className="rounded-md border border-border bg-surface-raised p-4 sm:p-5">
        {data?.downloadToken ? (
          <a
            href={`/api/download/${data.downloadToken}`}
            className={buttonVariants({ variant: "download", size: "lg", className: "h-11 w-full font-semibold shadow-none!" })}
          >
            <DownloadIcon />
            Download photo
          </a>
        ) : (
          <div className="flex h-11 items-center justify-center gap-2 rounded-lg bg-muted text-sm font-medium text-muted-foreground">
            <span className="size-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
            Preparing your download…
          </div>
        )}

        <dl className="mt-4 divide-y divide-border text-sm">
          <div className="flex items-center justify-between gap-4 py-2.5">
            <dt className="flex items-center gap-2.5 text-muted-foreground">
              <MailIcon className="size-4" />
              Email
            </dt>
            <dd className={emailFailed ? "text-danger" : undefined}>
              {emailSent ? "Sent" : emailFailed ? "Couldn't send — please download above" : "Sending…"}
            </dd>
          </div>
          {data?.invoiceNumber && (
            <div className="flex items-center justify-between gap-4 py-2.5">
              <dt className="text-muted-foreground">Invoice</dt>
              <dd className="flex gap-3">
                <a href={`/api/invoices/${paymentId}`} target="_blank" rel="noopener" className="font-medium text-primary hover:underline">
                  {data.invoiceNumber}
                </a>
                <a href={`/api/invoices/${paymentId}?format=pdf`} className="text-muted-foreground hover:underline">
                  PDF
                </a>
              </dd>
            </div>
          )}
        </dl>

        {data?.status === "failed" && (
          <Alert tone="danger" className="mt-3">
            This payment didn&apos;t go through. Please go back and try again.
          </Alert>
        )}
      </div>
    </>
  );
}

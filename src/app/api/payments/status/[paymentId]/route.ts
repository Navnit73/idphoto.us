import { after } from "next/server";

import { ApiError, ok, queryHandler } from "@/lib/api/server";
import type { PaymentStatusResult } from "@/lib/api/types";
import { logger } from "@/lib/logger";
import { ensureDownloadToken, fulfillPayment } from "@/lib/payments/fulfillment-service";
import { getPaymentById } from "@/lib/payments/payment-service";
import { paymentIdSchema } from "@/lib/validation/forms";

export const maxDuration = 60;

/**
 * Payment status — polled by the thank-you page after checkout.
 * Also retries fulfillment for a paid order that hasn't completed (e.g. the email failed).
 */
export const GET = queryHandler<{ paymentId: string }>("payments-status", async (_request, { params }) => {
  const { paymentId } = await params;
  const payment = paymentIdSchema.safeParse(paymentId).success ? await getPaymentById(paymentId) : null;
  if (!payment) throw new ApiError("not_found", "Payment not found.");

  const isPaid = payment.status === "paid";
  // fulfillPayment holds its own lock, so overlapping polls can't run it twice
  if (isPaid && (payment.fulfillmentStatus === "pending" || payment.fulfillmentStatus === "failed")) {
    after(() => fulfillPayment(paymentId).catch((error) => logger.error("fulfillment retry failed", { paymentId, error })));
  }

  // The document we just read usually carries a valid token; only touch the database again when it doesn't.
  const tokenValid = payment.downloadToken && (!payment.downloadTokenExpiresAt || payment.downloadTokenExpiresAt > new Date());
  const downloadToken = !isPaid ? undefined : tokenValid ? payment.downloadToken : await ensureDownloadToken(paymentId);

  return ok<PaymentStatusResult>({
    paymentId: payment.paymentId,
    status: payment.status,
    amount: payment.amount,
    currency: payment.currency,
    planType: payment.planType ?? "standard",
    fulfillmentStatus: payment.fulfillmentStatus,
    emailStatus: payment.emailDelivery.status,
    downloadToken,
    invoiceNumber: payment.invoice?.invoiceNumber,
    paidAt: payment.paidAt?.toISOString(),
  });
});

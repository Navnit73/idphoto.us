import { ApiError, jsonHandler, ok } from "@/lib/api/server";
import type { VerifyPaymentResult } from "@/lib/api/types";
import { logActivity } from "@/lib/payments/activity-log";
import { fulfillPayment } from "@/lib/payments/fulfillment-service";
import { getPaymentByOrderId, markPaymentPaid } from "@/lib/payments/payment-service";
import { verifyPaymentSignature } from "@/lib/payments/razorpay";
import { verifyPaymentSchema } from "@/lib/validation/forms";

/** Fulfillment (invoice PDF, email with attachments) can take several seconds. */
export const maxDuration = 60;

/** Verifies the Razorpay checkout signature, marks the payment as paid and triggers fulfillment. */
export const POST = jsonHandler({ name: "payments-verify", schema: verifyPaymentSchema, maxBytes: 2_048 }, async (input, { log }) => {
  const { paymentId, razorpayOrderId, razorpayPaymentId, razorpaySignature } = input;

  if (!verifyPaymentSignature({ razorpayOrderId, razorpayPaymentId, razorpaySignature })) {
    await logActivity({
      event: "payment_failed",
      status: "invalid_signature",
      paymentId,
      metadata: { razorpayOrderId },
    });
    throw new ApiError("bad_request", "Payment verification failed.");
  }

  // The order must belong to the payment the client claims before we touch it
  const existing = await getPaymentByOrderId(razorpayOrderId);
  if (!existing || existing.paymentId !== paymentId) throw new ApiError("not_found", "Payment record not found.");

  // Mark as paid (idempotent)
  const { transitioned, payment } = await markPaymentPaid({ razorpayOrderId, razorpayPaymentId });
  if (payment?.status !== "paid") throw new ApiError("conflict", "This payment is no longer active. Please contact support.");

  await logActivity({
    event: "payment_success",
    status: transitioned ? "newly_paid" : "already_paid",
    paymentId,
    email: payment.email,
    metadata: { razorpayOrderId, razorpayPaymentId },
  });

  // Fulfillment (invoice, download token, email). Its failure must not fail a paid checkout:
  // the webhook retries it and the thank-you page polls status.
  let downloadToken: string | undefined;
  let invoiceNumber = payment.invoice?.invoiceNumber;
  try {
    const fulfillment = await fulfillPayment(paymentId);
    downloadToken = fulfillment.downloadToken;
    invoiceNumber = fulfillment.invoiceNumber || invoiceNumber;
  } catch (error) {
    log.error("fulfillment failed", { paymentId, error });
  }

  return ok<VerifyPaymentResult>({ paymentId, status: "paid", downloadToken, invoiceNumber });
});

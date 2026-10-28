import { after } from "next/server";

import { ApiError, jsonHandler, ok, rateLimit } from "@/lib/api/server";
import type { CreateOrderResult } from "@/lib/api/types";
import { logActivity } from "@/lib/payments/activity-log";
import { resolveCurrencyFromHeaders } from "@/lib/payments/currency";
import { createPaymentOrder, PaymentError } from "@/lib/payments/payment-service";
import { getPlanPricing } from "@/lib/payments/pricing";
import { isPaymentsConfigured } from "@/lib/payments/razorpay";
import { createOrderSchema } from "@/lib/validation/forms";

/** Creates a Razorpay order and a pending payment record. */
export const POST = jsonHandler({ name: "payments-create-order", schema: createOrderSchema, maxBytes: 2_048 }, async (input, { request, ipHash }) => {
  if (!isPaymentsConfigured()) {
    throw new ApiError("service_unavailable", "Payments are temporarily unavailable. Please try again later.");
  }
  await rateLimit("payments-create-order", ipHash, { limit: 30, windowSeconds: 3600 });

  const { email, resultId, planType } = input;

  // Currency is resolved server-side: country header, else the browser's timezone (no header only)
  const { country: geoCountry, currency } = resolveCurrencyFromHeaders(request.headers, input.timeZone);

  // Never charge a different price than the customer was shown
  const expectedCurrency = input.expectedCurrency?.toUpperCase();
  const chargedAmount = getPlanPricing(planType, currency).amountInSubunits;
  if ((expectedCurrency && expectedCurrency !== currency) || (input.expectedAmount !== undefined && input.expectedAmount !== chargedAmount)) {
    throw new ApiError(
      "conflict",
      "Prices have been updated for your region. Please review the new price and try again.",
      undefined,
      undefined,
      { reason: "price_changed", currency },
    );
  }

  after(() => logActivity({ event: "checkout_initiated", status: "started", email, metadata: { resultId, planType, currency } }));

  try {
    const order = await createPaymentOrder({
      email,
      resultId,
      planType,
      currency,
      geoCountry,
      userAgent: request.headers.get("user-agent") ?? undefined,
      ipHash,
    });
    return ok<CreateOrderResult>(order);
  } catch (error) {
    if (error instanceof PaymentError) {
      throw error.status === 409
        ? new ApiError("conflict", error.message, undefined, undefined, {
            reason: "already_paid",
            ...(error.paidPaymentId ? { paidPaymentId: error.paidPaymentId } : {}),
          })
        : new ApiError("not_found", error.message);
    }
    throw error;
  }
});

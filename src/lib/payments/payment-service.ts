import "server-only";

/**
 * Payment Service — business logic for creating, verifying, and managing payments
 */

import crypto from "node:crypto";

import { collections, type PaymentDoc, type PaymentStatus } from "@/lib/db/collections";
import { getDb } from "@/lib/db/mongodb";
import { logger } from "@/lib/logger";
import { getCountry } from "@/lib/photo/countries";

import { logActivity } from "./activity-log";
import { BASE_CURRENCY, type CurrencyCode } from "./currency";
import { getPlanPricing, type PlanType } from "./pricing";
import { createRazorpayOrder, getRazorpayKeyId } from "./razorpay";

const log = logger.child({ module: "payment-service" });

export class PaymentError extends Error {
  constructor(
    message: string,
    public status: 404 | 409 = 404,
    /** Paid payment for this photo, when the error is that it was already bought */
    public paidPaymentId?: string,
  ) {
    super(message);
    this.name = "PaymentError";
  }
}

const paymentsCollection = async () => collections.payments(await getDb());

/**
 * Razorpay rejects unsupported currencies with a 400 BAD_REQUEST_ERROR naming the
 * currency field, e.g. { statusCode: 400, error: { field: "currency", description: "Currency is not supported" } }.
 */
function isRazorpayCurrencyError(err: unknown): boolean {
  const e = err as { statusCode?: number; error?: { field?: string; description?: string } } | null;
  if (!e || e.statusCode !== 400) return false;
  return e.error?.field === "currency" || /currency/i.test(e.error?.description || "");
}

/**
 * Create a new pending payment and Razorpay order for a processed photo.
 */
export async function createPaymentOrder(params: {
  email: string;
  resultId: string;
  planType: PlanType;
  /** Currency resolved server-side from the visitor's geo-IP country */
  currency: CurrencyCode;
  /** Visitor's geo-IP country (ISO alpha-2), for audit */
  geoCountry?: string | null;
  userAgent?: string;
  ipHash?: string;
}): Promise<{
  paymentId: string;
  razorpayOrderId: string;
  amount: number;
  currency: string;
  keyId: string;
}> {
  // Image details come from our own record, never from the client
  const photo = await collections.photoResults(await getDb()).findOne({ _id: params.resultId });
  if (!photo || photo.expiresAt <= new Date()) throw new PaymentError("This photo has expired. Please create a new one.", 404);

  // Never charge twice for the same photo
  const paid = await getPaidPaymentByResultId(params.resultId);
  if (paid) throw new PaymentError("This photo has already been purchased.", 409, paid.paymentId);

  const col = await paymentsCollection();
  const plan = params.planType;
  let pricing = getPlanPricing(plan, params.currency);

  // Reuse a recent pending order for the same photo, email, plan & price
  const existing = await col.findOne({
    "image.resultId": params.resultId,
    email: params.email,
    planType: plan,
    currency: pricing.currency,
    amount: pricing.amountInSubunits,
    status: "pending",
    createdAt: { $gte: new Date(Date.now() - 30 * 60 * 1000) }, // within 30 min
  });

  if (existing) {
    return {
      paymentId: existing.paymentId,
      razorpayOrderId: existing.razorpayOrderId,
      amount: existing.amount,
      currency: existing.currency,
      keyId: getRazorpayKeyId(),
    };
  }

  const paymentId = crypto.randomUUID();
  const countryName = getCountry(photo.countryCode)?.name ?? photo.countryCode;

  // Amount comes from server config, NOT from client
  const orderNotes = {
    paymentId,
    email: params.email,
    resultId: params.resultId,
    planType: plan,
    productType: pricing.productType,
    country: countryName,
    geoCountry: params.geoCountry || "unknown",
  };

  let rzOrder: Awaited<ReturnType<typeof createRazorpayOrder>>;
  try {
    rzOrder = await createRazorpayOrder({
      amount: pricing.amountInSubunits,
      currency: pricing.currency,
      receipt: paymentId,
      notes: orderNotes,
    });
  } catch (err) {
    // Currency not enabled on the Razorpay account — fall back to the base currency.
    // Any other failure (network, auth) is rethrown so we never silently switch currency.
    if (pricing.currency === BASE_CURRENCY || !isRazorpayCurrencyError(err)) throw err;
    log.warn("razorpay order currency rejected; falling back", { currency: pricing.currency, fallback: BASE_CURRENCY });
    pricing = getPlanPricing(plan, BASE_CURRENCY);
    rzOrder = await createRazorpayOrder({
      amount: pricing.amountInSubunits,
      currency: pricing.currency,
      receipt: paymentId,
      notes: orderNotes,
    });
  }

  const now = new Date();
  const payment: PaymentDoc = {
    paymentId,
    email: params.email,
    razorpayOrderId: rzOrder.id,
    amount: pricing.amountInSubunits,
    currency: pricing.currency,
    status: "pending",
    fulfillmentStatus: "pending",
    productType: pricing.productType,
    planType: plan,
    expertReviewStatus: plan === "expert_edit" ? "pending" : undefined,
    image: {
      resultId: params.resultId,
      imageUrl: photo.imageUrl,
      previewUrl: photo.previewUrl ?? undefined,
      format: photo.format,
      dimensions: photo.dimensions,
      sizeKb: photo.sizeKb,
    },
    invoice: {},
    emailDelivery: { status: "pending", attempts: 0 },
    metadata: {
      userAgent: params.userAgent,
      ipHash: params.ipHash,
      countryCode: photo.countryCode,
      countryName,
      geoCountry: params.geoCountry || undefined,
    },
    createdAt: now,
    updatedAt: now,
  };

  await col.insertOne(payment);

  await logActivity({
    event: "razorpay_order_created",
    status: "success",
    paymentId,
    email: params.email,
    metadata: {
      razorpayOrderId: rzOrder.id,
      resultId: params.resultId,
      planType: plan,
      amount: pricing.amountInSubunits,
      currency: pricing.currency,
    },
  });

  return {
    paymentId,
    razorpayOrderId: rzOrder.id,
    amount: pricing.amountInSubunits,
    currency: pricing.currency,
    keyId: getRazorpayKeyId(),
  };
}

/**
 * Mark a payment as paid (idempotent).
 * Returns transitioned: true only if this call actually changed the status.
 */
export async function markPaymentPaid(params: {
  razorpayOrderId: string;
  razorpayPaymentId: string;
}): Promise<{ transitioned: boolean; payment: PaymentDoc | null }> {
  const col = await paymentsCollection();

  // "failed" is included: Razorpay checkout lets the customer retry on the same order,
  // so a capture can follow an earlier failed attempt
  const result = await col.findOneAndUpdate(
    {
      razorpayOrderId: params.razorpayOrderId,
      status: { $in: ["pending", "authorized", "failed"] as PaymentStatus[] },
    },
    {
      $set: {
        razorpayPaymentId: params.razorpayPaymentId,
        status: "paid" as PaymentStatus,
        paidAt: new Date(),
        updatedAt: new Date(),
      },
    },
    { returnDocument: "after" },
  );

  if (result) return { transitioned: true, payment: result };

  // Maybe already paid — fetch to check
  return { transitioned: false, payment: await col.findOne({ razorpayOrderId: params.razorpayOrderId }) };
}

/**
 * Mark payment as failed.
 */
export async function markPaymentFailed(params: {
  razorpayOrderId: string;
  razorpayPaymentId?: string;
  reason?: string;
}): Promise<void> {
  const col = await paymentsCollection();
  await col.updateOne(
    {
      razorpayOrderId: params.razorpayOrderId,
      status: { $in: ["pending", "authorized"] as PaymentStatus[] },
    },
    {
      $set: {
        razorpayPaymentId: params.razorpayPaymentId,
        status: "failed" as PaymentStatus,
        "metadata.failureReason": params.reason,
        updatedAt: new Date(),
      },
    },
  );
}

/**
 * Find a payment by internal paymentId.
 */
export async function getPaymentById(paymentId: string): Promise<PaymentDoc | null> {
  return (await paymentsCollection()).findOne({ paymentId });
}

/**
 * Find a payment by Razorpay order ID.
 */
export async function getPaymentByOrderId(razorpayOrderId: string): Promise<PaymentDoc | null> {
  return (await paymentsCollection()).findOne({ razorpayOrderId });
}

/**
 * Find a paid payment for a photo.
 */
export async function getPaidPaymentByResultId(resultId: string): Promise<PaymentDoc | null> {
  return (await paymentsCollection()).findOne({ "image.resultId": resultId, status: "paid" });
}

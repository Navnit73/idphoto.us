import "server-only";

import type { Db, ObjectId } from "mongodb";

import type { PlanType } from "@/lib/payments/currency";

export type ContactMessageDoc = {
  _id?: ObjectId;
  name: string;
  email: string;
  topic: string;
  message: string;
  pagePath: string | null;
  ipHash: string;
  status: "new" | "read" | "archived";
  createdAt: Date;
};

export type FeedbackDoc = {
  _id?: ObjectId;
  path: string;
  helpful: boolean;
  comment: string | null;
  ipHash: string;
  createdAt: Date;
};

/**
 * A processed photo, so /preview/<id> can show it later. Holds only the
 * PixPassport result (image URLs and metrics), never the uploaded image.
 * Removed by a TTL index at `expiresAt`.
 */
export type PhotoResultDoc = {
  _id: string;
  countryCode: string;
  documentType: string;
  imageUrl: string;
  previewUrl: string | null;
  dimensions: string;
  format: string;
  sizeKb: number;
  metrics: {
    headHeightPct: number;
    eyePositionPct: number;
    topMarginPct: number;
    backgroundValid: boolean;
    backgroundCorrected: boolean;
  };
  ipHash: string;
  createdAt: Date;
  expiresAt: Date;
};

export type RateLimitDoc = {
  _id: string;
  count: number;
  expiresAt: Date;
};

export type PaymentStatus = "pending" | "authorized" | "paid" | "failed" | "refunded" | "cancelled";

export type FulfillmentStatus = "pending" | "processing" | "completed" | "failed";

/** One checkout for one processed photo. Amounts come from server pricing, never the client. */
export type PaymentDoc = {
  _id?: ObjectId;
  /** Internal UUID for the payment */
  paymentId: string;
  email: string;

  /** Razorpay references */
  razorpayOrderId: string;
  razorpayPaymentId?: string;

  /** Amount in smallest currency unit (cents) */
  amount: number;
  currency: string;

  status: PaymentStatus;
  fulfillmentStatus: FulfillmentStatus;

  productType: string;
  planType: PlanType;
  /** Expert edit orders: progress of the manual retouch */
  expertReviewStatus?: "pending" | "in_review" | "completed";
  /** Set once the team has been alerted about an expert edit order */
  expertNotifiedAt?: Date;

  image: {
    /** PixPassport result_id, also the photo_results _id */
    resultId: string;
    /** Full-resolution photo; never sent to the browser before payment */
    imageUrl: string;
    previewUrl?: string;
    format?: string;
    dimensions?: string;
    sizeKb?: number;
  };

  invoice: {
    invoiceNumber?: string;
    invoicePdfUrl?: string;
    cloudinaryPublicId?: string;
    generatedAt?: Date;
  };

  emailDelivery: {
    status: "pending" | "sending" | "sent" | "failed";
    messageId?: string;
    attempts: number;
    lastError?: string;
    sentAt?: Date;
  };

  downloadToken?: string;
  downloadTokenExpiresAt?: Date;

  metadata: {
    userAgent?: string;
    ipHash?: string;
    countryCode?: string;
    countryName?: string;
    /** Visitor's geo-IP country used to pick the charged currency */
    geoCountry?: string;
    failureReason?: string;
  };

  createdAt: Date;
  updatedAt: Date;
  paidAt?: Date;
};

/** Prevents duplicate processing of Razorpay webhooks. */
export type WebhookEventDoc = {
  _id?: ObjectId;
  /** Razorpay event ID (x-razorpay-event-id header) */
  eventId: string;
  eventType: string;
  razorpayPaymentId?: string;
  razorpayOrderId?: string;
  status: "processing" | "processed" | "failed";
  metadata?: Record<string, unknown>;
  processedAt?: Date;
  createdAt: Date;
};

/** Payment events for support and debugging. Removed by a TTL index after 90 days. */
export type ActivityLogDoc = {
  _id?: ObjectId;
  paymentId?: string;
  email?: string;
  event: string;
  status: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
};

/** Atomic sequences, e.g. `invoice-2026` for invoice numbers. */
export type CounterDoc = { _id: string; seq: number };

export const collections = {
  contactMessages: (db: Db) => db.collection<ContactMessageDoc>("contact_messages"),
  feedback: (db: Db) => db.collection<FeedbackDoc>("feedback"),
  photoResults: (db: Db) => db.collection<PhotoResultDoc>("photo_results"),
  rateLimits: (db: Db) => db.collection<RateLimitDoc>("rate_limits"),
  payments: (db: Db) => db.collection<PaymentDoc>("payments"),
  webhookEvents: (db: Db) => db.collection<WebhookEventDoc>("webhook_events"),
  activityLogs: (db: Db) => db.collection<ActivityLogDoc>("user_activity_logs"),
  counters: (db: Db) => db.collection<CounterDoc>("counters"),
};

/** Idempotent; runs once per process when the connection is first opened. */
export async function ensureIndexes(db: Db) {
  await Promise.all([
    collections.contactMessages(db).createIndex({ createdAt: -1 }),
    collections.contactMessages(db).createIndex({ status: 1, createdAt: -1 }),
    collections.feedback(db).createIndex({ path: 1, createdAt: -1 }),
    // MongoDB deletes expired photo results and rate-limit windows automatically.
    collections.photoResults(db).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    collections.rateLimits(db).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    collections.payments(db).createIndexes([
      { key: { paymentId: 1 }, unique: true },
      { key: { razorpayOrderId: 1 }, unique: true },
      { key: { email: 1 } },
      { key: { status: 1 } },
      { key: { createdAt: -1 } },
      { key: { "image.resultId": 1 } },
      { key: { downloadToken: 1 }, sparse: true },
    ]),
    // Unique eventId dedupes retried webhooks.
    collections.webhookEvents(db).createIndexes([
      { key: { eventId: 1 }, unique: true },
      { key: { razorpayOrderId: 1 }, sparse: true },
      { key: { createdAt: -1 } },
    ]),
    collections.activityLogs(db).createIndexes([
      { key: { paymentId: 1 }, sparse: true },
      { key: { email: 1 }, sparse: true },
      { key: { event: 1 } },
      { key: { createdAt: 1 }, expireAfterSeconds: 90 * 86400 },
    ]),
  ]);
}

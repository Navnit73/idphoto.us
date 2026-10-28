import "server-only";

/**
 * Activity Logger — centralised payment event tracking
 * All user/system events go through here to avoid scattered DB calls.
 */

import { collections } from "@/lib/db/collections";
import { getDb } from "@/lib/db/mongodb";
import { logger } from "@/lib/logger";

export type ActivityEvent =
  | "checkout_initiated"
  | "razorpay_order_created"
  | "payment_success"
  | "payment_failed"
  | "payment_webhook_received"
  | "invoice_generated"
  | "email_sent"
  | "email_failed"
  | "image_downloaded"
  | "download_link_expired";

export async function logActivity(params: {
  event: ActivityEvent;
  status: string;
  paymentId?: string;
  email?: string;
  metadata?: Record<string, unknown>;
}): Promise<void> {
  try {
    await collections.activityLogs(await getDb()).insertOne({ ...params, createdAt: new Date() });
  } catch (error) {
    // Never let logging failures break the main flow
    logger.error("activity log failed", { event: params.event, error });
  }
}

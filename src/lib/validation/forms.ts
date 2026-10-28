import { z } from "zod";

import { COUNTRY_CODES, DOCUMENT_TYPES } from "@/lib/photo/countries";

/** Shared between the browser forms (instant feedback) and API routes (authoritative). */

export const CONTACT_TOPICS = ["general", "correction", "tool-problem", "privacy", "other"] as const;

export const contactSchema = z.object({
  name: z.string().trim().min(2, "Please enter your name").max(100),
  email: z.email("Please enter a valid email address").max(200),
  topic: z.enum(CONTACT_TOPICS),
  message: z.string().trim().min(20, "Please write at least 20 characters").max(5000),
  pagePath: z.string().regex(/^\/[\w\-/]*$/).max(200).optional(),
  /** Honeypot: hidden from people, often filled by bots. Non-empty submissions are silently dropped. */
  website: z.string().max(200).optional(),
});

export type ContactInput = z.infer<typeof contactSchema>;

export const feedbackSchema = z.object({
  path: z.string().regex(/^\/[\w\-/]*$/).max(200),
  helpful: z.boolean(),
  comment: z.string().trim().max(1000).optional(),
});

export type FeedbackInput = z.infer<typeof feedbackSchema>;

/** Text fields sent with the photo upload; the image itself is checked separately. */
export const photoProcessSchema = z.object({
  country_code: z.enum(COUNTRY_CODES, "Choose a country from the list"),
  document_type: z.enum(DOCUMENT_TYPES).default("passport"),
});

/** Country whose photo rules the photo checker loads. */
export const photoRequirementsSchema = photoProcessSchema;

/** Upload cap. The browser downsizes photos well below this before sending them. */
export const MAX_PHOTO_UPLOAD_BYTES = 8 * 1024 * 1024;
export const PHOTO_UPLOAD_TYPES = ["image/jpeg", "image/png", "image/webp"] as const;

export const photoResultIdSchema = z.uuid();

/** POST /api/payments/create-order. The amount is never taken from the client. */
export const createOrderSchema = z.object({
  resultId: photoResultIdSchema,
  email: z
    .string()
    .trim()
    .toLowerCase()
    .pipe(z.email("Please enter a valid email address.").max(254)),
  planType: z.enum(["standard", "expert_edit"], "Please choose a plan."),
  /** Browser timezone; only used to pick a currency when the request has no country header. */
  timeZone: z.string().max(64).optional(),
  /** What the page showed, so the server never charges a different price. */
  expectedCurrency: z.string().max(3).optional(),
  expectedAmount: z.number().int().nonnegative().optional(),
});

/** POST /api/payments/verify: the values Razorpay checkout hands back. */
export const verifyPaymentSchema = z.object({
  paymentId: z.uuid(),
  razorpayOrderId: z.string().min(1).max(64),
  razorpayPaymentId: z.string().min(1).max(64),
  razorpaySignature: z.string().regex(/^[a-f0-9]{64}$/i, "Invalid signature."),
});

export const paymentIdSchema = z.uuid();

/** Flattens Zod issues to `{ field: [messages] }` for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

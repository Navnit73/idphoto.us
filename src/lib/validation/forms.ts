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

export const photoEmailSchema = z.object({
  resultId: photoResultIdSchema,
  email: z.email("Please enter a valid email address").max(200),
  /** Honeypot, as in the contact form. */
  website: z.string().max(200).optional(),
});

export type PhotoEmailInput = z.infer<typeof photoEmailSchema>;

/** Flattens Zod issues to `{ field: [messages] }` for form display. */
export function fieldErrors(error: z.ZodError): Record<string, string[]> {
  return z.flattenError(error).fieldErrors as Record<string, string[]>;
}

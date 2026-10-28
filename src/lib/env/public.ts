import { z } from "zod";

/**
 * Public environment, safe for the browser. `NEXT_PUBLIC_*` values are inlined
 * at build time, so each must be referenced by its literal name below.
 */
const schema = z.object({
  NEXT_PUBLIC_SITE_URL: z
    .url()
    .default("https://idphoto.us")
    .transform((url) => url.replace(/\/+$/, "")),
  /** Razorpay key id; the browser needs it to open checkout. */
  NEXT_PUBLIC_RAZORPAY_KEY_ID: z.string().min(1).optional(),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  NEXT_PUBLIC_RAZORPAY_KEY_ID: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID || undefined,
});

if (!parsed.success) {
  throw new Error(`Invalid public environment variables:\n${z.prettifyError(parsed.error)}`);
}

export const publicEnv = parsed.data;

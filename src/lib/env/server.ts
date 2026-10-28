import "server-only";

import { z } from "zod";

const schema = z
  .object({
    NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
    LOG_LEVEL: z.enum(["debug", "info", "warn", "error"]).default("info"),
    /** Optional: without it, form endpoints respond 503 and the rest of the site works. */
    MONGODB_URI: z
      .string()
      .regex(/^mongodb(\+srv)?:\/\//, "must start with mongodb:// or mongodb+srv://")
      .optional(),
    MONGODB_DB: z.string().min(1).default("idphoto"),
    /** Salt for hashing client IPs before they are stored (rate limits, abuse checks). */
    IP_HASH_SALT: z.string().min(16).optional(),
    /** Optional Slack-compatible webhook notified on new contact messages. */
    CONTACT_WEBHOOK_URL: z.url().optional(),

    /** PixPassport photo processing. Without the key, the photo editor endpoint responds 503. */
    PASSPORT_API_URL: z.url().default("https://api.pixpassport.com"),
    PASSPORT_API_KEY: z.string().min(8).optional(),

    /** SMTP for all outgoing email (src/lib/mail). Without SMTP_HOST, email features respond 503. */
    SMTP_HOST: z.string().min(1).optional(),
    SMTP_PORT: z.coerce.number().int().min(1).max(65535).default(587),
    /** true = implicit TLS (port 465); false = STARTTLS (port 587). */
    SMTP_SECURE: z.stringbool().default(false),
    SMTP_USER: z.string().min(1).optional(),
    SMTP_PASS: z.string().min(1).optional(),
    /** Sender address, e.g. `idphoto.us <hello@idphoto.us>`. Defaults to SMTP_USER. */
    MAIL_FROM: z.string().min(3).optional(),
    /** Inbox for site notifications (new contact messages). */
    MAIL_TO: z.email().optional(),

    /** Razorpay checkout (src/lib/payments). Without the secret, create-order responds 503. */
    RAZORPAY_KEY_SECRET: z.string().min(8).optional(),
    /** Secret set on the Razorpay webhook (Dashboard → Settings → Webhooks). */
    RAZORPAY_WEBHOOK_SECRET: z.string().min(8).optional(),

    /** Cloudinary: keeps our own copy of each processed photo, and invoice PDFs. Optional. */
    CLOUDINARY_CLOUD_NAME: z.string().min(1).optional(),
    CLOUDINARY_API_KEY: z.string().min(1).optional(),
    CLOUDINARY_API_SECRET: z.string().min(1).optional(),
  })
  .superRefine((env, ctx) => {
    if (env.SMTP_HOST && !env.MAIL_FROM && !env.SMTP_USER) {
      ctx.addIssue({ code: "custom", path: ["MAIL_FROM"], message: "is required when SMTP_HOST is set without SMTP_USER" });
    }
    if (env.NODE_ENV === "production" && env.MONGODB_URI && !env.IP_HASH_SALT) {
      ctx.addIssue({
        code: "custom",
        path: ["IP_HASH_SALT"],
        message: "is required in production when MONGODB_URI is set",
      });
    }
  });

function emptyToUndefined(source: NodeJS.ProcessEnv) {
  return Object.fromEntries(Object.entries(source).map(([key, value]) => [key, value === "" ? undefined : value]));
}

const parsed = schema.safeParse(emptyToUndefined(process.env));

if (!parsed.success) {
  throw new Error(`Invalid server environment variables:\n${z.prettifyError(parsed.error)}`);
}

export const serverEnv = parsed.data;

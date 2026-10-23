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
  })
  .superRefine((env, ctx) => {
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

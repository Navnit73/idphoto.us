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
  /**
   * Only "production" allows search engines to index the site. Every other
   * value (or leaving it unset) emits `noindex` and a disallow-all robots.txt,
   * so previews and staging never leak into search results. On Vercel it
   * falls back to the deployment's own environment when left unset.
   */
  NEXT_PUBLIC_SITE_ENV: z.enum(["production", "preview", "development"]).default("development"),
});

const parsed = schema.safeParse({
  NEXT_PUBLIC_SITE_URL: process.env.NEXT_PUBLIC_SITE_URL || undefined,
  NEXT_PUBLIC_SITE_ENV: process.env.NEXT_PUBLIC_SITE_ENV || process.env.NEXT_PUBLIC_VERCEL_ENV || undefined,
});

if (!parsed.success) {
  throw new Error(`Invalid public environment variables:\n${z.prettifyError(parsed.error)}`);
}

export const publicEnv = parsed.data;

export const isIndexingAllowed = publicEnv.NEXT_PUBLIC_SITE_ENV === "production";

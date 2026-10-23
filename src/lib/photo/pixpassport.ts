import "server-only";

import { AxiosError } from "axios";
import { z } from "zod";

import { ApiError } from "@/lib/api/server";
import { serverEnv } from "@/lib/env/server";
import { serverHttp } from "@/lib/http/server";

import type { CountryCode, DocumentType } from "./countries";

/** Result images are served from Cloudinary; anything else is rejected rather than rendered. */
const resultUrl = z.url({ protocol: /^https$/, hostname: /^res\.cloudinary\.com$/ });

const processResponseSchema = z.object({
  result_id: z.uuid(),
  image_url: resultUrl,
  preview_url: resultUrl.nullish(),
  dimensions: z.string().regex(/^\d+x\d+$/),
  format: z.string().max(10).default("JPEG"),
  size_kb: z.number().nonnegative(),
  metrics: z.object({
    head_height_pct: z.number(),
    eye_position_pct: z.number(),
    top_margin_pct: z.number(),
    background_valid: z.boolean(),
    background_corrected: z.boolean().default(false),
  }),
});

export type ProcessedPhoto = z.infer<typeof processResponseSchema>;

/** The OpenAPI spec documents `{ error }`, but photo problems actually come back as FastAPI's `{ detail }`. */
const upstreamErrorSchema = z.union([
  z.object({ detail: z.string() }).transform((body) => body.detail),
  z.object({ error: z.string() }).transform((body) => body.error),
]);

/**
 * Sends a photo to PixPassport `POST /process` (face detection, background
 * check/correction, crop, resize). Typically takes several seconds.
 */
export async function processPhoto(input: { image: Blob; filename: string; countryCode: CountryCode; documentType: DocumentType }) {
  if (!serverEnv.PASSPORT_API_KEY) {
    throw new ApiError("service_unavailable", "Photo processing is temporarily unavailable. Please try again later.");
  }

  const form = new FormData();
  form.append("image", input.image, input.filename);
  form.append("country_code", input.countryCode);
  form.append("document_type", input.documentType);

  try {
    const { data } = await serverHttp.post(new URL("/process", serverEnv.PASSPORT_API_URL).toString(), form, {
      headers: { "X-API-Key": serverEnv.PASSPORT_API_KEY },
      timeout: 55_000,
    });
    const parsed = processResponseSchema.safeParse(data);
    if (!parsed.success) throw new Error(`Unexpected PixPassport response: ${z.prettifyError(parsed.error)}`);
    return parsed.data;
  } catch (error) {
    throw toApiError(error);
  }
}

function toApiError(error: unknown): unknown {
  if (!(error instanceof AxiosError)) return error;
  if (error.code === AxiosError.ECONNABORTED || error.code === AxiosError.ETIMEDOUT) {
    return new ApiError("network_error", "Processing took too long. Please try again, or try a smaller photo.");
  }
  const status = error.response?.status;
  // 400 is a problem with the photo itself (no face found, too dark, …). Its message is meant for people.
  if (status === 400) {
    const body = upstreamErrorSchema.safeParse(error.response?.data);
    const reason = body.success ? body.data.slice(0, 200) : undefined;
    return new ApiError(
      "bad_request",
      reason ? `We couldn't use this photo: ${reason}` : "We couldn't use this photo. Try a clearer, front-facing photo.",
    );
  }
  if (status === 413) return new ApiError("payload_too_large", "That photo is too large. Try a smaller one.");
  // Auth failures, 422s (a bug on our side), and 5xx: details go to the log via the serverHttp interceptor.
  return new ApiError("network_error", "The photo service isn't responding right now. Please try again in a few minutes.");
}

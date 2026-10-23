import "server-only";

import { createHash } from "node:crypto";

import type { z } from "zod";

import { siteConfig } from "@/config/site";
import { collections } from "@/lib/db/collections";
import { DatabaseNotConfiguredError, getDb } from "@/lib/db/mongodb";
import { serverEnv } from "@/lib/env/server";
import { logger as rootLogger } from "@/lib/logger";
import { fieldErrors } from "@/lib/validation/forms";

import type { ApiErrorCode, ApiFailure, ApiSuccess } from "./types";

const STATUS: Record<ApiErrorCode, number> = {
  bad_request: 400,
  validation_failed: 422,
  forbidden: 403,
  not_found: 404,
  payload_too_large: 413,
  unsupported_media_type: 415,
  rate_limited: 429,
  service_unavailable: 503,
  internal_error: 500,
  network_error: 502,
};

const NO_STORE = { "Cache-Control": "no-store" };

export class ApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly fields?: Record<string, string[]>,
    readonly headers?: Record<string, string>,
  ) {
    super(message);
    this.name = "ApiError";
  }
}

export function ok<T>(data: T, status = 200) {
  return Response.json({ ok: true, data } satisfies ApiSuccess<T>, { status, headers: NO_STORE });
}

function fail(error: ApiError) {
  const body: ApiFailure = { ok: false, error: { code: error.code, message: error.message, fields: error.fields } };
  return Response.json(body, { status: STATUS[error.code], headers: { ...NO_STORE, ...error.headers } });
}

type HandlerContext = { request: Request; log: typeof rootLogger; ipHash: string };

/**
 * Wraps a mutating route handler with the checks every write endpoint needs:
 * same-origin requests only, JSON bodies under a size cap, schema validation,
 * and consistent error responses + logging. Unexpected errors never leak details.
 */
export function jsonHandler<S extends z.ZodType>(
  options: { name: string; schema: S; maxBytes?: number },
  handler: (input: z.infer<S>, context: HandlerContext) => Promise<Response>,
) {
  return async (request: Request) => {
    const requestId = crypto.randomUUID();
    const log = rootLogger.child({ route: options.name, requestId });
    const started = performance.now();

    try {
      assertSameOrigin(request);
      if (!request.headers.get("content-type")?.includes("application/json")) {
        throw new ApiError("unsupported_media_type", "Send the request body as JSON.");
      }
      const body = await readJson(request, options.maxBytes ?? 16_384);
      const parsed = options.schema.safeParse(body);
      if (!parsed.success) {
        throw new ApiError("validation_failed", "Some fields need attention.", fieldErrors(parsed.error));
      }
      const response = await handler(parsed.data, { request, log, ipHash: hashIp(clientIp(request)) });
      log.info("request handled", { status: response.status, ms: Math.round(performance.now() - started) });
      return response;
    } catch (error) {
      if (error instanceof ApiError) {
        log.warn("request rejected", { code: error.code });
        return fail(error);
      }
      if (error instanceof DatabaseNotConfiguredError) {
        log.warn("database not configured");
        return fail(new ApiError("service_unavailable", "This feature is temporarily unavailable. Please try again later."));
      }
      log.error("request failed", { error });
      return fail(new ApiError("internal_error", "Something went wrong on our side. Please try again."));
    }
  };
}

function assertSameOrigin(request: Request) {
  const origin = request.headers.get("origin");
  const allowed = new Set([new URL(request.url).origin, siteConfig.url]);
  if (!origin || !allowed.has(origin)) throw new ApiError("forbidden", "Cross-origin requests are not allowed.");
}

async function readJson(request: Request, maxBytes: number): Promise<unknown> {
  const declared = Number(request.headers.get("content-length") ?? 0);
  if (declared > maxBytes) throw new ApiError("payload_too_large", "The request is too large.");
  const text = await request.text();
  if (new TextEncoder().encode(text).length > maxBytes) throw new ApiError("payload_too_large", "The request is too large.");
  try {
    return JSON.parse(text);
  } catch {
    throw new ApiError("bad_request", "The request body isn't valid JSON.");
  }
}

function clientIp(request: Request) {
  // Behind a proxy/CDN the first X-Forwarded-For entry is the client. Configure
  // your host to overwrite (not append to) this header from untrusted clients.
  return request.headers.get("x-forwarded-for")?.split(",")[0]?.trim() || request.headers.get("x-real-ip") || "unknown";
}

/** IPs are never stored; only a salted hash used for rate limiting. */
function hashIp(ip: string) {
  const salt = serverEnv.IP_HASH_SALT ?? "development-only-salt";
  return createHash("sha256").update(`${salt}:${ip}`).digest("hex").slice(0, 32);
}

/**
 * Fixed-window rate limit stored in MongoDB, so it holds across server
 * instances. Expired windows are removed by a TTL index.
 */
export async function rateLimit(bucket: string, ipHash: string, { limit, windowSeconds }: { limit: number; windowSeconds: number }) {
  const db = await getDb();
  const window = Math.floor(Date.now() / 1000 / windowSeconds);
  const key = `${bucket}:${ipHash}:${window}`;
  const doc = await collections.rateLimits(db).findOneAndUpdate(
    { _id: key },
    { $inc: { count: 1 }, $setOnInsert: { expiresAt: new Date((window + 1) * windowSeconds * 1000) } },
    { upsert: true, returnDocument: "after" },
  );
  if ((doc?.count ?? 0) > limit) {
    const retryAfter = (window + 1) * windowSeconds - Math.floor(Date.now() / 1000);
    throw new ApiError("rate_limited", "Too many requests. Please wait a bit and try again.", undefined, {
      "Retry-After": String(retryAfter),
    });
  }
}

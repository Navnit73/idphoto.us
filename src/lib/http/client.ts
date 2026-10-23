import type { ApiErrorCode, ApiResponse } from "@/lib/api/types";

/**
 * Browser → our own /api routes. Same-origin, JSON responses only. Built on
 * `fetch` rather than axios so the photo tools don't ship an HTTP library.
 */
const API_BASE = "/api";
const DEFAULT_TIMEOUT_MS = 15_000;

/** Error thrown by `apiPost`, carrying the API's error code and per-field messages. */
export class ClientApiError extends Error {
  constructor(
    readonly code: ApiErrorCode,
    message: string,
    readonly fields: Record<string, string[]> = {},
  ) {
    super(message);
    this.name = "ClientApiError";
  }
}

async function request<T>(path: string, body: BodyInit, { timeout, headers }: { timeout: number; headers?: HeadersInit }): Promise<T> {
  let response: Response;
  try {
    response = await fetch(`${API_BASE}${path}`, {
      method: "POST",
      body,
      headers: { Accept: "application/json", ...headers },
      credentials: "same-origin",
      signal: AbortSignal.timeout(timeout),
    });
  } catch (error) {
    if (error instanceof DOMException && error.name === "TimeoutError") {
      throw new ClientApiError("network_error", "The request timed out. Please try again.");
    }
    throw new ClientApiError("network_error", "Couldn't reach the server. Check your connection and try again.");
  }

  // Our routes always answer with an ApiResponse; anything else (a proxy error page, say) is unexpected.
  const data = (await response.json().catch(() => null)) as ApiResponse<T> | null;
  if (data?.ok === true) return data.data;
  if (data?.ok === false) throw new ClientApiError(data.error.code, data.error.message, data.error.fields);
  throw new ClientApiError("internal_error", "Something went wrong. Please try again.");
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return request<T>(path, JSON.stringify(body), { timeout: DEFAULT_TIMEOUT_MS, headers: { "Content-Type": "application/json" } });
}

/** Posts a FormData upload. No Content-Type header, so the browser sets multipart with its boundary. */
export function apiUpload<T>(path: string, form: FormData, { timeout = 90_000 }: { timeout?: number } = {}): Promise<T> {
  return request<T>(path, form, { timeout });
}

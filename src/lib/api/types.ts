/** Shape of every JSON response from /api routes. Shared by server and client. */
export type ApiSuccess<T> = { ok: true; data: T };

export type ApiErrorCode =
  | "bad_request"
  | "validation_failed"
  | "forbidden"
  | "not_found"
  | "payload_too_large"
  | "unsupported_media_type"
  | "rate_limited"
  | "service_unavailable"
  | "internal_error"
  | "network_error";

export type ApiFailure = {
  ok: false;
  error: { code: ApiErrorCode; message: string; fields?: Record<string, string[]> };
};

export type ApiResponse<T> = ApiSuccess<T> | ApiFailure;

/** POST /api/photo/process */
export type PhotoProcessResult = { resultId: string };

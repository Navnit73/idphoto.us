import axios, { AxiosError } from "axios";

import type { ApiErrorCode, ApiFailure, ApiResponse } from "@/lib/api/types";

/** Axios instance for browser → our own /api routes. Same-origin, JSON only. */
export const apiClient = axios.create({
  baseURL: "/api",
  timeout: 15_000,
  headers: { "Content-Type": "application/json", Accept: "application/json" },
  withCredentials: false,
});

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

function toClientError(error: unknown): ClientApiError {
  if (error instanceof AxiosError) {
    const body = error.response?.data as ApiFailure | undefined;
    if (body && body.ok === false) return new ClientApiError(body.error.code, body.error.message, body.error.fields);
    if (error.code === AxiosError.ECONNABORTED) return new ClientApiError("network_error", "The request timed out. Please try again.");
    if (!error.response) return new ClientApiError("network_error", "Couldn't reach the server. Check your connection and try again.");
  }
  return new ClientApiError("internal_error", "Something went wrong. Please try again.");
}

async function unwrap<T>(request: Promise<{ data: ApiResponse<T> }>): Promise<T> {
  try {
    const { data } = await request;
    if (!data.ok) throw new ClientApiError(data.error.code, data.error.message, data.error.fields);
    return data.data;
  } catch (error) {
    throw error instanceof ClientApiError ? error : toClientError(error);
  }
}

export function apiPost<T>(path: string, body: unknown): Promise<T> {
  return unwrap(apiClient.post<ApiResponse<T>>(path, body));
}

/**
 * Posts a FormData upload. The multipart Content-Type stops axios from
 * serializing the form as JSON; the browser then sets it with the boundary.
 */
export function apiUpload<T>(path: string, form: FormData, { timeout = 90_000 }: { timeout?: number } = {}): Promise<T> {
  return unwrap(apiClient.post<ApiResponse<T>>(path, form, { timeout, headers: { "Content-Type": "multipart/form-data" } }));
}

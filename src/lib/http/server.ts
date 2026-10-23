import "server-only";

import axios, { AxiosError } from "axios";

import { logger } from "@/lib/logger";

/**
 * Axios instance for server-to-server calls (webhooks, third-party APIs).
 * Never import this into client components — `server-only` enforces it.
 * Short timeouts and capped response sizes keep a slow upstream from
 * tying up the server.
 */
export const serverHttp = axios.create({
  timeout: 8_000,
  maxRedirects: 3,
  maxContentLength: 1_000_000,
  headers: { "User-Agent": "idphoto.us-server/1.0", Accept: "application/json" },
});

const startedAt = new WeakMap<object, number>();

serverHttp.interceptors.request.use((config) => {
  startedAt.set(config, Date.now());
  return config;
});

serverHttp.interceptors.response.use(
  (response) => {
    logger.debug("upstream request", {
      method: response.config.method,
      host: hostOf(response.config.url),
      status: response.status,
      ms: elapsed(response.config),
    });
    return response;
  },
  (error: AxiosError) => {
    logger.warn("upstream request failed", {
      method: error.config?.method,
      host: hostOf(error.config?.url),
      status: error.response?.status,
      code: error.code,
      ms: elapsed(error.config),
    });
    return Promise.reject(error);
  },
);

// Log only the host: URLs for webhooks and APIs often embed secrets.
function hostOf(url?: string) {
  try {
    return url ? new URL(url).host : undefined;
  } catch {
    return undefined;
  }
}

function elapsed(config?: object) {
  const started = config && startedAt.get(config);
  return started ? Date.now() - started : undefined;
}

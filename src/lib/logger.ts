import "server-only";

import { serverEnv } from "@/lib/env/server";

type Level = "debug" | "info" | "warn" | "error";
type Fields = Record<string, unknown>;

const levels: Record<Level, number> = { debug: 10, info: 20, warn: 30, error: 40 };
const threshold = levels[serverEnv.LOG_LEVEL];
const pretty = serverEnv.NODE_ENV !== "production";

const REDACTED_KEYS = /pass(word)?|secret|token|authorization|cookie|api[-_]?key|uri|email|message/i;

function redact(value: unknown, depth = 0): unknown {
  if (depth > 4 || value === null || typeof value !== "object") return value;
  if (value instanceof Error) return serializeError(value);
  if (Array.isArray(value)) return value.map((item) => redact(item, depth + 1));
  return Object.fromEntries(
    Object.entries(value).map(([key, entry]) => [key, REDACTED_KEYS.test(key) ? "[redacted]" : redact(entry, depth + 1)]),
  );
}

function serializeError(error: Error): Fields {
  return {
    name: error.name,
    message: error.message,
    stack: error.stack,
    ...("digest" in error ? { digest: error.digest } : {}),
    ...(error.cause ? { cause: error.cause instanceof Error ? serializeError(error.cause) : String(error.cause) } : {}),
  };
}

function write(level: Level, bindings: Fields, msg: string, fields?: Fields) {
  if (levels[level] < threshold) return;
  const context = { ...bindings, ...(redact(fields) as Fields) };
  const out = level === "error" || level === "warn" ? console.error : console.log;
  if (pretty) out(`[${level}] ${msg}`, context);
  else out(JSON.stringify({ level, time: new Date().toISOString(), msg, ...context }));
}

export type Logger = {
  debug(msg: string, fields?: Fields): void;
  info(msg: string, fields?: Fields): void;
  warn(msg: string, fields?: Fields): void;
  error(msg: string, fields?: Fields): void;
  child(bindings: Fields): Logger;
};

function createLogger(bindings: Fields = {}): Logger {
  return {
    debug: (msg, fields) => write("debug", bindings, msg, fields),
    info: (msg, fields) => write("info", bindings, msg, fields),
    warn: (msg, fields) => write("warn", bindings, msg, fields),
    error: (msg, fields) => write("error", bindings, msg, fields),
    child: (extra) => createLogger({ ...bindings, ...extra }),
  };
}

/**
 * Structured server logger: JSON lines in production (ready for any log
 * drain), readable output in development. Sensitive keys are redacted.
 */
export const logger = createLogger({ service: "idphoto.us" });

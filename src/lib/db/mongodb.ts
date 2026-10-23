import "server-only";

import { MongoClient, type Db } from "mongodb";

import { serverEnv } from "@/lib/env/server";
import { logger } from "@/lib/logger";

import { ensureIndexes } from "./collections";

export class DatabaseNotConfiguredError extends Error {
  constructor() {
    super("MONGODB_URI is not set");
    this.name = "DatabaseNotConfiguredError";
  }
}

type Cache = { client: MongoClient; ready: Promise<Db> };

// Reuse one client per server process. In development the module is reloaded
// on every edit, so the client is parked on globalThis to avoid leaking pools.
const globalForMongo = globalThis as typeof globalThis & { __mongo?: Cache };

export function isDatabaseConfigured() {
  return Boolean(serverEnv.MONGODB_URI);
}

/**
 * Returns a connected database handle. The driver pools connections, so call
 * this per request rather than holding the Db yourself.
 */
export function getDb(): Promise<Db> {
  if (!serverEnv.MONGODB_URI) return Promise.reject(new DatabaseNotConfiguredError());

  if (!globalForMongo.__mongo) {
    const client = new MongoClient(serverEnv.MONGODB_URI, {
      appName: "idphoto.us",
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5_000,
      retryWrites: true,
    });
    const ready = client
      .connect()
      .then(async (connected) => {
        const db = connected.db(serverEnv.MONGODB_DB);
        await ensureIndexes(db);
        logger.info("mongodb connected", { db: serverEnv.MONGODB_DB });
        return db;
      })
      .catch((error) => {
        // Drop the failed client so the next request retries instead of reusing a dead promise.
        globalForMongo.__mongo = undefined;
        logger.error("mongodb connection failed", { error });
        throw error;
      });
    globalForMongo.__mongo = { client, ready };
  }

  return globalForMongo.__mongo.ready;
}

/** Lightweight connectivity check for health endpoints. */
export async function pingDatabase(): Promise<boolean> {
  try {
    const db = await getDb();
    await db.command({ ping: 1 });
    return true;
  } catch {
    return false;
  }
}

import "server-only";

import type { Db, ObjectId } from "mongodb";

export type ContactMessageDoc = {
  _id?: ObjectId;
  name: string;
  email: string;
  topic: string;
  message: string;
  pagePath: string | null;
  ipHash: string;
  status: "new" | "read" | "archived";
  createdAt: Date;
};

export type FeedbackDoc = {
  _id?: ObjectId;
  path: string;
  helpful: boolean;
  comment: string | null;
  ipHash: string;
  createdAt: Date;
};

/**
 * A processed photo, so /preview/<id> can show it later. Holds only the
 * PixPassport result (image URLs and metrics), never the uploaded image.
 * Removed by a TTL index at `expiresAt`.
 */
export type PhotoResultDoc = {
  _id: string;
  countryCode: string;
  documentType: string;
  imageUrl: string;
  previewUrl: string | null;
  dimensions: string;
  format: string;
  sizeKb: number;
  metrics: {
    headHeightPct: number;
    eyePositionPct: number;
    topMarginPct: number;
    backgroundValid: boolean;
    backgroundCorrected: boolean;
  };
  ipHash: string;
  createdAt: Date;
  expiresAt: Date;
};

export type RateLimitDoc = {
  _id: string;
  count: number;
  expiresAt: Date;
};

export const collections = {
  contactMessages: (db: Db) => db.collection<ContactMessageDoc>("contact_messages"),
  feedback: (db: Db) => db.collection<FeedbackDoc>("feedback"),
  photoResults: (db: Db) => db.collection<PhotoResultDoc>("photo_results"),
  rateLimits: (db: Db) => db.collection<RateLimitDoc>("rate_limits"),
};

/** Idempotent; runs once per process when the connection is first opened. */
export async function ensureIndexes(db: Db) {
  await Promise.all([
    collections.contactMessages(db).createIndex({ createdAt: -1 }),
    collections.contactMessages(db).createIndex({ status: 1, createdAt: -1 }),
    collections.feedback(db).createIndex({ path: 1, createdAt: -1 }),
    // MongoDB deletes expired photo results and rate-limit windows automatically.
    collections.photoResults(db).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
    collections.rateLimits(db).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
}

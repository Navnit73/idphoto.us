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

export type RateLimitDoc = {
  _id: string;
  count: number;
  expiresAt: Date;
};

export const collections = {
  contactMessages: (db: Db) => db.collection<ContactMessageDoc>("contact_messages"),
  feedback: (db: Db) => db.collection<FeedbackDoc>("feedback"),
  rateLimits: (db: Db) => db.collection<RateLimitDoc>("rate_limits"),
};

/** Idempotent; runs once per process when the connection is first opened. */
export async function ensureIndexes(db: Db) {
  await Promise.all([
    collections.contactMessages(db).createIndex({ createdAt: -1 }),
    collections.contactMessages(db).createIndex({ status: 1, createdAt: -1 }),
    collections.feedback(db).createIndex({ path: 1, createdAt: -1 }),
    // MongoDB deletes expired rate-limit windows automatically.
    collections.rateLimits(db).createIndex({ expiresAt: 1 }, { expireAfterSeconds: 0 }),
  ]);
}

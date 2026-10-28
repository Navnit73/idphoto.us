import "server-only";

import type { Db } from "mongodb";
import { after, connection } from "next/server";

import { isCloudinaryConfigured, saveToCloudinary } from "@/lib/cloudinary";
import { collections, type PhotoResultDoc } from "@/lib/db/collections";
import { getDb } from "@/lib/db/mongodb";
import { logger } from "@/lib/logger";
import { PHOTO_RESULT_TTL_DAYS } from "@/lib/photo/limits";
import { photoResultIdSchema } from "@/lib/validation/forms";

import type { ProcessedPhoto } from "./pixpassport";

/**
 * Stores the result with PixPassport's URL so the visitor isn't kept waiting,
 * then copies the full-resolution photo into our Cloudinary account after the
 * response (it's what paid orders download and email). If the copy fails the
 * upstream URL stays in place rather than failing an already-processed photo.
 */
export async function savePhotoResult(photo: ProcessedPhoto, meta: { countryCode: string; documentType: string; ipHash: string }) {
  const imageUrl = photo.image_url;
  const createdAt = new Date();
  const doc: PhotoResultDoc = {
    _id: photo.result_id,
    countryCode: meta.countryCode,
    documentType: meta.documentType,
    imageUrl,
    previewUrl: photo.preview_url ?? null,
    dimensions: photo.dimensions,
    format: photo.format,
    sizeKb: photo.size_kb,
    metrics: {
      headHeightPct: photo.metrics.head_height_pct,
      eyePositionPct: photo.metrics.eye_position_pct,
      topMarginPct: photo.metrics.top_margin_pct,
      backgroundValid: photo.metrics.background_valid,
      backgroundCorrected: photo.metrics.background_corrected,
    },
    ipHash: meta.ipHash,
    createdAt,
    expiresAt: new Date(createdAt.getTime() + PHOTO_RESULT_TTL_DAYS * 86_400_000),
  };
  const db = await getDb();
  await collections.photoResults(db).insertOne(doc);
  if (isCloudinaryConfigured()) after(() => copyToCloudinary(db, photo.result_id, imageUrl));
  return doc;
}

async function copyToCloudinary(db: Db, resultId: string, upstreamUrl: string) {
  try {
    const ownUrl = await saveToCloudinary(upstreamUrl, resultId);
    await Promise.all([
      collections.photoResults(db).updateOne({ _id: resultId }, { $set: { imageUrl: ownUrl } }),
      // An order placed before the copy finished captured the upstream URL; point it at our copy too.
      collections.payments(db).updateMany(
        { "image.resultId": resultId, "image.imageUrl": upstreamUrl },
        { $set: { "image.imageUrl": ownUrl } },
      ),
    ]);
  } catch (error) {
    logger.error("photo copy to cloudinary failed", { resultId, error });
  }
}

/**
 * Returns the stored result, or null for malformed, unknown, or expired ids.
 * (The TTL monitor runs about once a minute, so expiry is also checked here.)
 */
export async function getPhotoResult(id: string) {
  if (!photoResultIdSchema.safeParse(id).success) return null;
  // The expiry check reads the current time, so it must run per request, never during prerender.
  await connection();
  const db = await getDb();
  const doc = await collections.photoResults(db).findOne({ _id: id }, { projection: { ipHash: 0 } });
  return doc && doc.expiresAt > new Date() ? doc : null;
}

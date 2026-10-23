import "server-only";

import { connection } from "next/server";

import { collections, type PhotoResultDoc } from "@/lib/db/collections";
import { getDb } from "@/lib/db/mongodb";
import { PHOTO_RESULT_TTL_DAYS } from "@/lib/photo/limits";
import { photoResultIdSchema } from "@/lib/validation/forms";

import type { ProcessedPhoto } from "./pixpassport";

export async function savePhotoResult(photo: ProcessedPhoto, meta: { countryCode: string; documentType: string; ipHash: string }) {
  const createdAt = new Date();
  const doc: PhotoResultDoc = {
    _id: photo.result_id,
    countryCode: meta.countryCode,
    documentType: meta.documentType,
    imageUrl: photo.image_url,
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
  return doc;
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

/**
 * Cloudinary serves a URL with the `fl_attachment` flag as a download
 * (Content-Disposition: attachment), which a cross-origin `<a download>` can't do.
 */
export function downloadUrl(imageUrl: string, filename: string) {
  const safeName = filename.replace(/[^\w-]+/g, "-").slice(0, 60);
  return imageUrl.replace("/image/upload/", `/image/upload/fl_attachment:${safeName}/`);
}

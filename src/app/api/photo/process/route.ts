import { ApiError, formHandler, ok, rateLimit } from "@/lib/api/server";
import type { PhotoProcessResult } from "@/lib/api/types";
import { getDb } from "@/lib/db/mongodb";
import { processPhoto } from "@/lib/photo/pixpassport";
import { savePhotoResult } from "@/lib/photo/results";
import { MAX_PHOTO_UPLOAD_BYTES, PHOTO_UPLOAD_TYPES, photoProcessSchema } from "@/lib/validation/forms";

/** Processing upstream can take tens of seconds. */
export const maxDuration = 60;

export const POST = formHandler(
  // Leaves room for the multipart envelope and text fields around the image.
  { name: "photo-process", schema: photoProcessSchema, maxBytes: MAX_PHOTO_UPLOAD_BYTES + 64 * 1024 },
  async (input, form, { log, ipHash }) => {
    const image = form.get("image");
    if (!(image instanceof File) || image.size === 0) {
      throw new ApiError("validation_failed", "Choose a photo to upload.", { image: ["Choose a photo to upload."] });
    }
    if (!(PHOTO_UPLOAD_TYPES as readonly string[]).includes(image.type)) {
      throw new ApiError("unsupported_media_type", "Upload a JPEG, PNG, or WebP photo.");
    }

    // Fail fast with 503 before spending an API call if results couldn't be saved anyway.
    await getDb();
    await rateLimit("photo-process", ipHash, { limit: 20, windowSeconds: 3600 });

    const photo = await processPhoto({
      image,
      filename: `upload.${image.type.split("/")[1]}`,
      countryCode: input.country_code,
      documentType: input.document_type,
    });
    await savePhotoResult(photo, { countryCode: input.country_code, documentType: input.document_type, ipHash });
    log.info("photo processed", { country: input.country_code, backgroundValid: photo.metrics.background_valid });

    return ok<PhotoProcessResult>({ resultId: photo.result_id }, 201);
  },
);

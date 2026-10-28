import { jsonHandler, ok } from "@/lib/api/server";
import type { PhotoRequirements } from "@/lib/api/types";
import { getPhotoRequirements } from "@/lib/photo/pixpassport";
import { photoRequirementsSchema } from "@/lib/validation/forms";

/** A country's published photo rules, for the in-browser photo checker. Cached upstream, so no rate limit or database. */
export const POST = jsonHandler({ name: "photo-requirements", schema: photoRequirementsSchema, maxBytes: 1_024 }, async (input) =>
  ok<PhotoRequirements>(await getPhotoRequirements(input.country_code, input.document_type)),
);

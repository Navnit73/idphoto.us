import { ApiError, jsonHandler, ok, rateLimit } from "@/lib/api/server";
import { sendMail } from "@/lib/mail";
import { photoReadyEmail } from "@/lib/mail/templates";
import { getCountry } from "@/lib/photo/countries";
import { downloadUrl, getPhotoResult } from "@/lib/photo/results";
import { absoluteUrl } from "@/lib/seo/metadata";
import { photoEmailSchema } from "@/lib/validation/forms";

/** Emails the links for a processed photo. The address is used for this one message and not stored. */
export const POST = jsonHandler({ name: "photo-email", schema: photoEmailSchema, maxBytes: 2_048 }, async (input, { log, ipHash }) => {
  if (input.website) {
    log.info("honeypot triggered; email dropped");
    return ok({ sent: true });
  }

  await rateLimit("photo-email", ipHash, { limit: 5, windowSeconds: 3600 });

  const result = await getPhotoResult(input.resultId);
  if (!result) throw new ApiError("not_found", "This photo has expired. Please make a new one.");

  const countryName = getCountry(result.countryCode)?.name ?? result.countryCode;
  await sendMail(
    "photo-ready",
    { to: input.email },
    photoReadyEmail({
      countryName,
      pageUrl: absoluteUrl(`/preview/${result._id}`),
      downloadUrl: downloadUrl(result.imageUrl, `passport-photo-${result.countryCode}`),
      expiresAt: result.expiresAt,
    }),
  );

  return ok({ sent: true });
});

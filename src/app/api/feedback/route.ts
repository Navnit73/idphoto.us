import { ApiError, jsonHandler, ok, rateLimit } from "@/lib/api/server";
import { getPageSummaries } from "@/lib/content/loader";
import { collections } from "@/lib/db/collections";
import { getDb } from "@/lib/db/mongodb";
import { feedbackSchema } from "@/lib/validation/forms";

export const POST = jsonHandler({ name: "feedback", schema: feedbackSchema, maxBytes: 4_096 }, async (input, { ipHash }) => {
  const pages = await getPageSummaries();
  if (!pages.some((page) => page.path === input.path)) {
    throw new ApiError("not_found", "That page doesn't exist.");
  }

  await rateLimit("feedback", ipHash, { limit: 20, windowSeconds: 3600 });

  const db = await getDb();
  await collections.feedback(db).insertOne({
    path: input.path,
    helpful: input.helpful,
    comment: input.comment || null,
    ipHash,
    createdAt: new Date(),
  });

  return ok({ received: true }, 201);
});

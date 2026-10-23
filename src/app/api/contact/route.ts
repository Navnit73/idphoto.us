import { after } from "next/server";

import { siteConfig } from "@/config/site";
import { jsonHandler, ok, rateLimit } from "@/lib/api/server";
import { collections } from "@/lib/db/collections";
import { getDb } from "@/lib/db/mongodb";
import { serverEnv } from "@/lib/env/server";
import { serverHttp } from "@/lib/http/server";
import { contactSchema } from "@/lib/validation/forms";

export const POST = jsonHandler({ name: "contact", schema: contactSchema }, async (input, { log, ipHash }) => {
  if (input.website) {
    log.info("honeypot triggered; message dropped");
    return ok({ received: true }, 201);
  }

  await rateLimit("contact", ipHash, { limit: 5, windowSeconds: 3600 });

  const db = await getDb();
  const { insertedId } = await collections.contactMessages(db).insertOne({
    name: input.name,
    email: input.email,
    topic: input.topic,
    message: input.message,
    pagePath: input.pagePath ?? null,
    ipHash,
    status: "new",
    createdAt: new Date(),
  });

  const webhook = serverEnv.CONTACT_WEBHOOK_URL;
  if (webhook) {
    // Runs after the response is sent. Omits the message and email; read those in the database.
    after(async () => {
      await serverHttp
        .post(webhook, { text: `New ${input.topic} message on ${siteConfig.name} (id ${insertedId.toHexString()})` })
        .catch(() => {
          // Logged by the serverHttp interceptor; the message itself is already stored.
        });
    });
  }

  return ok({ received: true }, 201);
});

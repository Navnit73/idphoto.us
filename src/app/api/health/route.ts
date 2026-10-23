import { connection } from "next/server";

import { isDatabaseConfigured, pingDatabase } from "@/lib/db/mongodb";

/** Liveness/readiness probe for load balancers and uptime monitors. */
export async function GET() {
  await connection();
  const database = isDatabaseConfigured() ? ((await pingDatabase()) ? "up" : "down") : "not_configured";
  const healthy = database !== "down";
  return Response.json({ status: healthy ? "ok" : "degraded", database }, { status: healthy ? 200 : 503, headers: { "Cache-Control": "no-store" } });
}

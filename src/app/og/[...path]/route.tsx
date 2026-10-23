import { getPage, getPageSummaries, pathFromSegments } from "@/lib/content/loader";
import { renderOgImage } from "@/lib/seo/og-image";

const EYEBROW = { tool: "Free tool", guide: "Guide", legal: "Policy", about: "About" } as const;

export async function generateStaticParams() {
  const pages = await getPageSummaries();
  return pages.map((page) => ({ path: page.path.slice(1).split("/") }));
}

/** Social card for a content page, e.g. /og/guide/us-passport-photo-size. Prerendered at build time. */
export async function GET(_request: Request, { params }: RouteContext<"/og/[...path]">) {
  const page = await getPage(pathFromSegments((await params).path));
  if (!page) return new Response("Not found", { status: 404 });
  return renderOgImage({ eyebrow: EYEBROW[page.category], title: page.heading });
}

import { NextResponse, type NextRequest } from "next/server";

/** Result ids are lowercase UUIDs (see photoResultIdSchema). Kept inline: Proxy shouldn't import app modules. */
const PREVIEW_PATH = /^\/preview\/([^/]+)$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/**
 * All site URLs are lowercase. Mixed-case variants (/Guide, /TOOL/x) get a
 * permanent redirect so there's exactly one URL per page for search engines.
 *
 * Malformed /preview/<id> links are answered with a real 404 here: the preview
 * page streams, so a `notFound()` there can only render the 404 UI under a 200.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const lower = pathname.toLowerCase();
  if (pathname !== lower) {
    const url = request.nextUrl.clone();
    url.pathname = lower;
    return NextResponse.redirect(url, 308);
  }

  const preview = PREVIEW_PATH.exec(pathname);
  if (preview && !UUID.test(preview[1])) return NextResponse.rewrite(new URL("/_not-found", request.url), { status: 404 });

  return NextResponse.next();
}

export const config = {
  // Only page-like paths: skip Next internals, API routes, and files with extensions.
  matcher: ["/((?!_next/|api/|.*\\.[\\w]+$).*)"],
};

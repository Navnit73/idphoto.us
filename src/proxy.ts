import { NextResponse, type NextRequest } from "next/server";

/**
 * All site URLs are lowercase. Mixed-case variants (/Guide, /TOOL/x) get a
 * permanent redirect so there's exactly one URL per page for search engines.
 */
export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  const lower = pathname.toLowerCase();
  if (pathname === lower) return NextResponse.next();

  const url = request.nextUrl.clone();
  url.pathname = lower;
  return NextResponse.redirect(url, 308);
}

export const config = {
  // Only page-like paths: skip Next internals, API routes, and files with extensions.
  matcher: ["/((?!_next/|api/|.*\\.[\\w]+$).*)"],
};

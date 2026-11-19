import { NextResponse, type NextRequest } from "next/server";
import { getSessionCookie } from "better-auth/cookies";

/**
 * Optimistic redirect for signed-out visitors. Real authorization happens on
 * the server for every page and API route (requireUser / requireApiUser).
 */
const PUBLIC = [/^\/login/, /^\/api\/auth\//, /^\/api\/health/, /^\/api\/cron\//, /^\/offline/, /^\/manifest/, /^\/sw\.js/, /^\/icons\//, /^\/favicon/];

export function proxy(request: NextRequest) {
  const { pathname } = request.nextUrl;
  if (PUBLIC.some((re) => re.test(pathname))) return NextResponse.next();
  if (!getSessionCookie(request)) {
    if (pathname.startsWith("/api/")) return NextResponse.json({ error: "unauthorized" }, { status: 401 });
    const url = request.nextUrl.clone();
    url.pathname = "/login";
    url.search = "";
    return NextResponse.redirect(url);
  }
  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!_next/static|_next/image|.*\\.(?:png|svg|ico|webmanifest|txt)$).*)"],
};

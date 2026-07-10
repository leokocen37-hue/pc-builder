// → project root: proxy.ts (same level as package.json, next to app/)
// Next.js 16 renamed the "middleware" file convention to "proxy" — same
// behavior, just a rename of the file and the exported function.
import { NextRequest, NextResponse } from "next/server";

const COOKIE = "rs_site_unlock";

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow: the unlock API, Next internals, and static/asset files.
  if (
    pathname.startsWith("/api/unlock") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|txt|xml|woff2?|ttf)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Already unlocked? let them through.
  const token = req.cookies.get(COOKIE)?.value;
  if (token && token === process.env.SITE_UNLOCK_TOKEN) {
    return NextResponse.next();
  }

  // Not unlocked → show the lock screen (rewrite so the URL stays the same),
  // and flag it so the layout renders ONLY the lock screen (no header/cart).
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-site-locked", "1");
  const url = req.nextUrl.clone();
  url.pathname = "/zakljucano";
  return NextResponse.rewrite(url, { request: { headers: requestHeaders } });
}

// run on everything except the assets we already allowed above
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

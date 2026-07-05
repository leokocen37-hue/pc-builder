// → put this at the PROJECT ROOT:  middleware.ts   (same level as package.json, next to app/)
import { NextRequest, NextResponse } from "next/server";

const COOKIE = "rs_site_unlock";

export function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  // Always allow: the unlock API, Next internals, and static/asset files.
  if (
    pathname.startsWith("/api/unlock") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|txt|woff2?|ttf)$/.test(pathname)
  ) {
    return NextResponse.next();
  }

  // Already unlocked? let them through.
  const token = req.cookies.get(COOKIE)?.value;
  if (token && token === process.env.SITE_UNLOCK_TOKEN) {
    return NextResponse.next();
  }

  // Not unlocked → show the lock screen (rewrite so the URL stays the same).
  const url = req.nextUrl.clone();
  url.pathname = "/zakljucano";
  return NextResponse.rewrite(url);
}

// run on everything except the assets we already allowed above
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};
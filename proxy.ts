// → project root: proxy.ts (same level as package.json, next to app/)
// Next.js 16 renamed the "middleware" file convention to "proxy" — same
// behavior, just a rename of the file and the exported function.
import { NextRequest, NextResponse } from "next/server";

const COOKIE = "rs_site_unlock";

/**
 * Content-Security-Policy, enforced.
 *
 * It ran as Content-Security-Policy-Report-Only before, with 'unsafe-inline'
 * in script-src — which reports nothing anyone reads and, more to the point,
 * would allow an injected <script> even if it were enforced. Neither half of
 * that is protection.
 *
 * Enforcing it needs a nonce, because Next emits inline bootstrap scripts.
 * The nonce is minted per request here and handed to Next through the request
 * headers; Next stamps it onto its own script tags. 'strict-dynamic' then lets
 * those scripts load the chunks they need without listing every URL, and the
 * https: and 'unsafe-inline' fallbacks are ignored by any browser that honours
 * strict-dynamic — they are there for ones that don't.
 *
 * style-src keeps 'unsafe-inline': the configurator is built out of style={{}}
 * attributes, and a nonce cannot cover a style attribute. That is a much
 * smaller exposure than script-src, and closing it would mean rewriting the
 * whole component's styling.
 */
function contentSecurityPolicy(nonce: string): string {
  // client components read the Storefront API straight from the browser
  const shopify = "https://*.myshopify.com";
  return [
    "default-src 'self'",
    `script-src 'self' 'nonce-${nonce}' 'strict-dynamic' https: 'unsafe-inline'`,
    "style-src 'self' 'unsafe-inline'",
    "img-src 'self' data: blob: https://cdn.shopify.com",
    "font-src 'self' data:",
    `connect-src 'self' ${shopify}`,
    // checkout leaves for a Shopify-hosted invoice page
    `form-action 'self' ${shopify}`,
    // the belt to X-Frame-Options' braces, and the only one modern browsers read
    "frame-ancestors 'none'",
    "base-uri 'self'",
    "object-src 'none'",
    "upgrade-insecure-requests",
  ].join("; ");
}

export function proxy(req: NextRequest) {
  const { pathname } = req.nextUrl;

  const nonce = crypto.randomUUID().replace(/-/g, "");
  const csp = contentSecurityPolicy(nonce);

  // Next reads the policy off the *request* to find the nonce and put it on
  // the scripts it emits; the browser reads it off the response.
  const requestHeaders = new Headers(req.headers);
  requestHeaders.set("x-nonce", nonce);
  requestHeaders.set("content-security-policy", csp);

  const withCsp = (res: NextResponse) => {
    res.headers.set("content-security-policy", csp);
    return res;
  };
  const next = () => withCsp(NextResponse.next({ request: { headers: requestHeaders } }));

  // No unlock token configured for this environment → the lock is simply off here.
  // This lets a Vercel Preview deployment (a different branch, its own private URL)
  // run fully open by leaving SITE_UNLOCK_TOKEN unset for the Preview environment,
  // while Production (www.racunalo.hr) keeps it set and stays locked.
  if (!process.env.SITE_UNLOCK_TOKEN) {
    return next();
  }

  // Always allow: the unlock API, Next internals, and static/asset files.
  if (
    pathname.startsWith("/api/unlock") ||
    pathname.startsWith("/_next") ||
    pathname === "/favicon.ico" ||
    pathname === "/robots.txt" ||
    pathname === "/sitemap.xml" ||
    /\.(svg|png|jpg|jpeg|gif|webp|ico|css|js|txt|xml|woff2?|ttf)$/.test(pathname)
  ) {
    return next();
  }

  // Already unlocked? let them through.
  const token = req.cookies.get(COOKIE)?.value;
  if (token && token === process.env.SITE_UNLOCK_TOKEN) {
    return next();
  }

  // Not unlocked → show the lock screen (rewrite so the URL stays the same),
  // and flag it so the layout renders ONLY the lock screen (no header/cart).
  requestHeaders.set("x-site-locked", "1");
  const url = req.nextUrl.clone();
  url.pathname = "/zakljucano";
  return withCsp(NextResponse.rewrite(url, { request: { headers: requestHeaders } }));
}

// run on everything except the assets we already allowed above
export const config = {
  matcher: ["/((?!_next/static|_next/image|favicon.ico).*)"],
};

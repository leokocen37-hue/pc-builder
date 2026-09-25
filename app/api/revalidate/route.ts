import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { revalidatePath } from "next/cache";
import { SECTIONS } from "@/lib/product-page";

/**
 * Shopify product webhooks -> cache invalidation.
 *
 * Storefront data is fetched with `next: { revalidate: 300 }`, so without this
 * a price or description edited in Shopify showed up only after the window
 * expired, or after a manual redeploy. Shopify calls this route instead.
 *
 * Add in Shopify: Settings -> Notifications -> Webhooks, one each for
 *   products/create, products/update, products/delete
 * pointing at  https://www.racunalo.hr/api/revalidate  (JSON), and put the
 * signing secret Shopify shows there into SHOPIFY_WEBHOOK_SECRET.
 */

// The body has to be read raw for the signature to verify, so no JSON parsing
// may happen before that.
export const dynamic = "force-dynamic";

function signatureMatches(rawBody: string, header: string | null, secret: string): boolean {
  if (!header) return false;
  const expected = crypto.createHmac("sha256", secret).update(rawBody, "utf8").digest("base64");
  const a = Buffer.from(expected);
  const b = Buffer.from(header);
  // timingSafeEqual throws on a length mismatch, which is itself an answer
  return a.length === b.length && crypto.timingSafeEqual(a, b);
}

export async function POST(request: Request) {
  const secret = process.env.SHOPIFY_WEBHOOK_SECRET;
  if (!secret) {
    // Fail closed. An unsigned endpoint that clears the cache on demand is a
    // free way to make the site re-fetch everything, over and over.
    return NextResponse.json({ error: "Webhook nije konfiguriran." }, { status: 503 });
  }

  const rawBody = await request.text();
  if (!signatureMatches(rawBody, request.headers.get("x-shopify-hmac-sha256"), secret)) {
    return NextResponse.json({ error: "Neispravan potpis." }, { status: 401 });
  }

  let handle: string | undefined;
  try {
    handle = (JSON.parse(rawBody) as { handle?: string }).handle;
  } catch {
    return NextResponse.json({ error: "Neispravno tijelo zahtjeva." }, { status: 400 });
  }

  // Every surface the product appears on: its own page under whichever
  // category it belongs to, the listings that include it, and the homepage
  // rows. The product's own categories aren't in the payload in a form worth
  // trusting, so each section's routes are refreshed rather than guessed at.
  const paths = new Set<string>(["/", "/racunala", "/periferija"]);
  for (const [section, config] of Object.entries(SECTIONS)) {
    for (const category of Object.keys(config.categories)) {
      paths.add(`/${section}/${category}`);
      if (handle) paths.add(`/${section}/${category}/${handle}`);
    }
  }

  for (const path of paths) revalidatePath(path);
  return NextResponse.json({ revalidated: true, handle: handle ?? null, count: paths.size });
}

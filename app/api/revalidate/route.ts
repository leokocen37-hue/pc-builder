import { NextResponse } from "next/server";
import crypto from "node:crypto";
import { revalidatePath, revalidateTag } from "next/cache";
import { SECTIONS } from "@/lib/product-page";
import { PRODUCTS_TAG } from "@/lib/shopify";

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

/** Every route that shows a product, so a redeploy is never the way to publish
 *  a price. Paths alone are not enough — see the tag below. */
function affectedPaths(handle?: string): string[] {
  const paths = new Set<string>([
    "/",
    "/racunala",
    "/periferija",
    // the sitemap lists products and their updatedAt, so it goes stale too
    "/sitemap.xml",
  ]);
  for (const [section, config] of Object.entries(SECTIONS)) {
    for (const category of Object.keys(config.categories)) {
      paths.add(`/${section}/${category}`);
      if (handle) paths.add(`/${section}/${category}/${handle}`);
    }
  }
  return [...paths];
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

  // The tag is the part that actually works.
  //
  // revalidatePath() drops a rendered page, but rendering it again re-runs the
  // Shopify fetch — whose own cache entry is still inside its 300s window, so
  // the page is rebuilt from exactly the data it already had. That is why a
  // price edited in Shopify appeared on the product's own page while /racunala
  // and the homepage kept quoting the old one until a redeploy: 929,99 € in
  // Shopify and on the product page, 849,99 € on every list.
  //
  // revalidateTag drops the data itself, so the rebuild fetches. The paths are
  // kept alongside it because a statically rendered route needs its own nudge.
  // Next 16 takes a cache profile alongside the tag: entries older than its
  // expire are purged. Zero means none of it survives, which is the point —
  // Shopify only calls this once something has actually changed.
  revalidateTag(PRODUCTS_TAG, { expire: 0 });
  const paths = affectedPaths(handle);
  for (const path of paths) revalidatePath(path);

  return NextResponse.json({
    revalidated: true,
    handle: handle ?? null,
    tags: [PRODUCTS_TAG],
    paths,
  });
}

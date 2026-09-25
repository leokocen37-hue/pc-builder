/**
 * Ask the Shopify CDN for an image at the size it will actually be drawn at.
 *
 * Shopify serves whatever was uploaded unless told otherwise, so a 2048px
 * product photo was arriving to fill a 220px card — the homepage alone pulled
 * about 2.6 MB of pixels it immediately threw away. `?width=` is resized and
 * cached on their side, so this costs nothing to use.
 *
 * Widths are given at the CSS size; the doubling for high-density screens
 * happens here, once, rather than at every call site.
 */
export function shopifyImage(url: string | null | undefined, cssWidth: number): string | undefined {
  if (!url) return undefined;
  // only Shopify's CDN understands these parameters; anything else is returned
  // untouched rather than given a query string it will ignore or choke on
  if (!url.includes("cdn.shopify.com")) return url;
  try {
    const u = new URL(url);
    u.searchParams.set("width", String(Math.round(cssWidth * 2)));
    return u.toString();
  } catch {
    return url;
  }
}

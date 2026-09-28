import { test, expect, type Page } from "@playwright/test";
import crypto from "node:crypto";
import fs from "node:fs";

/**
 * A product edited in Shopify updated on its own page but left /racunala, the
 * homepage and /periferija quoting the old price until a redeploy — 929,99 €
 * on the product, 849,99 € on every list.
 *
 * The listing routes are dynamic, so they re-render on every request: the
 * rendered page was never the stale thing. What was stale is the Shopify fetch
 * underneath, whose own cache entry lives 300s regardless of how many times
 * the page is rebuilt. revalidatePath could not have fixed it; only dropping
 * the tagged data could.
 */

const dismissCookies = async (page: Page) => {
  const accept = page.getByText("Prihvaćam");
  if (await accept.isVisible().catch(() => false)) await accept.click();
};

/** The signing secret, read the way the server reads it. */
function webhookSecret(): string | null {
  try {
    const env = fs.readFileSync(".env.local", "utf8");
    return env.match(/^SHOPIFY_WEBHOOK_SECRET=(.+)$/m)?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
}

const sign = (body: string, secret: string) =>
  crypto.createHmac("sha256", secret).update(body, "utf8").digest("base64");

const priceFrom = (text: string) => Number(text.replace(/[^\d,]/g, "").replace(",", "."));

test("the webhook drops the products tag, not only the product's own page", async ({ request }) => {
  const secret = webhookSecret();
  test.skip(!secret, "SHOPIFY_WEBHOOK_SECRET is not set in .env.local");

  const body = JSON.stringify({ handle: "entry-level-racunalo" });
  const res = await request.post("/api/revalidate", {
    headers: { "Content-Type": "application/json", "X-Shopify-Hmac-Sha256": sign(body, secret!) },
    data: body,
  });

  expect(res.status()).toBe(200);
  const json = await res.json();

  // the tag is the part that actually invalidates the Shopify responses the
  // listings are built from
  expect(json.tags).toContain("products");

  // ...and every page that shows a product is nudged too
  for (const path of ["/", "/racunala", "/periferija", "/sitemap.xml"]) {
    expect(json.paths, `missing ${path}`).toContain(path);
  }
  // including each category listing, which is where the stale price showed
  for (const path of ["/racunala/gaming", "/racunala/office", "/racunala/radne-stanice", "/periferija/tipkovnice"]) {
    expect(json.paths, `missing ${path}`).toContain(path);
  }
  // and the product's own page under its section
  expect(json.paths).toContain("/racunala/gaming/entry-level-racunalo");
});

test("an unsigned call still changes nothing", async ({ request }) => {
  const res = await request.post("/api/revalidate", { data: { handle: "entry-level-racunalo" } });
  expect([401, 503]).toContain(res.status());
});

// The symptom, stated as an invariant: whatever a list says a product costs,
// the product's own page has to say the same. This is what diverged.
test("listing prices agree with the product pages behind them", async ({ page }) => {
  for (const listing of ["/racunala", "/periferija"]) {
    await page.goto(listing);
    await dismissCookies(page);

    const card = page.locator(".rs-card").first();
    const listed = priceFrom(await card.locator(".rs-price").innerText());
    expect(listed, `no price on the first card of ${listing}`).toBeGreaterThan(0);

    await card.click();
    await page.waitForURL(/\/(racunala|periferija)\/[^/]+\/[^/]+$/);
    const onProduct = priceFrom(await page.locator(".rs-pdp-price").innerText());

    expect(onProduct, `${listing} disagrees with the product page`).toBeCloseTo(listed, 2);
  }
});

test("the homepage rows agree with the product pages too", async ({ page }) => {
  await page.goto("/");
  await dismissCookies(page);

  const card = page.locator(".rs-row-grid .rs-card").first();
  const listed = priceFrom(await card.locator(".rs-price").innerText());
  expect(listed).toBeGreaterThan(0);

  await card.click();
  await page.waitForURL(/\/racunala\/[^/]+\/[^/]+$/);
  expect(priceFrom(await page.locator(".rs-pdp-price").innerText())).toBeCloseTo(listed, 2);
});

test("the lists still serve, and still agree, right after a webhook", async ({ page, request }) => {
  const secret = webhookSecret();
  test.skip(!secret, "SHOPIFY_WEBHOOK_SECRET is not set in .env.local");

  const body = JSON.stringify({ handle: "entry-level-racunalo" });
  await request.post("/api/revalidate", {
    headers: { "Content-Type": "application/json", "X-Shopify-Hmac-Sha256": sign(body, secret!) },
    data: body,
  });

  // a purged cache must not leave the listings broken or empty while they refill
  for (const path of ["/", "/racunala", "/periferija"]) {
    const res = await request.get(path);
    expect(res.status(), `${path} after revalidation`).toBe(200);
  }

  await page.goto("/racunala");
  await dismissCookies(page);
  const card = page.locator(".rs-card").first();
  const listed = priceFrom(await card.locator(".rs-price").innerText());
  await card.click();
  await page.waitForURL(/\/racunala\/[^/]+\/[^/]+$/);
  expect(priceFrom(await page.locator(".rs-pdp-price").innerText())).toBeCloseTo(listed, 2);
});

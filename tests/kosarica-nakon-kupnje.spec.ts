import { test, expect, type Page } from "@playwright/test";

// Coming back from Shopify's invoice page, the cart must be empty if the order
// was paid and untouched if it wasn't. The real payment can't be driven from a
// test, so the status endpoint is stubbed and the cart's own behaviour around
// it is what's checked here.

const CART = "rs_cart_v2";
const PENDING = "rs_pending_order_v1";

const seed = (page: Page, pending: { id: string; token: string; at: number } | null) =>
  page.addInitScript(
    ([cartKey, pendingKey, pendingValue]) => {
      localStorage.setItem(
        cartKey as string,
        JSON.stringify([
          {
            kind: "product",
            lineId: "seed1",
            variantId: "gid://shopify/ProductVariant/1",
            title: "Testna stavka",
            price: 200,
            quantity: 1,
          },
        ])
      );
      if (pendingValue) localStorage.setItem(pendingKey as string, pendingValue as string);
      else localStorage.removeItem(pendingKey as string);
    },
    [CART, PENDING, pending ? JSON.stringify(pending) : null]
  );

const stubStatus = (page: Page, body: Record<string, unknown>) =>
  page.route("**/api/checkout/status**", (route) =>
    route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(body) })
  );

const dismissCookies = async (page: Page) => {
  const accept = page.getByText("Prihvaćam");
  if (await accept.isVisible().catch(() => false)) await accept.click();
};

test("a paid order empties the cart on the next visit", async ({ page }) => {
  await seed(page, { id: "gid://shopify/DraftOrder/1", token: "a".repeat(32), at: Date.now() });
  await stubStatus(page, { completed: true });

  await page.goto("/kosarica");
  await dismissCookies(page);

  await expect(page.locator(".kos-empty")).toContainText("Vaša košarica je prazna");
  // and it stops asking about an order it has already acted on
  await expect
    .poll(() => page.evaluate((k) => localStorage.getItem(k), PENDING))
    .toBeNull();
});

test("an abandoned checkout leaves the cart exactly as it was", async ({ page }) => {
  await seed(page, { id: "gid://shopify/DraftOrder/1", token: "a".repeat(32), at: Date.now() });
  await stubStatus(page, { completed: false });

  await page.goto("/kosarica");
  await dismissCookies(page);

  await expect(page.locator(".kos-line-title")).toHaveText("Testna stavka");
  // still pending, so the next visit asks again
  expect(await page.evaluate((k) => localStorage.getItem(k), PENDING)).not.toBeNull();
});

test("a pending order older than the TTL is dropped without touching the cart", async ({ page }) => {
  const old = Date.now() - 15 * 24 * 60 * 60 * 1000;
  await seed(page, { id: "gid://shopify/DraftOrder/1", token: "a".repeat(32), at: old });

  let asked = false;
  await page.route("**/api/checkout/status**", (route) => {
    asked = true;
    return route.fulfill({ status: 200, contentType: "application/json", body: '{"completed":true}' });
  });

  await page.goto("/kosarica");
  await dismissCookies(page);

  await expect(page.locator(".kos-line-title")).toHaveText("Testna stavka");
  expect(asked).toBe(false);
  await expect.poll(() => page.evaluate((k) => localStorage.getItem(k), PENDING)).toBeNull();
});

test("no pending order means no status call at all", async ({ page }) => {
  await seed(page, null);
  let asked = false;
  await page.route("**/api/checkout/status**", (route) => {
    asked = true;
    return route.fulfill({ status: 200, contentType: "application/json", body: '{"completed":true}' });
  });

  await page.goto("/kosarica");
  await dismissCookies(page);
  await expect(page.locator(".kos-line-title")).toHaveText("Testna stavka");
  expect(asked).toBe(false);
});

test("the status endpoint refuses to answer without an id and token", async ({ request }) => {
  const res = await request.get("/api/checkout/status");
  expect(res.status()).toBe(400);
});

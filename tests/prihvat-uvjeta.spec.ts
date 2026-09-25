import { test, expect } from "@playwright/test";

// The cart is the single place where the buyer is shown, and accepts, the
// legal terms: the product pages and the configurator say nothing about the
// right of withdrawal any more.
//
// The drawer stays a plain preview of what was just added — the question is
// asked on /kosarica, where the order is actually placed.

const dismissCookies = async (page: import("@playwright/test").Page) => {
  const accept = page.getByText("Prihvaćam");
  if (await accept.isVisible().catch(() => false)) await accept.click();
};

test("cart page: checkout is gated on the terms checkbox", async ({ page }) => {
  await page.goto("/racunala/gaming/entry-level-racunalo");
  await dismissCookies(page);
  await page.getByRole("button", { name: "Dodaj u košaricu" }).click();

  await page.getByRole("link", { name: "Pregled košarice →" }).click();
  await page.waitForURL("**/kosarica");

  const terms = page.locator(".kos-summary .kos-terms");
  const box = terms.locator("input[type=checkbox]");
  const checkoutBtn = page.getByRole("button", { name: /Na blagajnu/ });

  // unticked on arrival, and the button says so without swallowing the click
  await expect(box).not.toBeChecked();
  await expect(checkoutBtn).toHaveClass(/is-locked/);
  await expect(page.locator(".kos-terms-hint")).toHaveCount(0);

  // clicking anyway explains why nothing happened — inline, not a modal
  await checkoutBtn.click();
  await expect(page.locator(".kos-summary .kos-terms-hint")).toHaveText(
    "Za nastavak potvrdite da prihvaćate uvjete."
  );
  await expect(box).toHaveAttribute("aria-invalid", "true");
  expect(new URL(page.url()).pathname).toBe("/kosarica");

  await box.check();
  await expect(checkoutBtn).not.toHaveClass(/is-locked/);
});

test("cart page: the checkbox links to all three documents and to the exceptions", async ({ page }) => {
  await page.goto("/racunala/gaming/entry-level-racunalo");
  await dismissCookies(page);
  await page.getByRole("button", { name: "Dodaj u košaricu" }).click();
  await page.goto("/kosarica");

  const terms = page.locator(".kos-summary .kos-terms");
  await expect(terms).toContainText("Pročitao/la sam i prihvaćam");

  for (const href of ["/uvjeti", "/privatnost", "/raskid", "/raskid#iznimke"]) {
    const link = terms.locator(`a[href="${href}"]`);
    await expect(link).toBeVisible();
    // reading the terms must not cost the buyer their cart
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", /noopener/);
  }
});

test("the drawer stays a preview: it asks nothing, the cart page does", async ({ page }) => {
  await page.goto("/racunala/gaming/entry-level-racunalo");
  await dismissCookies(page);
  await page.getByRole("button", { name: "Dodaj u košaricu" }).click();

  // nothing to accept while the buyer is still shopping
  await expect(page.locator(".rs-cart-panel")).toBeVisible();
  await expect(page.locator(".rs-cart-panel .kos-terms")).toHaveCount(0);

  await page.getByRole("link", { name: "Pregled košarice →" }).click();
  await page.waitForURL("**/kosarica");

  const box = page.locator(".kos-summary .kos-terms input[type=checkbox]");
  await expect(box).toHaveCount(1);
  await box.check();

  // a fresh load starts unticked: the cart persists, the acceptance doesn't
  await page.reload();
  await expect(page.locator(".kos-summary .kos-terms input[type=checkbox]")).not.toBeChecked();
});

test("no withdrawal-right notice is left on the product pages or the configurator", async ({ page }) => {
  await page.goto("/racunala/gaming/entry-level-racunalo");
  await dismissCookies(page);
  await expect(page.locator(".rs-pdp")).not.toContainText("jednostrani raskid");

  await page.goto("/periferija/tipkovnice");
  await expect(page.locator("body")).not.toContainText("Pravo na povrat u roku od 14 dana");
});

// The cart page is the only place an order can actually be placed from —
// the drawer must not offer a direct path to Shopify checkout.
test("cart drawer routes to the cart page instead of straight to checkout", async ({ page }) => {
  await page.goto("/racunala/gaming/entry-level-racunalo");
  await dismissCookies(page);

  await page.getByRole("button", { name: "Dodaj u košaricu" }).click();
  await expect(page.getByRole("link", { name: "Pregled košarice →" })).toBeVisible({ timeout: 8000 });
  await expect(page.getByRole("button", { name: /Na blagajnu/ })).toHaveCount(0);

  // the header cart button re-opens the same preview drawer (it does not
  // navigate) — the drawer's footer link is the route to the full page
  await page.locator(".rs-cart-x").click();
  await expect(page.getByRole("link", { name: "Pregled košarice →" })).toBeHidden();
  await page.locator(".rs-cart-btn").click();
  await expect(page.getByRole("link", { name: "Pregled košarice →" })).toBeVisible();
  expect(new URL(page.url()).pathname).not.toBe("/kosarica");
});

test("the exceptions section on /raskid is reachable by the anchor the cart links to", async ({ page }) => {
  await page.goto("/raskid#iznimke");
  await dismissCookies(page);
  const heading = page.locator("#iznimke");
  await expect(heading).toHaveText("2. Iznimke od prava na jednostrani raskid");
  // cleared by the sticky header rather than hidden behind it
  const top = await heading.boundingBox();
  expect(top!.y).toBeGreaterThan(60);
});

test("the documents the checkbox accepts carry a visible date at the bottom", async ({ page }) => {
  for (const path of ["/uvjeti", "/privatnost", "/raskid"]) {
    await page.goto(path);
    await dismissCookies(page);
    await expect(page.locator(".legal-updated")).toContainText("Zadnje ažurirano:");
  }
});

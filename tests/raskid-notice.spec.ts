import { test, expect } from "@playwright/test";

// uvjeti-jednostrani-raskid-spec.md section 3: the withdrawal-right consent
// checkbox on the configurator's review step must be unchecked by default
// and required before "Dodaj u košaricu" can be used.

test("configurator: add-to-cart is gated on the raskid consent checkbox", async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto("/konfigurator");
  const acceptBtn = page.getByText("Prihvaćam");
  if (await acceptBtn.isVisible().catch(() => false)) await acceptBtn.click();

  await page.getByAltText("Intel").first().click();
  const steps = ["Procesor", "Matična ploča", "Radna memorija", "Grafička kartica", "Pohrana", "Kućište", "Napajanje", "Hladnjak procesora"];
  for (const label of steps) {
    await expect(page.locator("h2", { hasText: label }).first()).toBeVisible({ timeout: 8000 });
    await page.locator('[data-testid="active-card"]').first().click();
  }
  await expect(page.locator("h2", { hasText: "Operativni sustav" }).first()).toBeVisible({ timeout: 8000 });
  await page.locator('[data-testid="active-card"]').first().click();

  const addBtn = page.getByRole("button", { name: "🛒 Dodaj u košaricu" });
  await expect(addBtn).toBeVisible({ timeout: 8000 });

  // unchecked by default -> button disabled
  await expect(addBtn).toBeDisabled();

  const consentCheckbox = page.locator('input[type="checkbox"]').last();
  await expect(consentCheckbox).not.toBeChecked();

  await consentCheckbox.check();
  await expect(addBtn).toBeEnabled();

  // adding the build opens the drawer, which now routes to the cart page
  // rather than straight to Shopify checkout
  await addBtn.click();
  await page.getByRole("link", { name: "U košaricu →" }).click();
  await page.waitForURL("**/kosarica");

  // the cart page carries the withdrawal-right wording on the terms
  // checkbox, and checkout is gated on it
  const checkoutBtn = page.getByRole("button", { name: /Na blagajnu/ });
  await expect(checkoutBtn).toBeDisabled();
  await expect(page.locator(".kos-terms")).toContainText("po narudžbi to pravo ne postoji");

  await page.locator(".kos-terms input[type=checkbox]").check();
  await expect(checkoutBtn).toBeEnabled();
});

// The cart page is the only place an order can actually be placed from —
// the drawer must not offer a direct path to Shopify checkout anymore.
test("cart drawer routes to the cart page instead of straight to checkout", async ({ page }) => {
  await page.goto("/racunala/gaming/entry-level-racunalo");
  const acceptBtn = page.getByText("Prihvaćam");
  if (await acceptBtn.isVisible().catch(() => false)) await acceptBtn.click();

  await page.getByRole("button", { name: "Dodaj u košaricu" }).click();
  await expect(page.getByRole("link", { name: "U košaricu →" })).toBeVisible({ timeout: 8000 });
  await expect(page.getByRole("button", { name: /Na blagajnu/ })).toHaveCount(0);
});

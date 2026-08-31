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

  // adding the build shows the withdrawal-right notice on the cart line
  await addBtn.click();
  await expect(page.getByText("Bez prava na jednostrani raskid").first()).toBeVisible({ timeout: 8000 });
});

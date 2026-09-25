import { test, expect, type Page } from "@playwright/test";
import { ASSEMBLY_FEE, FREE_SHIPPING_FROM, SHIPPING_FEE } from "../lib/pricing";

const dismissCookies = async (page: Page) => {
  const accept = page.getByText("Prihvaćam");
  if (await accept.isVisible().catch(() => false)) await accept.click();
};

const eur = (n: number) => new Intl.NumberFormat("hr-HR", { style: "currency", currency: "EUR" }).format(n);
const readTotal = async (page: Page) => {
  const m = (await page.locator("body").innerText()).match(/UKUPNA CIJENA\s*\n?\s*([\d.,]+)\s*€/);
  return m ? Number(m[1].replace(/\./g, "").replace(",", ".")) : NaN;
};

/** Walks to the OS step, choosing the focused card at each build step. */
const buildThroughToOs = async (page: Page) => {
  await page.goto("/konfigurator");
  await dismissCookies(page);
  await page.getByAltText("Intel").first().click();
  for (const label of [
    "Procesor", "Matična ploča", "Radna memorija", "Grafička kartica",
    "Pohrana", "Kućište", "Napajanje", "Hladnjak procesora",
  ]) {
    await expect(page.locator("h2", { hasText: label }).first()).toBeVisible({ timeout: 8000 });
    await page.locator('[data-testid="active-card"]').first().click();
  }
  await expect(page.locator("h2", { hasText: "Operativni sustav" }).first()).toBeVisible({ timeout: 8000 });
};

// --- 1. the assembly fee ---------------------------------------------------

// It used to appear only at the review step: the total jumped by 200 EUR at
// the end with nothing on screen to account for it.
test("the assembly fee is in the total, and named, from the first step", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/konfigurator");
  await dismissCookies(page);

  expect(await readTotal(page)).toBeCloseTo(ASSEMBLY_FEE, 2);
  const sidebar = await page.locator("body").innerText();
  expect(sidebar).toContain("Sklapanje i testiranje");
  expect(sidebar).toContain(eur(ASSEMBLY_FEE));
  // and it says what it buys
  expect(sidebar).toMatch(/testiranje pod opterećenjem/i);
});

test("the configured build carries the fee into the cart, as its own line", async ({ page }) => {
  test.setTimeout(90_000);
  await buildThroughToOs(page);
  await page.getByRole("button", { name: /Bez operativnog sustava/ }).first().click();
  const configuratorTotal = await readTotal(page);

  await page.getByRole("button", { name: "🛒 Dodaj u košaricu" }).click();
  await page.goto("/kosarica");
  await dismissCookies(page);

  // the cart charges exactly what the configurator quoted
  const subtotal = Number(
    ((await page.locator(".kos-summary").innerText()).match(/Međuzbroj[^\n]*\n([\d.,]+)/) || [])[1]
      ?.replace(/\./g, "")
      .replace(",", ".")
  );
  expect(subtotal).toBeCloseTo(configuratorTotal, 2);

  // ...and the item says where the money went, in one piece
  await page.locator(".kos-line details summary").first().click();
  const rows = await page.locator(".kos-items li").allInnerTexts();
  expect(rows.at(-1)).toBe(`Sklapanje i testiranje (${eur(ASSEMBLY_FEE)})`);
  // a comma-split list used to tear "200,00 €" in half
  for (const row of rows) expect(row.trim()).not.toMatch(/^\d{2}\s?€\)?$/);
});

// --- 2. nothing costly may look chosen before it is chosen -----------------

// The grid called the merely-focused card "selected", so the recommended
// option of every step announced itself as picked — on the OS step that was
// a 149,99 EUR licence, while the total said otherwise.
test("no paid option is presented as chosen before it is clicked", async ({ page }) => {
  test.setTimeout(90_000);
  await buildThroughToOs(page);

  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(/\bODABRANO\b/);
  expect(body).toContain("Bez operativnog sustava — 0,00 €");

  // the licence is on screen but not in the price
  const before = await readTotal(page);
  await page.getByRole("button", { name: /Bez operativnog sustava/ }).first().click();
  expect(await readTotal(page)).toBeCloseTo(before, 2);
});

// --- 3. one story about the operating system ------------------------------

test("the OS is described the same way everywhere", async ({ page }) => {
  for (const path of ["/jamstvo", "/faq", "/konfigurator"]) {
    await page.goto(path);
    await dismissCookies(page);
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body, `stale OS claim on ${path}`).not.toContain("bez aktivirane licence");
  }

  await page.goto("/jamstvo");
  await expect(page.locator(".legal-content")).toContainText("nije uključen u cijenu");
});

// --- 5. one shipping rule -------------------------------------------------

test("the cart charges shipping by the published rule", async ({ page }) => {
  // a peripheral is cheap enough to fall under the threshold
  await page.goto("/periferija/tipkovnice/razer-huntsman-v3-pro");
  await dismissCookies(page);
  await page.getByRole("button", { name: "Dodaj u košaricu" }).click();
  await page.goto("/kosarica");

  const summary = page.locator(".kos-summary");
  const subtotal = Number(
    ((await summary.innerText()).match(/Međuzbroj[^\n]*\n([\d.,]+)/) || [])[1]?.replace(/\./g, "").replace(",", ".")
  );
  expect(subtotal).toBeLessThan(FREE_SHIPPING_FROM);
  await expect(summary).toContainText(eur(SHIPPING_FEE));
  await expect(summary).toContainText(`Besplatna dostava za narudžbe od ${eur(FREE_SHIPPING_FROM)}`);

  // the total includes it, rather than deferring to checkout
  await expect(summary).toContainText(eur(subtotal + SHIPPING_FEE));
  // and the old hedge is gone
  await expect(summary).not.toContainText("izračunava se na blagajni");
});

test("the delivery page quotes the same two figures", async ({ page }) => {
  await page.goto("/dostava");
  await dismissCookies(page);
  const body = page.locator(".legal-content");
  await expect(body).toContainText(eur(FREE_SHIPPING_FROM));
  await expect(body).toContainText(eur(SHIPPING_FEE));
  // personal pickup is switched off in Shopify, so the page must not offer it
  await expect(body).not.toContainText("Osobno preuzimanje");
});

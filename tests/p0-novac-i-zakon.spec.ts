import { test, expect, type Page } from "@playwright/test";
import { ASSEMBLY_FEE, FREE_SHIPPING_FROM, SHIPPING_FEE } from "../lib/pricing";

const dismissCookies = async (page: Page) => {
  const accept = page.getByText("Prihvaćam");
  if (await accept.isVisible().catch(() => false)) await accept.click();
};

const eur = (n: number) => new Intl.NumberFormat("hr-HR", { style: "currency", currency: "EUR" }).format(n);
// The sidebar figure, under whichever of its two headings is showing: the
// parts while the build is being put together, the order's price at review.
const readTotal = async (page: Page) => {
  const m = (await page.locator("body").innerText()).match(
    /(?:UKUPNA CIJENA|CIJENA KOMPONENTI)\s*\n?\s*([\d.,]+)\s*€/
  );
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

// The fee is shown at the review step, so that is where it enters the figure.
// The two must not be separable: a total carrying 200 EUR that nothing on
// screen accounts for is one failure, and a figure that grows at the end for
// no stated reason is the other. The label is what keeps them honest — the
// running number is CIJENA KOMPONENTI and is exactly that, and only the review
// step says UKUPNA CIJENA.
test("the running figure is the parts, and says so", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/konfigurator");
  await dismissCookies(page);

  const sidebar = await page.locator("body").innerText();
  expect(sidebar).toContain("CIJENA KOMPONENTI");
  expect(sidebar).not.toContain("UKUPNA CIJENA");
  // nothing is charged for yet, so nothing is counted
  expect(await readTotal(page)).toBeCloseTo(0, 2);
  expect(sidebar).not.toContain("Sklapanje i testiranje");
});

test("the fee appears with the total it belongs to, and explains itself", async ({ page }) => {
  test.setTimeout(90_000);
  await buildThroughToOs(page);

  // still mid-build: parts only, and the fee is nowhere
  const duringBuild = await page.locator("body").innerText();
  expect(duringBuild).toContain("CIJENA KOMPONENTI");
  expect(duringBuild).not.toContain("Sklapanje i testiranje");
  const parts = await readTotal(page);

  await page.getByRole("button", { name: /Bez operativnog sustava/ }).first().click();

  const atReview = await page.locator("body").innerText();
  expect(atReview).toContain("UKUPNA CIJENA");
  expect(atReview).toContain("Sklapanje i testiranje");
  expect(atReview).toContain(eur(ASSEMBLY_FEE));
  // and it says what it buys
  expect(atReview).toMatch(/testiranje i pakiranje/i);
  // the figure grew by exactly the fee, and the fee is on screen to say why
  expect(await readTotal(page)).toBeCloseTo(parts + ASSEMBLY_FEE, 2);
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
  // Every row has to be a whole component. The list used to be one joined
  // string the cart split again, and every separator tried turned up inside
  // the data itself: the comma in "200,00 €", then " · " in variant titles
  // like "Crni · 3200 MHz CL22". Balanced brackets catch a torn row whatever
  // the separator happened to be.
  for (const row of rows) {
    const open = (row.match(/\(/g) || []).length;
    const close = (row.match(/\)/g) || []).length;
    expect(open, `torn component row: ${row}`).toBe(close);
  }
  // and a name carrying a middle dot comes through in one piece
  const withDot = rows.find((r) => r.includes(" · "));
  if (withDot) expect(withDot).toMatch(/\)$/);
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

  // The licence is on screen but not in the price. Declining it moves on to
  // the review step, where the assembly fee joins the figure — so what proves
  // the licence was never counted is that the figure grows by the fee and by
  // nothing else.
  const parts = await readTotal(page);
  await page.getByRole("button", { name: /Bez operativnog sustava/ }).first().click();
  expect(await readTotal(page)).toBeCloseTo(parts + ASSEMBLY_FEE, 2);
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

// It is not a component, it is what we do to them, so it closes the summary
// rather than opening it.
test("the assembly fee is the last row of the summary, not the first", async ({ page }) => {
  test.setTimeout(90_000);
  await buildThroughToOs(page);
  await page.getByRole("button", { name: /Bez operativnog sustava/ }).first().click();

  const body = await page.locator("body").innerText();
  const fee = body.indexOf("UVIJEK UKLJUČENO");
  const firstPart = body.indexOf("PROCESOR");
  const lastPart = body.lastIndexOf("HLAĐENJE");

  expect(firstPart).toBeGreaterThan(-1);
  expect(fee).toBeGreaterThan(lastPart);
  expect(fee).toBeGreaterThan(firstPart);
});

// "Windows installed but not activated" was never what a buyer gets, and the
// step now says what they do get, and whose problem it is afterwards.
test("the no-OS choice says the machine ships without one", async ({ page }) => {
  test.setTimeout(90_000);
  await buildThroughToOs(page);

  const note = await page.locator("body").innerText();
  expect(note).not.toContain("bez aktivirane licence");
  expect(note).toContain("bez operativnog sustava");
  expect(note).toMatch(/na vlastitu odgovornost/);
  expect(note).toMatch(/ne preporučujemo/i);
  // and the reason the hardware is not in question
  expect(note).toMatch(/sastavimo i testiramo/);
});

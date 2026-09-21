import { test, expect, type Page } from "@playwright/test";

const dismissCookies = async (page: Page) => {
  const accept = page.getByText("Prihvaćam");
  if (await accept.isVisible().catch(() => false)) await accept.click();
};

const titles = (page: Page) => page.locator(".rs-card h4").allInnerTexts();
const prices = (page: Page) =>
  page
    .locator(".rs-card .rs-price")
    .evaluateAll((els) =>
      els.map((e) => Number((e.textContent || "").replace(/[^\d,]/g, "").replace(",", ".")))
    );

test("searching a tier name returns exactly that tier", async ({ page }) => {
  await page.goto("/racunala");
  await dismissCookies(page);
  await page.fill(".rs-search input", "starter");
  await expect(page.locator(".rs-card")).toHaveCount(3);
  expect(await titles(page)).toEqual(["Starter I", "Starter II", "Starter III"]);
});

test("search matches the spec line, not just the name", async ({ page }) => {
  await page.goto("/racunala");
  await dismissCookies(page);
  await page.fill(".rs-search input", "ryzen");
  const found = await titles(page);
  expect(found.length).toBeGreaterThan(0);
  // none of these say "Ryzen" in their name — the match came from the specs
  for (const t of found) expect(t.toLowerCase()).not.toContain("ryzen");
});

test("every word has to match, so more words narrow the result", async ({ page }) => {
  await page.goto("/racunala");
  await dismissCookies(page);
  await page.fill(".rs-search input", "office");
  const broad = (await titles(page)).length;
  await page.fill(".rs-search input", "office max");
  const narrow = await titles(page);
  expect(narrow.length).toBeLessThan(broad);
  expect(narrow).toEqual(["Office Max I", "Office Max II"]);
});

test("sorting by price runs both ways and the count follows", async ({ page }) => {
  await page.goto("/racunala");
  await dismissCookies(page);

  await page.selectOption("#rs-sort-select", "price-asc");
  const asc = await prices(page);
  expect(asc).toEqual([...asc].sort((a, b) => a - b));

  await page.selectOption("#rs-sort-select", "price-desc");
  const desc = await prices(page);
  expect(desc).toEqual([...desc].sort((a, b) => b - a));

  // the same products, just reordered
  expect(desc.length).toBe(asc.length);
  await expect(page.locator(".rs-coll-count")).toHaveText(`${asc.length} proizvoda`);
});

test("sorting and searching combine", async ({ page }) => {
  await page.goto("/racunala");
  await dismissCookies(page);
  await page.fill(".rs-search input", "office");
  await page.selectOption("#rs-sort-select", "price-asc");
  const found = await prices(page);
  expect(found.length).toBe(10);
  expect(found).toEqual([...found].sort((a, b) => a - b));
});

test("a search with no hits says so and offers a way back", async ({ page }) => {
  await page.goto("/racunala/office");
  await dismissCookies(page);
  // a real tier, just not in this category
  await page.fill(".rs-search input", "ultimate");
  const empty = page.locator(".rs-empty");
  await expect(empty).toContainText('Nema rezultata za "ultimate"');
  await expect(empty.getByRole("link", { name: "Pretraži sva računala" })).toBeVisible();

  await empty.getByRole("button", { name: "Poništi filtere" }).click();
  await expect(page.locator(".rs-card").first()).toBeVisible();
  await expect(page.locator(".rs-search input")).toHaveValue("");
});

test("the count reflects what is actually on screen", async ({ page }) => {
  await page.goto("/racunala");
  await dismissCookies(page);
  await page.fill(".rs-search input", "starter");
  await expect(page.locator(".rs-coll-count")).toHaveText("3 proizvoda");
  // matching is on substrings, so "starter i" still hits II and III — narrow
  // it the way someone actually would
  await page.fill(".rs-search input", "starter iii");
  await expect(page.locator(".rs-coll-count")).toHaveText("1 proizvod");
});

test("the toolbar is usable at phone width", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true });
  await page.goto("/racunala");
  await dismissCookies(page);

  const search = page.locator(".rs-search input");
  const select = page.locator("#rs-sort-select");
  await expect(search).toBeVisible();
  await expect(select).toBeVisible();

  // nothing spills out of the viewport
  for (const el of [search, select]) {
    const box = (await el.boundingBox())!;
    expect(box.x).toBeGreaterThanOrEqual(0);
    expect(box.x + box.width).toBeLessThanOrEqual(390);
  }
  expect(await page.evaluate(() => document.documentElement.scrollWidth)).toBeLessThanOrEqual(390);

  await page.close();
});

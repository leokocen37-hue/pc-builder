import { test, expect, type Page } from "@playwright/test";

const dismissCookies = async (page: Page) => {
  const accept = page.getByText("Prihvaćam");
  if (await accept.isVisible().catch(() => false)) await accept.click();
};

test("/racunala/office lists the office builds under its own tab", async ({ page }) => {
  await page.goto("/racunala/office");
  await dismissCookies(page);

  await expect(page.locator("h1")).toHaveText("Uredska računala");
  // the tab is present alongside the other two and marked as the current page
  await expect(page.locator("a.rs-tab.active")).toHaveText("Uredska računala");
  await expect(page.getByText("Office Start I", { exact: true })).toBeVisible();
  await expect(page.getByText("Office Max II", { exact: true })).toBeVisible();
});

test("/racunala includes the office builds alongside gaming and workstations", async ({ page }) => {
  await page.goto("/racunala");
  await dismissCookies(page);
  await expect(page.getByText("Office Start I", { exact: true })).toBeVisible();
});

test("office product pages resolve under their category", async ({ page }) => {
  await page.goto("/racunala/office/office-start-i");
  await dismissCookies(page);
  await expect(page.locator(".rs-pdp-info h1")).toHaveText("Office Start I");
  await expect(page.getByRole("button", { name: "Dodaj u košaricu" })).toBeVisible();
});

// Office Start I and II share a CPU and a GPU and differ only in RAM, so the
// card spec line has to get as far as the RAM or the two look identical.
test("cards tell apart two builds that differ only in RAM", async ({ page }) => {
  await page.goto("/racunala/office");
  await dismissCookies(page);

  const specOf = async (title: string) =>
    page
      .locator(".rs-card")
      .filter({ has: page.getByRole("heading", { name: title, exact: true }) })
      .locator(".rs-card-specs")
      .innerText();

  const first = await specOf("Office Start I");
  const second = await specOf("Office Start II");
  expect(first).toContain("8GB");
  expect(second).toContain("16GB");
  expect(first).not.toBe(second);
});

// "od X €" is a price claim, so it has to be the cheapest in the whole
// collection — not the cheapest of the six the homepage row happens to fetch,
// which put 999,99 € on a category whose entry model is 699,99 €.
//
// Office is the cheapest category, so the homepage's figure has to land on an
// office build. (It used to be read off a mobile-only tile; that tile is gone
// with the mobile homepage now being the desktop layout scaled down.)
test("the homepage quotes the cheapest office build, not the cheapest shown", async ({ page }) => {
  await page.goto("/racunala/office");
  await dismissCookies(page);
  const prices = await page
    .locator(".rs-card .rs-price")
    .evaluateAll((els) =>
      els.map((e) => Number((e.textContent || "").replace(/[^\d,]/g, "").replace(",", ".")))
    );
  const cheapest = Math.min(...prices);
  expect(cheapest).toBeGreaterThan(0);

  await page.goto("/");
  await dismissCookies(page);
  const quoted = Number(
    ((await page.locator(".rs-value-strip-inner").innerText()).match(/Računala od\s*([\d.,]+)/) || [])[1]
      ?.replace(/\./g, "")
      .replace(",", ".")
  );
  expect(quoted).toBeCloseTo(cheapest, 2);
});

// Shopify returns the office collection newest-first, which is Max -> Start.
// The category has to read cheapest-first, and the homepage row — which shows
// only the first few — has to open on a Start rather than never reaching one.
test("office builds read cheapest-first: Start, Plus, Pro, Business, Max", async ({ page }) => {
  await page.goto("/racunala/office");
  await dismissCookies(page);

  const titles = await page.locator(".rs-card h4").allInnerTexts();
  expect(titles).toEqual([
    "Office Start I", "Office Start II",
    "Office Plus I", "Office Plus II",
    "Office Pro I", "Office Pro II",
    "Office Business I", "Office Business II",
    "Office Max I", "Office Max II",
  ]);

  const prices = await page
    .locator(".rs-card .rs-price")
    .evaluateAll((els) =>
      els.map((e) => Number((e.textContent || "").replace(/[^\d,]/g, "").replace(",", ".")))
    );
  expect(prices).toEqual([...prices].sort((a, b) => a - b));
});

test("the homepage office row starts at the cheapest build", async ({ page }) => {
  await page.goto("/");
  await dismissCookies(page);
  const first = page.locator(".rs-card h4", { hasText: "Office" }).first();
  await expect(first).toHaveText("Office Start I");
});

// The hand-set Shopify order of the other categories is a merchandising
// decision — sorting office must not have swept it up.
test("gaming keeps the order the store returns", async ({ page }) => {
  await page.goto("/racunala/gaming");
  await dismissCookies(page);
  const titles = await page.locator(".rs-card h4").allInnerTexts();
  expect(titles.slice(0, 2)).toEqual(["Starter I", "Performance I"]);
});

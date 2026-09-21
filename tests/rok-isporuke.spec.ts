import { test, expect, type Page } from "@playwright/test";

// Every PC is assembled after the order, so the wait has to be stated up
// front — on the product page, not discovered at checkout — and the same
// figure has to appear in the terms. Peripherals ship from stock and must not
// be quoted a build time.

const dismissCookies = async (page: Page) => {
  const accept = page.getByText("Prihvaćam");
  if (await accept.isVisible().catch(() => false)) await accept.click();
};

const BUILD_AND_SHIP = "Izrada i testiranje 5–10 radnih dana + dostava 1–2 radna dana";

test("a PC product page states the build and the delivery time", async ({ page }) => {
  await page.goto("/racunala/office/office-start-i");
  await dismissCookies(page);
  await expect(page.locator(".rs-pdp-delivery")).toContainText(BUILD_AND_SHIP);
});

test("a peripheral is quoted shipping only, never a build time", async ({ page }) => {
  await page.goto("/periferija/tipkovnice/razer-huntsman-v3-pro");
  await dismissCookies(page);
  const row = page.locator(".rs-pdp-delivery");
  await expect(row).toContainText("Dostava 1–2 radna dana");
  await expect(row).not.toContainText("Izrada");
});

test("the terms carry the same lead time as the product pages", async ({ page }) => {
  await page.goto("/uvjeti");
  await dismissCookies(page);
  const isporuka = page.locator(".legal-content");
  await expect(isporuka).toContainText("izrada i testiranje 5–10 radnih dana + dostava 1–2 radna dana");
  // the 30-day statutory backstop belongs next to the estimate
  await expect(isporuka).toContainText("30 dana od sklapanja ugovora");
});

test("the delivery page and the FAQ quote the same figure", async ({ page }) => {
  await page.goto("/dostava");
  await dismissCookies(page);
  await expect(page.locator(".legal-content")).toContainText(BUILD_AND_SHIP);

  await page.goto("/faq");
  await dismissCookies(page);
  await expect(page.locator("body")).toContainText("Izrada i testiranje traju 5–10 radnih dana");
});

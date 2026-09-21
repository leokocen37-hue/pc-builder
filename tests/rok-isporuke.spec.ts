import { test, expect, type Page } from "@playwright/test";

// Every PC is assembled after the order, so the wait has to be stated up
// front — on the product page, not discovered at checkout — and the same
// figure has to appear in the terms. Peripherals ship from stock and must not
// be quoted a build time.

const dismissCookies = async (page: Page) => {
  const accept = page.getByText("Prihvaćam");
  if (await accept.isVisible().catch(() => false)) await accept.click();
};

const BUILD_AND_SHIP = "Izrada i testiranje 4–8 radnih dana + dostava 1–2 radna dana";

test("a PC product page states the build and the delivery time", async ({ page }) => {
  await page.goto("/racunala/office/office-start-i");
  await dismissCookies(page);
  await expect(page.locator(".rs-pdp-delivery")).toContainText(BUILD_AND_SHIP);
});

test("a peripheral is quoted shipping only, never a build time", async ({ page }) => {
  await page.goto("/periferija/tipkovnice/razer-huntsman-v3-pro");
  await dismissCookies(page);
  const row = page.locator(".rs-pdp-delivery");
  await expect(row).toContainText("Isporuka 3–7 radnih dana");
  await expect(row).not.toContainText("Izrada");
});

test("the terms carry the same lead time as the product pages", async ({ page }) => {
  await page.goto("/uvjeti");
  await dismissCookies(page);
  const isporuka = page.locator(".legal-content");
  await expect(isporuka).toContainText("izrada i testiranje 4–8 radnih dana + dostava 1–2 radna dana");
  // peripherals are quoted as one total there too, not as the PCs' two stages
  await expect(isporuka).toContainText("3–7 radnih dana");
  // the 30-day statutory backstop belongs next to the estimate
  await expect(isporuka).toContainText("30 dana od sklapanja ugovora");
});

test("the delivery page and the FAQ quote the same figure", async ({ page }) => {
  await page.goto("/dostava");
  await dismissCookies(page);
  await expect(page.locator(".legal-content")).toContainText(BUILD_AND_SHIP);

  await page.goto("/faq");
  await dismissCookies(page);
  await expect(page.locator("body")).toContainText("Izrada i testiranje traju 4–8 radnih dana");
});

// PayPal was listed as a payment method on six surfaces before it existed.
// It is not coming, so nothing may offer it — a payment method a buyer picks
// and then can't use at checkout is worse than one that was never mentioned.
test("no page offers PayPal", async ({ page }) => {
  for (const path of ["/", "/dostava", "/uvjeti", "/privatnost", "/kolacici", "/faq"]) {
    await page.goto(path);
    await dismissCookies(page);
    const body = (await page.locator("body").innerText()).toLowerCase();
    expect(body, `PayPal still mentioned on ${path}`).not.toContain("paypal");
  }
});

test("card payment is still named, on the pages that promise it", async ({ page }) => {
  await page.goto("/dostava");
  await dismissCookies(page);
  await expect(page.locator(".legal-content")).toContainText("Visa, Mastercard ili Maestro");

  await page.goto("/uvjeti");
  await dismissCookies(page);
  await expect(page.locator(".legal-content")).toContainText("Visa, Mastercard i Maestro");
});

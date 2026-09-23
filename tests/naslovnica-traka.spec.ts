import { test, expect, type Page } from "@playwright/test";

const dismissCookies = async (page: Page) => {
  const accept = page.getByText("Prihvaćam");
  if (await accept.isVisible().catch(() => false)) await accept.click();
};

// The loop shifts the track by exactly one copy of the logo list and starts
// over, so the copies that haven't been shifted away must still cover the
// strip. A fixed pair of copies didn't: one copy is ~860px, so the row ran
// out partway across the screen and visibly ended mid-scroll.
for (const width of [1280, 1920, 2560]) {
  test(`brand strip never runs out mid-scroll at ${width}px`, async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width, height: 900 } });
    await page.goto("/");
    await dismissCookies(page);
    await page.waitForSelector(".rs-marquee-group img");
    // let the images lay out so the copy count settles on its measured value
    await page.waitForTimeout(1500);

    // sample the whole animation cycle rather than whatever moment we land on
    const worst = await page.evaluate(async () => {
      const wrap = document.querySelector(".rs-marquee") as HTMLElement;
      const track = document.querySelector(".rs-marquee-track") as HTMLElement;
      const duration = parseFloat(getComputedStyle(track).animationDuration);
      let worst = Infinity;
      for (let i = 0; i <= 40; i++) {
        track.style.animationDelay = `-${((duration * i) / 40).toFixed(3)}s`;
        await new Promise((r) => requestAnimationFrame(r));
        worst = Math.min(worst, track.getBoundingClientRect().right - wrap.getBoundingClientRect().right);
      }
      track.style.animationDelay = "";
      return worst;
    });

    expect(worst).toBeGreaterThanOrEqual(0);
    await page.close();
  });
}

// The figure was a hand-set placeholder that drifted to 599 EUR while the
// cheapest machine in the shop cost 699,99 — a price claim nothing backed.
test("the homepage quotes a starting price that something is actually sold at", async ({ page }) => {
  await page.goto("/racunala");
  await dismissCookies(page);
  const prices = await page
    .locator(".rs-card .rs-price")
    .evaluateAll((els) =>
      els.map((e) => Number((e.textContent || "").replace(/[^\d,]/g, "").replace(",", ".")))
    );
  const cheapest = Math.min(...prices.filter((n) => n > 0));

  await page.goto("/");
  await dismissCookies(page);
  const strip = page.locator(".rs-value-strip-inner");
  const quoted = Number(
    ((await strip.innerText()).match(/Računala od\s*([\d.,]+)/) || [])[1]?.replace(/\./g, "").replace(",", ".")
  );
  expect(quoted).toBeCloseTo(cheapest, 2);
});

test("the hero no longer repeats the build time from the strip below it", async ({ page }) => {
  await page.goto("/");
  await dismissCookies(page);
  const stats = page.locator(".rs-stats");
  await expect(stats).toContainText("Besplatna");
  await expect(stats).not.toContainText("sastavljanje");
  // ...and the strip is still the place that states it in full
  await expect(page.locator(".rs-value-strip-inner")).toContainText("Izrada 4–8 radnih dana");
});

test("the why-us section carries the free shipping threshold, in one row", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 1400, height: 1000 } });
  await page.goto("/");
  await dismissCookies(page);

  const why = page.locator(".rs-why");
  await expect(why.locator(".rs-why-item")).toHaveCount(4);
  await expect(why).toContainText("Besplatna dostava iznad 500,00 €");

  // a fourth card must not be stranded on a row of its own
  const rows = await why.evaluate(
    (el) => new Set([...el.querySelectorAll(".rs-why-item")].map((i) => Math.round(i.getBoundingClientRect().top))).size
  );
  expect(rows).toBe(1);
  await page.close();
});

test("the why-us cards fall to a 2x2 before they get cramped", async ({ browser }) => {
  const page = await browser.newPage({ viewport: { width: 900, height: 1000 } });
  await page.goto("/");
  await dismissCookies(page);
  const rows = await page
    .locator(".rs-why")
    .evaluate((el) => new Set([...el.querySelectorAll(".rs-why-item")].map((i) => Math.round(i.getBoundingClientRect().top))).size);
  expect(rows).toBe(2);
  expect(await page.evaluate(() => document.documentElement.scrollWidth <= window.innerWidth)).toBe(true);
  await page.close();
});

// The wordmark is an inline SVG rather than styled text, so it can't be
// checked by reading the page — assert the drawing is there and sized.
test("the wordmark renders in the header and the footer", async ({ page }) => {
  await page.goto("/");
  await dismissCookies(page);

  for (const scope of [".rs-nav", ".rs-footer"]) {
    const logo = page.locator(`${scope} .rs-logo svg`);
    await expect(logo).toHaveAttribute("aria-label", "RAČUNALO.hr");
    const box = (await logo.boundingBox())!;
    expect(box.height).toBeGreaterThan(18);
    expect(box.width).toBeGreaterThan(80);
  }

  // the header logo is still the link home
  await expect(page.locator('.rs-nav a.rs-logo[href="/"]')).toBeVisible();
});

test("the wordmark shrinks on a narrow phone instead of crowding the header", async ({ browser }) => {
  const wide = await browser.newPage({ viewport: { width: 1400, height: 900 } });
  await wide.goto("/");
  await dismissCookies(wide);
  const wideH = (await wide.locator(".rs-nav .rs-logo svg").boundingBox())!.height;
  await wide.close();

  const narrow = await browser.newPage({ viewport: { width: 360, height: 780 }, isMobile: true, hasTouch: true });
  await narrow.goto("/");
  await dismissCookies(narrow);
  const narrowBox = (await narrow.locator(".rs-nav .rs-logo svg").boundingBox())!;
  expect(narrowBox.height).toBeLessThan(wideH);
  // and still clears the cart and menu buttons
  expect(await narrow.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
  await narrow.close();
});

test("the favicon is the purpose-made mark, not the old photo", async ({ page }) => {
  await page.goto("/");
  const icons = await page.locator('link[rel="icon"]').evaluateAll((els) =>
    els.map((e) => e.getAttribute("type"))
  );
  expect(icons).toEqual(["image/svg+xml"]);
});

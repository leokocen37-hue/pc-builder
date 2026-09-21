import { test, expect, type Page } from "@playwright/test";

// The homepage used to ship a separate mobile layout: no lead paragraph, one
// white pill instead of the two buttons, no stat row, and a mobile-only
// "KATEGORIJE" block standing in for the value strip. It is now the desktop
// layout scaled down, so every piece has to be present at phone width too.

const dismissCookies = async (page: Page) => {
  const accept = page.getByText("Prihvaćam");
  if (await accept.isVisible().catch(() => false)) await accept.click();
};

const phone = { viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true };

test("the phone hero carries the same pieces as the desktop one", async ({ browser }) => {
  const page = await browser.newPage(phone);
  await page.goto("/");
  await dismissCookies(page);

  const hero = page.locator(".rs-hero");
  // the eyebrow keeps its "Custom PC ·" lead-in, which mobile used to drop
  await expect(hero.locator(".rs-hero-kicker")).toContainText("Custom PC");
  await expect(hero.locator("h1")).toBeVisible();
  await expect(hero.locator("p")).toBeVisible();
  await expect(hero.locator(".rs-hero-cta .rs-btn")).toHaveCount(2);
  await expect(hero.locator(".rs-stats div")).toHaveCount(3);

  await page.close();
});

test("the hero buttons stack full-width rather than wrapping into odd sizes", async ({ browser }) => {
  const page = await browser.newPage(phone);
  await page.goto("/");
  await dismissCookies(page);

  const boxes = await page
    .locator(".rs-hero-cta .rs-btn")
    .evaluateAll((els) => els.map((e) => e.getBoundingClientRect()).map((r) => ({ w: Math.round(r.width), top: Math.round(r.top) })));

  expect(boxes).toHaveLength(2);
  // same width as each other, and one above the other
  expect(boxes[0].w).toBe(boxes[1].w);
  expect(boxes[1].top).toBeGreaterThan(boxes[0].top);
  // wide enough to be worth tapping
  expect(boxes[0].w).toBeGreaterThan(280);

  await page.close();
});

test("the stat row stays three across instead of stranding the last one", async ({ browser }) => {
  const page = await browser.newPage(phone);
  await page.goto("/");
  await dismissCookies(page);

  const rows = await page
    .locator(".rs-stats")
    .evaluate((el) => new Set([...el.children].map((c) => Math.round(c.getBoundingClientRect().top))).size);
  expect(rows).toBe(1);

  await page.close();
});

test("the value strip is on the phone too, and the mobile-only block is gone", async ({ browser }) => {
  const page = await browser.newPage(phone);
  await page.goto("/");
  await dismissCookies(page);

  await expect(page.locator(".rs-value-strip")).toBeVisible();
  await expect(page.locator(".rs-value-strip-inner")).toContainText("Računala od");
  await expect(page.locator(".rs-mobile-cats")).toHaveCount(0);
  await expect(page.locator(".rs-hero-cta-mobile")).toHaveCount(0);

  await page.close();
});

test("the peripheral tiles stay two across rather than collapsing to one", async ({ browser }) => {
  const page = await browser.newPage(phone);
  await page.goto("/");
  await dismissCookies(page);

  const cats = page.locator(".rs-cats .rs-cat");
  await expect(cats).toHaveCount(4);
  const rows = await page
    .locator(".rs-cats")
    .evaluate((el) => new Set([...el.children].map((c) => Math.round(c.getBoundingClientRect().top))).size);
  expect(rows).toBe(2);

  await page.close();
});

for (const width of [320, 360, 390, 430, 768]) {
  test(`nothing spills sideways at ${width}px`, async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width, height: 800 }, isMobile: width < 600, hasTouch: width < 600 });
    await page.goto("/");
    await dismissCookies(page);
    await page.waitForTimeout(400);
    expect(await page.evaluate(() => document.documentElement.scrollWidth - window.innerWidth)).toBeLessThanOrEqual(0);
    await page.close();
  });
}

// The portrait crop only makes sense on a phone. At tablet width the 125%
// zoom that lifts the cases into the middle blows them up into a couple of
// magnified corners, and the landscape banner works there as it does on
// desktop — so the two swap over at 600px.
test("the phone gets the portrait photo and the tablet the landscape one", async ({ browser }) => {
  const shots: Record<number, string> = {};
  for (const width of [390, 600, 768]) {
    const page = await browser.newPage({ viewport: { width, height: 900 }, isMobile: width < 700, hasTouch: width < 700 });
    await page.goto("/");
    await dismissCookies(page);
    shots[width] = await page.evaluate(
      () => (getComputedStyle(document.querySelector(".rs-hero")!).backgroundImage.match(/hero-[a-z-]+\.jpg/) || ["?"])[0]
    );
    await page.close();
  }
  expect(shots[390]).toBe("hero-banner-mobile.jpg");
  expect(shots[600]).toBe("hero-banner-mobile.jpg");
  expect(shots[768]).toBe("hero-banner.jpg");
});

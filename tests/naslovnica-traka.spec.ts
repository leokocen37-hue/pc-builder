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

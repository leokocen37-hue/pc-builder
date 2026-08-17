import { test, expect, Page, CDPSession } from "@playwright/test";

// Round 2 follow-up: real-device testing found the mobile coverflow was
// trapping ALL touch input — a vertical swipe that started on a card did
// nothing (page couldn't scroll), which read as the page "refreshing" or
// the carousel "not really being on the page". Root cause was
// `touchAction: "none"` on the coverflow container, which blocks native
// touch handling entirely, combined with pointer capture grabbed on
// pointerdown regardless of gesture direction. Fixed with touchAction:
// "pan-y" plus a JS direction lock that only engages the carousel once a
// gesture is confirmed horizontal.
//
// Mouse-based drag simulation (page.mouse) does NOT exercise touch-action —
// browsers only apply it to real touch/pointer-type-touch input — so this
// dispatches genuine touch events through Chromium's CDP Input domain,
// which goes through the real touch/gesture pipeline.

async function dispatchTouch(cdp: CDPSession, type: "touchStart" | "touchMove" | "touchEnd", points: { x: number; y: number }[]) {
  await cdp.send("Input.dispatchTouchEvent", {
    type,
    touchPoints: points.map((p) => ({ x: p.x, y: p.y })),
  });
}

async function touchSwipe(cdp: CDPSession, startX: number, startY: number, endX: number, endY: number, steps = 8) {
  await dispatchTouch(cdp, "touchStart", [{ x: startX, y: startY }]);
  for (let i = 1; i <= steps; i++) {
    const x = startX + ((endX - startX) * i) / steps;
    const y = startY + ((endY - startY) * i) / steps;
    await dispatchTouch(cdp, "touchMove", [{ x, y }]);
    await new Promise((r) => setTimeout(r, 16));
  }
  await dispatchTouch(cdp, "touchEnd", []);
}

async function enterCpuStep(page: Page) {
  await page.goto("/konfigurator");
  const acceptBtn = page.getByText("Prihvaćam");
  if (await acceptBtn.isVisible().catch(() => false)) await acceptBtn.click();
  await page.getByAltText("Intel").first().click();
  await expect(page.locator("h2", { hasText: "Procesor" }).first()).toBeVisible({ timeout: 8000 });
  await page.waitForTimeout(300);
}

test.use({ viewport: { width: 390, height: 844 }, hasTouch: true, isMobile: true });

test("a vertical touch swipe starting on the active card scrolls the page, not the carousel", async ({ page, context }) => {
  const cdp = await context.newCDPSession(page);
  await enterCpuStep(page);

  const beforeScroll = await page.evaluate(() => window.scrollY);
  const cardBox = await page.locator('[data-testid="active-card"]').first().boundingBox();
  expect(cardBox).not.toBeNull();
  const cx = cardBox!.x + cardBox!.width / 2;
  const cy = cardBox!.y + cardBox!.height / 2;

  await touchSwipe(cdp, cx, cy + 100, cx, cy - 150, 10);
  await page.waitForTimeout(300);

  const afterScroll = await page.evaluate(() => window.scrollY);
  expect(afterScroll).toBeGreaterThan(beforeScroll);
});

test("a horizontal touch swipe still changes the active card, staying visible mid-drag", async ({ page, context }) => {
  const cdp = await context.newCDPSession(page);
  await enterCpuStep(page);

  const cardBefore = await page.locator('[data-testid="active-card"]').first().getAttribute("data-cardidx");
  const cardBox = await page.locator('[data-testid="active-card"]').first().boundingBox();
  expect(cardBox).not.toBeNull();
  const cx = cardBox!.x + cardBox!.width / 2;
  const cy = cardBox!.y + cardBox!.height / 2;

  await dispatchTouch(cdp, "touchStart", [{ x: cx, y: cy }]);
  await dispatchTouch(cdp, "touchMove", [{ x: cx - 60, y: cy }]);
  await page.waitForTimeout(50);
  // continuous interpolation, not the old discrete snap: the card must
  // still be mostly visible partway through the drag, not already faded
  // to 0 waiting to snap into place on release
  const midOpacity = await page.locator('[data-testid="active-card"]').first().evaluate((el) => parseFloat(getComputedStyle(el).opacity));
  expect(midOpacity).toBeGreaterThan(0.6);

  await dispatchTouch(cdp, "touchMove", [{ x: cx - 260, y: cy }]);
  await page.waitForTimeout(50);
  await dispatchTouch(cdp, "touchEnd", []);
  await page.waitForTimeout(500);

  const cardAfter = await page.locator('[data-testid="active-card"]').first().getAttribute("data-cardidx");
  expect(cardAfter).not.toBe(cardBefore);
});

import { test, expect, Page } from "@playwright/test";

// Round 2, section A: the mobile carousel overlapped itself (neighbor ghost
// cards bleeding onto the focused card's text, badge/Detalji collision,
// sticky bar covering the summary panel). This measures actual rendered
// bounding boxes at both required viewports rather than reasoning about the
// CSS in the abstract — the two previous rounds each shipped a break that
// only showed up on real interaction/rendering, not in a code read.

async function enterRamStep(page: Page) {
  await page.goto("/konfigurator");
  // dismiss the cookie-consent banner first — it's a fixed-bottom overlay
  // unrelated to this carousel, and left up it makes the sticky-bar/summary
  // overlap checks below false-positive against its own bounding box
  const acceptBtn = page.getByText("Prihvaćam");
  if (await acceptBtn.isVisible().catch(() => false)) await acceptBtn.click();
  await page.getByAltText("Intel").first().click();
  await expect(page.locator("h2", { hasText: "Procesor" }).first()).toBeVisible({ timeout: 8000 });
  await page.locator('[data-testid="active-card"]').first().click();
  await expect(page.locator("h2", { hasText: "Matična ploča" }).first()).toBeVisible({ timeout: 8000 });
  await page.locator('[data-testid="active-card"]').first().click();
  await expect(page.locator("h2", { hasText: "Radna memorija" }).first()).toBeVisible({ timeout: 8000 });
}

for (const viewport of [
  { width: 390, height: 844, label: "390x844" },
  { width: 390, height: 740, label: "390x740 (URL bar open)" },
]) {
  test.describe(`mobile carousel at ${viewport.label}`, () => {
    test.use({ viewport });

    test("neighbor card never overlaps the focused card's content box", async ({ page }) => {
      await enterRamStep(page);

      const activeCard = page.locator('[data-testid="active-card"]').first();
      const activeBox = await activeCard.boundingBox();
      expect(activeBox).not.toBeNull();

      // the active card's own title/spec/price must render INSIDE its box —
      // if the title wrapped and pushed content out, this box would be
      // taller than the card's rendered box, or a descendant would report a
      // bottom edge past the card's own bottom edge
      const priceEl = activeCard.locator("text=/€\\d/").first();
      const priceBox = await priceEl.boundingBox();
      expect(priceBox).not.toBeNull();
      expect(priceBox!.y + priceBox!.height).toBeLessThanOrEqual(activeBox!.y + activeBox!.height + 1);

      // any other rendered card (a peeking neighbor) must not overlap the
      // active card's box at all
      const allCards = page.locator('[data-cardidx]');
      const count = await allCards.count();
      for (let i = 0; i < count; i++) {
        const card = allCards.nth(i);
        const isActive = (await card.getAttribute("data-testid")) === "active-card";
        if (isActive) continue;
        const box = await card.boundingBox();
        if (!box || box.width === 0) continue; // not rendered / fully clipped
        const overlapsHorizontally = box.x < activeBox!.x + activeBox!.width && box.x + box.width > activeBox!.x;
        const overlapsVertically = box.y < activeBox!.y + activeBox!.height && box.y + box.height > activeBox!.y;
        expect(overlapsHorizontally && overlapsVertically, `neighbor card ${i} overlaps the active card`).toBe(false);
      }
    });

    test("badge and Detalji button never collide", async ({ page }) => {
      await enterRamStep(page);
      const detaljiBtn = page.locator('[data-testid="active-card"] button[aria-label="Detalji"]');
      const detaljiBox = await detaljiBtn.boundingBox();
      expect(detaljiBox).not.toBeNull();

      // whichever badge (if any) is present on the active card this run
      const badge = page.locator('[data-testid="active-card"] span', { hasText: /PREPORUČUJEMO|BEST BUY/ }).first();
      if ((await badge.count()) === 0) return; // no product flagged in the catalog today — nothing to check
      const badgeBox = await badge.boundingBox();
      expect(badgeBox).not.toBeNull();
      const overlapsHorizontally = badgeBox!.x < detaljiBox!.x + detaljiBox!.width && badgeBox!.x + badgeBox!.width > detaljiBox!.x;
      const overlapsVertically = badgeBox!.y < detaljiBox!.y + detaljiBox!.height && badgeBox!.y + badgeBox!.height > detaljiBox!.y;
      expect(overlapsHorizontally && overlapsVertically).toBe(false);
    });

    test("sticky total bar never overlaps the confirm/summary panel", async ({ page }) => {
      await enterRamStep(page);
      // scroll to the bottom of the page — this is exactly where the bug
      // reporter observed the collision
      await page.mouse.wheel(0, 5000);
      await page.waitForTimeout(300);

      const stickyBar = page.getByText("ODABERI KOMPONENTE").or(page.getByText(/ISPORUKA/)).first();
      const stickyBox = await stickyBar.boundingBox();
      if (!stickyBox) return; // sticky bar not present on this step's state

      const summaryLabel = page.getByText("ODABRANO", { exact: true }).first();
      if ((await summaryLabel.count()) === 0) return;
      const summaryBox = await summaryLabel.boundingBox();
      expect(summaryBox).not.toBeNull();
      // the summary label itself must sit above the sticky bar's top edge
      expect(summaryBox!.y + summaryBox!.height).toBeLessThanOrEqual(stickyBox.y + 2);
    });

    // Round 2 follow-up: the pill rail was briefly replaced with a
    // tap-to-expand summary line on mobile to save vertical space, but that
    // removed the ability to jump straight to e.g. Matična ploča from
    // anywhere — reverted to always-visible, same as desktop.
    test("step rail is always visible on mobile, not collapsed behind a tap", async ({ page }) => {
      await enterRamStep(page);
      await expect(page.locator(".rs-rail")).toBeVisible();
      await expect(page.getByText("Matična", { exact: false }).first()).toBeVisible();
    });
  });
}

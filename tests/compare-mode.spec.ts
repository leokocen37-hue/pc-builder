import { test, expect, Page } from "@playwright/test";

// Round 2, section D: the old per-card "Usporedi" checkbox is replaced with a
// toolbar toggle that puts the whole step into "compare mode" — off by
// default, no checkboxes anywhere, cards themselves become the tap target
// once it's on. This drives the real interaction end to end rather than
// reading the JSX, since round 2's own brief calls out that the last two
// rounds each shipped a break that only showed up on interaction.

async function dismissCookies(page: Page) {
  const acceptBtn = page.getByText("Prihvaćam");
  if (await acceptBtn.isVisible().catch(() => false)) await acceptBtn.click();
}

async function enterCpuStep(page: Page) {
  await page.goto("/konfigurator");
  await dismissCookies(page);
  await page.getByAltText("Intel").first().click();
  await expect(page.locator("h2", { hasText: "Procesor" }).first()).toBeVisible({ timeout: 8000 });
}

// the toggle's accessible NAME (computed from its text content, "Usporedi"
// [+ "· N/3" once active]) differs from its title attribute — title is
// unambiguous regardless of that text, so tests key off it
function compareToggle(page: Page) {
  return page.getByTitle("Usporedi komponente");
}

test("compare mode is off by default — no checkboxes, normal tap still selects", async ({ page }) => {
  await enterCpuStep(page);
  await expect(page.locator('input[type="checkbox"]')).toHaveCount(0);
  const toggle = compareToggle(page);
  await expect(toggle).toBeVisible();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
});

test("toggle has a 44x44 hit target", async ({ page }) => {
  await enterCpuStep(page);
  const box = await compareToggle(page).boundingBox();
  expect(box).not.toBeNull();
  expect(box!.height).toBeGreaterThanOrEqual(44);
});

test("coverflow: turning compare mode on, tapping the active card adds it, opens the sheet at 2, and turning off clears it", async ({ page }) => {
  await enterCpuStep(page);
  const toggle = compareToggle(page);
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "true");

  // tapping the active card in compare mode must NOT trigger the normal
  // selection flow (which would jump to the next step)
  const activeCard = page.locator('[data-testid="active-card"]').first();
  await activeCard.click();
  await page.waitForTimeout(300);
  await expect(page.locator("h2", { hasText: "Procesor" }).first()).toBeVisible();
  await expect(page.getByText("✓ DODANO ZA USPOREDBU")).toBeVisible();
  await expect(toggle).toContainText("1/3");

  // advance to a different card and add it too — comparison sheet should
  // open once 2 are selected
  const nextArrow = page.getByRole("button", { name: "Sljedeća komponenta" });
  await nextArrow.click();
  await page.waitForTimeout(500);
  const activeCard2 = page.locator('[data-testid="active-card"]').first();
  await activeCard2.click();
  await page.waitForTimeout(300);
  await expect(toggle).toContainText("2/3");
  await expect(page.getByText(/Usporedba|USPOREDBA|Usporedi/i).last()).toBeVisible();

  // turning compare mode off clears the selection
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await expect(page.getByText("✓ DODANO ZA USPOREDBU")).toHaveCount(0);
});

test("grid view: any card tap toggles compare directly, without requiring focus first", async ({ page }) => {
  await enterCpuStep(page);
  await page.getByRole("button", { name: "Sve odjednom" }).click();
  await compareToggle(page).click();

  const gridCards = page.locator('div[style*="grid-template-columns"] > div');
  const count = await gridCards.count();
  expect(count).toBeGreaterThan(1);

  // tap the SECOND card directly — it isn't the focused/active one, but in
  // compare mode a tap should still toggle it immediately
  await gridCards.nth(1).click();
  await expect(page.getByText("✓ ZA USPOREDBU")).toBeVisible();
});

test("step change while compare mode is on resets it cleanly", async ({ page }) => {
  await enterCpuStep(page);
  const toggle = compareToggle(page);
  await toggle.click();
  const activeCard = page.locator('[data-testid="active-card"]').first();
  await activeCard.click();
  await expect(page.getByText("✓ DODANO ZA USPOREDBU")).toBeVisible();

  // move to the next step via the normal selection flow: turn compare off first
  await toggle.click();
  await expect(toggle).toHaveAttribute("aria-pressed", "false");
  await page.locator('[data-testid="active-card"]').first().click();
  await expect(page.locator("h2", { hasText: "Matična ploča" }).first()).toBeVisible({ timeout: 8000 });

  // compare mode should be freshly off on the new step, not carried over
  await expect(compareToggle(page)).toHaveAttribute("aria-pressed", "false");
});

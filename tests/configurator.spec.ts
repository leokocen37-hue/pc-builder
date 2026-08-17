import { test, expect } from "@playwright/test";

// Regression test for the hard-freeze bug: clicking Intel/AMD (brand -> cpu,
// stepIndex 0 -> 1) froze the renderer outside React's update cycle, with no
// console warning, because activeIndex went through two distinct values in
// one step-entry sequence. This drives the exact repro click, then advances
// through every remaining step (recommended-item seeding, when no product is
// flagged recommended/pick in the catalog today, falls back to the middle of
// the sorted list — same code path, same guards, just a different index).
const REQUIRED_STEP_LABELS = [
  "Procesor",
  "Matična ploča",
  "Radna memorija",
  "Grafička kartica",
  "Pohrana",
  "Kućište",
  "Napajanje",
  "Hladnjak procesora",
];

test("configurator advances through all 11 steps without freezing", async ({ page }) => {
  test.setTimeout(90_000);

  await page.goto("/konfigurator");
  await expect(page.getByAltText("Intel").first()).toBeVisible();

  // the exact reported repro
  await page.getByAltText("Intel").first().click();

  for (const label of REQUIRED_STEP_LABELS) {
    await expect(page.locator("h2", { hasText: label }).first()).toBeVisible({ timeout: 8000 });
    const activeCard = page.locator('[data-testid="active-card"]').first();
    await expect(activeCard).toBeVisible({ timeout: 8000 });
    await activeCard.click();
  }

  // Sustav (optional) — selected here too, for a full traversal rather than skipped
  await expect(page.locator("h2", { hasText: "Operativni sustav" }).first()).toBeVisible({ timeout: 8000 });
  const osCard = page.locator('[data-testid="active-card"]').first();
  await expect(osCard).toBeVisible({ timeout: 8000 });
  await osCard.click();

  // Pregled (review) — final step, unique to it
  await expect(page.getByText("Dodaj u košaricu")).toBeVisible({ timeout: 8000 });

  // and back again — re-entering an already-decided step hits the "already
  // has a selection, focus that" guard rather than the recommended-item
  // path. Doesn't assert the exact label sequence (review's own back button
  // has "drop you on the first unfinished step" logic, independent of this
  // change) — just that every step along the way renders a real heading,
  // i.e. the page stayed responsive the whole way back.
  await page.getByText("← Uredi konfiguraciju").first().click();
  for (let i = 0; i < REQUIRED_STEP_LABELS.length; i++) {
    await expect(page.locator("h2").first()).toBeVisible({ timeout: 8000 });
    await expect(page.locator("h2").first()).not.toHaveText("", { timeout: 8000 });
    const backButton = page.getByText("← Nazad").first();
    if (!(await backButton.isVisible().catch(() => false))) break; // reached the brand step, no further back
    await backButton.click();
  }
});

// Regression test for round 2's bug F: seededStepsRef wasn't cleared by
// "Ispočetka" (or by re-picking a platform), so every step counted as
// already-seeded after a reset and silently kept whatever activeIndex it
// last had. Deliberately perturbs the carousel position with the arrow
// button (rather than relying on a DIFFERENT step's coincidentally-matching
// seed target, which let two earlier, weaker versions of this test pass
// against the deliberately-unfixed code — confirmed both times by actually
// reverting the fix and re-running before settling on this version) so a
// mismatch is guaranteed if the bug is present, not just likely.
test("recommended-start index survives Ispočetka", async ({ page }) => {
  test.setTimeout(60_000);

  await page.goto("/konfigurator");
  await page.getByAltText("Intel").first().click();
  await expect(page.locator("h2", { hasText: "Procesor" }).first()).toBeVisible({ timeout: 8000 });

  const freshCpuIdx = await page.locator('[data-testid="active-card"]').first().getAttribute("data-cardidx");

  // move the carousel off its seeded position without selecting anything —
  // guarantees activeIndex differs from the CPU step's seed target
  const nextArrow = page.getByRole("button", { name: "Sljedeća komponenta" });
  await nextArrow.click();
  await nextArrow.click();
  await page.waitForTimeout(300); // let the .55s slide transition settle
  const perturbedIdx = await page.locator('[data-testid="active-card"]').first().getAttribute("data-cardidx");
  expect(perturbedIdx).not.toBe(freshCpuIdx);

  await page.getByText("Ispočetka").first().click();
  await expect(page.getByAltText("Intel").first()).toBeVisible({ timeout: 8000 });
  await page.getByAltText("Intel").first().click();
  await expect(page.locator("h2", { hasText: "Procesor" }).first()).toBeVisible({ timeout: 8000 });

  const resetCpuIdx = await page.locator('[data-testid="active-card"]').first().getAttribute("data-cardidx");
  expect(resetCpuIdx).toBe(freshCpuIdx);
});

test("configurator advances through all 11 steps (AMD path) without freezing", async ({ page }) => {
  test.setTimeout(90_000);

  await page.goto("/konfigurator");
  await expect(page.getByAltText("AMD").first()).toBeVisible();
  await page.getByAltText("AMD").first().click();

  for (const label of REQUIRED_STEP_LABELS) {
    await expect(page.locator("h2", { hasText: label }).first()).toBeVisible({ timeout: 8000 });
    const activeCard = page.locator('[data-testid="active-card"]').first();
    await expect(activeCard).toBeVisible({ timeout: 8000 });
    await activeCard.click();
  }

  await expect(page.locator("h2", { hasText: "Operativni sustav" }).first()).toBeVisible({ timeout: 8000 });
  const osCard = page.locator('[data-testid="active-card"]').first();
  await expect(osCard).toBeVisible({ timeout: 8000 });
  await osCard.click();

  await expect(page.getByText("Dodaj u košaricu")).toBeVisible({ timeout: 8000 });
});

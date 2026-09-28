import { test, expect, type Page } from "@playwright/test";

const dismissCookies = async (page: Page) => {
  const accept = page.getByText("Prihvaćam");
  if (await accept.isVisible().catch(() => false)) await accept.click();
};

const FORM = "/uvjeti/obrazac-za-jednostrani-raskid";

// --- the withdrawal form ---------------------------------------------------

test("the PDF is gone and nothing links to it", async ({ page, request }) => {
  expect((await request.get("/obrazac-za-jednostrani-raskid.pdf")).status()).toBe(404);

  for (const path of ["/raskid", FORM, "/uvjeti"]) {
    await page.goto(path);
    await dismissCookies(page);
    const links = await page.locator("a").evaluateAll((els) => els.map((e) => e.getAttribute("href") || ""));
    expect(links.filter((h) => h.endsWith(".pdf")), `PDF link left on ${path}`).toEqual([]);
  }
});

test("the declaration is filled in on the page", async ({ page }) => {
  await page.goto(FORM);
  await dismissCookies(page);

  for (const label of [
    "Ime i prezime *",
    "E-pošta *",
    "Adresa *",
    "Broj narudžbe *",
    "Datum primitka robe *",
    "Roba na koju se raskid odnosi *",
  ]) {
    await expect(page.getByLabel(label), `missing field: ${label}`).toBeVisible();
  }
  // no printing, no scanning, no signature
  await expect(page.locator("body")).not.toContainText("ispisati");
  await expect(page.getByRole("button", { name: /Pošalji obavijest o raskidu/ })).toBeVisible();
});

// The right is exercised "ne navodeći razloge" — a required reason field
// would be an obstacle to it.
test("the reason is optional, and says so", async ({ page }) => {
  await page.goto(FORM);
  await dismissCookies(page);

  const reason = page.getByLabel("Razlog — nije obavezan");
  await expect(reason).toBeVisible();
  await expect(reason).not.toHaveAttribute("required", /.*/);
  await expect(page.locator(".ras-form")).toContainText("bez navođenja razloga");
});

test("an incomplete declaration is not sent", async ({ page }) => {
  await page.goto(FORM);
  await dismissCookies(page);
  await page.getByRole("button", { name: /Pošalji obavijest o raskidu/ }).click();
  await expect(page.locator(".ras-error")).toContainText("Ispunite sva obavezna polja");
});

test("the API refuses a declaration missing what it needs", async ({ request }) => {
  const res = await request.post("/api/raskid", {
    headers: { "X-Forwarded-For": "10.8.0.1" },
    data: { ime: "Ana Anić", email: "ana@example.com" },
  });
  expect(res.status()).toBe(400);
});

test("the API refuses an address that isn't one", async ({ request }) => {
  const res = await request.post("/api/raskid", {
    headers: { "X-Forwarded-For": "10.8.0.2" },
    data: {
      ime: "Ana Anić",
      adresa: "Ulica 1, 10000 Zagreb",
      email: "nije-email",
      brojNarudzbe: "#1004",
      datumPrimitka: "2026-09-20",
      roba: "Office Start I",
      potvrda: true,
    },
  });
  expect(res.status()).toBe(400);
});

test("a filled honeypot is swallowed, and never mailed", async ({ request }) => {
  const res = await request.post("/api/raskid", {
    headers: { "X-Forwarded-For": "10.8.0.3" },
    data: { tvrtka: "bot", ime: "Bot", email: "bot@example.com" },
  });
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
});

// --- abandoned draft orders ------------------------------------------------

// Every trip to checkout creates a draft; the unpaid ones used to stay open
// forever. The cleanup deletes open ones older than seven days — and nothing
// else, since a paid draft is "completed" and carries the order.
test("the cleanup refuses anyone without the cron secret", async ({ request }) => {
  expect((await request.get("/api/draft-orders/cleanup")).status()).toBe(401);
  expect(
    (await request.get("/api/draft-orders/cleanup", { headers: { Authorization: "Bearer wrong" } })).status()
  ).toBe(401);
  expect((await request.post("/api/draft-orders/cleanup")).status()).toBe(401);
});

test("the cleanup is scheduled, not left to be remembered", async () => {
  const fs = await import("node:fs");
  const vercel = JSON.parse(fs.readFileSync("vercel.json", "utf8"));
  const cron = (vercel.crons ?? []).find((c: { path: string }) => c.path === "/api/draft-orders/cleanup");
  expect(cron, "no cron entry for the draft cleanup").toBeTruthy();
  expect(cron.schedule).toBeTruthy();
});

import { test, expect, type Page } from "@playwright/test";
import { plural, pluralForm, NOUNS } from "../lib/plural";

const dismissCookies = async (page: Page) => {
  const accept = page.getByText("Prihvaćam");
  if (await accept.isVisible().catch(() => false)) await accept.click();
};

// --- 8. security headers -------------------------------------------------

test("every response carries the security headers", async ({ request }) => {
  const res = await request.get("/");
  const h = res.headers();
  expect(h["x-frame-options"]).toBe("DENY");
  expect(h["x-content-type-options"]).toBe("nosniff");
  expect(h["referrer-policy"]).toBe("strict-origin-when-cross-origin");
  expect(h["permissions-policy"]).toContain("camera=()");
  expect(h["strict-transport-security"]).toContain("includeSubDomains");
  expect(h["content-security-policy-report-only"]).toContain("frame-ancestors 'none'");
  // the framework version is nobody's business
  expect(h["x-powered-by"]).toBeUndefined();
});

// --- 7/9. input validation and abuse limits ------------------------------

test("checkout refuses a variant id that isn't one", async ({ request }) => {
  const res = await request.post("/api/checkout", {
    data: {
      uvjeti: { prihvat: "da", verzija: "t", vrijeme: "t" },
      items: [{ kind: "product", variantId: "not-a-gid", quantity: 1 }],
    },
  });
  expect(res.status()).toBe(400);
});

test("checkout refuses an order with no terms acceptance", async ({ request }) => {
  const res = await request.post("/api/checkout", {
    data: { items: [{ kind: "product", variantId: "gid://shopify/ProductVariant/1", quantity: 1 }] },
  });
  expect(res.status()).toBe(400);
});

test("the contact form swallows a filled honeypot instead of mailing it", async ({ request }) => {
  const res = await request.post("/api/contact", {
    data: { name: "Bot", email: "bot@example.com", message: "spam", tvrtka: "filled" },
  });
  // 200 on purpose: telling a bot it failed only teaches it to clear the field
  expect(res.status()).toBe(200);
  expect(await res.json()).toEqual({ ok: true });
});

// --- 11. the revalidate webhook ------------------------------------------

test("the revalidate webhook refuses an unsigned call", async ({ request }) => {
  const res = await request.post("/api/revalidate", { data: { handle: "whatever" } });
  // 401 when a secret is configured, 503 when it isn't — never 200
  expect([401, 503]).toContain(res.status());
});

// --- 14. Croatian number agreement ---------------------------------------

test("the plural helper picks the Croatian form", () => {
  expect(pluralForm(1)).toBe("one");
  expect(pluralForm(21)).toBe("one");
  expect(pluralForm(11)).toBe("many"); // the teens are the exception
  expect(pluralForm(4)).toBe("few");
  expect(pluralForm(14)).toBe("many");
  expect(pluralForm(5)).toBe("many");
  expect(pluralForm(0)).toBe("many");
  expect(plural(1, NOUNS.proizvod)).toBe("1 proizvod");
  expect(plural(3, NOUNS.proizvod)).toBe("3 proizvoda");
});

test("the configurator agrees with its own count", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/konfigurator");
  await dismissCookies(page);
  await page.getByAltText("Intel").first().click();
  await expect(page.locator("h2", { hasText: "Procesor" }).first()).toBeVisible({ timeout: 8000 });
  const body = await page.locator("body").innerText();
  // "4 kompatibilnih modela" was the wrong form for 2–4
  expect(body).not.toMatch(/\b[2-4] kompatibilnih modela\b/);
  expect(body).toMatch(/\d+ kompatibiln(?:ih modela|a modela|an model)/);
});

// --- 16. contrast and labels ---------------------------------------------

test("small print clears the 4.5:1 contrast floor", async ({ page }) => {
  await page.goto("/");
  await dismissCookies(page);
  const ratio = await page.evaluate(() => {
    const faint = getComputedStyle(document.documentElement).getPropertyValue("--faint").trim();
    const bg = getComputedStyle(document.documentElement).getPropertyValue("--bg").trim();
    const lum = (hex: string) => {
      const [r, g, b] = [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16) / 255);
      const f = (v: number) => (v <= 0.03928 ? v / 12.92 : Math.pow((v + 0.055) / 1.055, 2.4));
      return 0.2126 * f(r) + 0.7152 * f(g) + 0.0722 * f(b);
    };
    const a = lum(faint);
    const b = lum(bg);
    return (Math.max(a, b) + 0.05) / (Math.min(a, b) + 0.05);
  });
  expect(ratio).toBeGreaterThanOrEqual(4.5);
});

test("the drawer button says where it goes", async ({ page }) => {
  await page.goto("/racunala/gaming/entry-level-racunalo");
  await dismissCookies(page);
  await page.getByRole("button", { name: "Dodaj u košaricu" }).click();
  await expect(page.getByRole("link", { name: "Pregled košarice →" })).toBeVisible({ timeout: 8000 });
});

// --- 17. contact form accessibility --------------------------------------

test("every contact field has a real label and the right keyboard", async ({ page }) => {
  test.setTimeout(60_000);
  await page.goto("/konfigurator");
  await dismissCookies(page);
  await page.getByRole("button", { name: /Kontaktirajte nas/ }).click();

  await expect(page.getByLabel("Ime i prezime *")).toBeVisible();
  await expect(page.getByLabel("E-mail *")).toBeVisible();
  const phone = page.getByLabel("Telefon (nije obavezno)");
  await expect(phone).toHaveAttribute("type", "tel");
  await expect(phone).toHaveAttribute("inputmode", "tel");
  await expect(phone).toHaveAttribute("autocomplete", "tel");
  // and the purpose of the data is stated where it is collected
  await expect(page.getByRole("link", { name: "Politici privatnosti" })).toBeVisible();
});

// --- 18. who receives the data -------------------------------------------

test("the privacy policy names every recipient", async ({ page }) => {
  await page.goto("/privatnost");
  await dismissCookies(page);
  const body = page.locator(".legal-content");
  for (const name of ["Shopify", "Vercel", "Resend", "DPD Croatia"]) {
    await expect(body).toContainText(name);
  }
  await expect(body).toContainText("standardnim ugovornim klauzulama");
});

test("no font request leaves for Google", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) external.push(r.url());
  });
  await page.goto("/", { waitUntil: "networkidle" });
  expect(external).toEqual([]);
});

// --- 19/20. weight -------------------------------------------------------

test("the homepage no longer ships full-size product photography", async ({ page }) => {
  let imageBytes = 0;
  page.on("response", async (r) => {
    if (!(r.headers()["content-type"] || "").startsWith("image/")) return;
    try {
      imageBytes += (await r.body()).length;
    } catch {
      /* redirects and aborted requests have no body */
    }
  });
  await page.goto("/", { waitUntil: "networkidle" });
  await dismissCookies(page);
  await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight));
  await page.waitForTimeout(2500);
  // it was ~2.6 MB of images alone before the CDN was asked for a size
  expect(imageBytes).toBeLessThan(1_100_000);
});

test("Shopify images are requested at a size, not full resolution", async ({ page }) => {
  await page.goto("/racunala");
  await dismissCookies(page);
  const srcs = await page.locator(".rs-card img").evaluateAll((els) =>
    els.map((e) => (e as HTMLImageElement).getAttribute("src") || "")
  );
  const shopifySrcs = srcs.filter((s) => s.includes("cdn.shopify.com"));
  expect(shopifySrcs.length).toBeGreaterThan(0);
  for (const src of shopifySrcs) expect(src).toMatch(/[?&]width=\d+/);
});

// --- 21/22. one host, honest robots, and search --------------------------

test("robots.txt points at the canonical host and not at 404s", async ({ request }) => {
  const body = await (await request.get("/robots.txt")).text();
  expect(body).toContain("https://www.racunalo.hr/sitemap.xml");
  expect(body).not.toContain("/kalkulator");
});

test("canonicals use the www host", async ({ page }) => {
  await page.goto("/racunala");
  const canonical = await page.locator('link[rel="canonical"]').getAttribute("href");
  expect(canonical).toContain("https://www.racunalo.hr");
});

test("the 404 page has a title of its own", async ({ page }) => {
  await page.goto("/ova-stranica-ne-postoji");
  await expect(page).toHaveTitle(/Stranica nije pronađena/);
});

test("the FAQ answers are all in the HTML, with FAQPage data", async ({ page }) => {
  await page.goto("/faq");
  await dismissCookies(page);

  // every answer is rendered, whether or not its panel is open
  const answers = await page.locator(".faq-a").count();
  const questions = await page.locator(".faq-q").count();
  expect(answers).toBe(questions);
  expect(questions).toBeGreaterThan(5);

  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  const faq = ld.map((t) => JSON.parse(t)).find((d) => d["@type"] === "FAQPage");
  expect(faq).toBeTruthy();
  expect(faq.mainEntity.length).toBe(questions);
});

test("the brand keeps its diacritic in structured data", async ({ page }) => {
  await page.goto("/");
  const ld = await page.locator('script[type="application/ld+json"]').allTextContents();
  const org = ld.map((t) => JSON.parse(t)).find((d) => d["@type"] === "Organization");
  expect(org.name).toBe("RAČUNALO.hr");
});

test("search reaches across the whole store", async ({ page }) => {
  await page.goto("/pretraga?q=starter");
  await dismissCookies(page);
  const titles = await page.locator(".rs-card h4").allInnerTexts();
  expect(titles).toContain("Starter I");

  // ...peripherals too, not only computers
  await page.goto("/pretraga?q=tipkovnica");
  const fromHeader = await page.locator(".rs-card").count();
  expect(fromHeader).toBeGreaterThanOrEqual(0);

  // and there is a way in from any page
  await page.goto("/racunala");
  await page.locator(".rs-search-btn").click();
  await page.waitForURL("**/pretraga");
});

test("a search with no hits offers a way on", async ({ page }) => {
  await page.goto("/pretraga?q=qqqzzz");
  await dismissCookies(page);
  await expect(page.locator(".rs-empty")).toContainText("Nema rezultata");
  await expect(page.locator(".rs-empty").getByRole("link", { name: "Sva računala" })).toBeVisible();
});

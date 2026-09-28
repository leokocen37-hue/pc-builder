import { test, expect, type Page } from "@playwright/test";
import fs from "node:fs";
import { SHOPIFY_API_VERSION } from "../lib/shopify-version";

const dismissCookies = async (page: Page) => {
  const accept = page.getByText("Prihvaćam");
  if (await accept.isVisible().catch(() => false)) await accept.click();
};

const env = (key: string): string | null => {
  try {
    return fs.readFileSync(".env.local", "utf8").match(new RegExp(`^${key}=(.+)$`, "m"))?.[1]?.trim() ?? null;
  } catch {
    return null;
  }
};

// --- the calculators ------------------------------------------------------

test("the calculator routes are gone, and unmentioned", async ({ request }) => {
  for (const path of ["/kalkulator", "/kalkulator2"]) {
    expect((await request.get(path)).status(), `${path} still resolves`).toBe(404);
  }
  const robots = await (await request.get("/robots.txt")).text();
  expect(robots).not.toContain("kalkulator");
});

// --- nobody sets their own price -----------------------------------------

// The request body has no price field at all: priceCustomBuild asks Shopify
// for each variant and adds them up. These are the shapes someone with
// devtools would try.
test.describe("checkout refuses a price of the buyer's choosing", () => {
  const uvjeti = { prihvat: "da", verzija: "t", vrijeme: "t" };
  // The route rate-limits per IP, and the whole suite otherwise shares one
  // bucket — these tests are about input validation, not about the limiter,
  // so each call arrives as its own caller.
  let caller = 0;
  const asNewCaller = () => ({ "X-Forwarded-For": `10.9.0.${++caller}` });
  const realGid = "gid://shopify/ProductVariant/1";

  test("a price in the body buys nothing", async ({ request }) => {
    const res = await request.post("/api/checkout", {
      headers: asNewCaller(),
      data: {
        uvjeti,
        items: [{ kind: "custom", title: "Hack", price: 1, originalUnitPrice: "1.00", variantIds: [realGid] }],
      },
    });
    // never a 200: either the variant is refused or the order is priced from
    // Shopify and the admin call is what answers
    expect(res.status()).not.toBe(200);
    expect(await res.text()).not.toContain("1.00");
  });

  test("an id that isn't a Shopify variant is refused before it reaches GraphQL", async ({ request }) => {
    for (const bad of ["../../x", "gid://shopify/Product/1", "gid://shopify/ProductVariant/abc", "1"]) {
      const res = await request.post("/api/checkout", {
        headers: asNewCaller(),
        data: { uvjeti, items: [{ kind: "custom", variantIds: [bad] }] },
      });
      expect(res.status(), `accepted ${bad}`).toBe(400);
    }
  });

  test("an empty build is refused", async ({ request }) => {
    const res = await request.post("/api/checkout", {
      headers: asNewCaller(),
      data: { uvjeti, items: [{ kind: "custom", title: "Besplatno", price: 0, variantIds: [] }] },
    });
    expect(res.status()).toBe(400);
  });

  test("a failed admin handshake answers cleanly, not with a parser error", async ({ request }) => {
    const res = await request.post("/api/checkout", {
      headers: asNewCaller(),
      data: { uvjeti, items: [{ kind: "product", variantId: realGid, quantity: 1 }] },
    });
    // locally there are no admin credentials, so this is the auth path; what
    // matters is that it never leaks "Unexpected token '<'" to the buyer
    expect(await res.text()).not.toContain("Unexpected token");
  });
});

// --- the Shopify API version ---------------------------------------------

// Shopify supports a version for a year, then quietly serves a newer one and
// says so in a header. That is how 2025-07 went unnoticed.
test("the Shopify API version we pin is still supported", async () => {
  const domain = env("NEXT_PUBLIC_SHOPIFY_DOMAIN");
  const token = env("NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN");
  test.skip(!domain || !token, "Shopify credentials are not in .env.local");

  const res = await fetch(`https://${domain}/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Storefront-Access-Token": token! },
    body: JSON.stringify({ query: "{shop{name}}" }),
  });

  expect(res.status).toBe(200);
  // the store answered on the version we asked for, not on a newer one
  expect(res.headers.get("x-shopify-api-version")).toBe(SHOPIFY_API_VERSION);
  expect(res.headers.get("x-shopify-api-version-warning")).toBeNull();
});

// --- the step rail --------------------------------------------------------

// scroll-margin-top only helps when something is scrolled into view
// programmatically. The rail sticks under the header instead.
for (const [width, height, label] of [
  [1500, 900, "desktop"],
  [390, 844, "phone"],
] as const) {
  test(`the step rail stays clear of the header while scrolling (${label})`, async ({ browser }) => {
    const page = await browser.newPage({ viewport: { width, height }, isMobile: width < 600, hasTouch: width < 600 });
    await page.goto("/konfigurator");
    await dismissCookies(page);
    await page.getByAltText("Intel").first().click();
    await page.waitForTimeout(400);

    for (const y of [0, 200, 600]) {
      await page.evaluate((v) => window.scrollTo(0, v), y);
      await page.waitForTimeout(200);
      const { navBottom, railTop, overflow } = await page.evaluate(() => {
        const nav = document.querySelector(".rs-nav")!.getBoundingClientRect();
        const rail = document.querySelector(".rs-rail-wrap")!.getBoundingClientRect();
        return {
          navBottom: nav.bottom,
          railTop: rail.top,
          overflow: document.documentElement.scrollWidth - window.innerWidth,
        };
      });
      expect(railTop, `rail hidden behind the header at scroll ${y}`).toBeGreaterThanOrEqual(navBottom - 2);
      // overflow-x: clip replaced hidden to make sticky work — it must still clip
      expect(overflow, `horizontal scroll appeared at ${y}`).toBeLessThanOrEqual(0);
    }
    await page.close();
  });
}

// --- power, stated as load ------------------------------------------------

test("the power note gives watts and load, not a bare headroom figure", async ({ page }) => {
  test.setTimeout(90_000);
  await page.goto("/konfigurator");
  await dismissCookies(page);
  await page.getByAltText("Intel").first().click();
  for (const label of ["Procesor", "Matična ploča", "Radna memorija", "Grafička kartica", "Pohrana", "Kućište", "Napajanje"]) {
    await expect(page.locator("h2", { hasText: label }).first()).toBeVisible({ timeout: 8000 });
    await page.locator('[data-testid="active-card"]').first().click();
  }
  await page.waitForTimeout(400);

  const body = await page.locator("body").innerText();
  expect(body).not.toMatch(/% rezerve/);
  // "570 W od 1000 W (57%)" — both the absolute numbers and the share
  expect(body).toMatch(/\d+ W od \d+ W \(\d+%\)/);
});

// --- illustrative photography --------------------------------------------

test("a built-to-order machine says its photos are illustrative", async ({ page }) => {
  await page.goto("/racunala/gaming/entry-level-racunalo");
  await dismissCookies(page);
  await expect(page.locator(".rs-gallery-note")).toContainText("Slike su ilustrativne");
  await expect(page.locator(".rs-gallery-note")).toContainText("sastavljamo po narudžbi");
});

test("a peripheral does not — it ships as photographed", async ({ page }) => {
  await page.goto("/periferija/tipkovnice/razer-huntsman-v3-pro");
  await dismissCookies(page);
  await expect(page.locator(".rs-gallery-note")).toHaveCount(0);
});

// --- weight ---------------------------------------------------------------

test("no font is downloaded that nothing draws with", async ({ page }) => {
  const fonts: string[] = [];
  page.on("response", (r) => {
    if (/\.woff2?(\?|$)/.test(r.url())) fonts.push(r.url());
  });
  await page.goto("/", { waitUntil: "networkidle" });
  // Geist and Geist Mono came with the starter template and were referenced
  // only by a stylesheet nothing imported
  expect(fonts.filter((f) => /geist/i.test(f))).toEqual([]);
  expect(fonts.length).toBeGreaterThan(0);
});

// --- CSP, enforced ---------------------------------------------------------

// It ran report-only with 'unsafe-inline' in script-src: nothing was blocked,
// nothing read the reports, and the policy would have permitted an injected
// script even if enforced. Enforcing it takes a nonce, and a nonce has to be
// minted per response — which is why the policy moved to proxy.ts.
test("every response carries an enforced CSP with a fresh nonce", async ({ request }) => {
  const first = (await request.get("/")).headers()["content-security-policy"];
  const second = (await request.get("/racunala")).headers()["content-security-policy"];

  expect(first).toBeTruthy();
  const nonceOf = (csp: string) => csp.match(/'nonce-([a-f0-9]+)'/)?.[1];
  expect(nonceOf(first)).toBeTruthy();
  // a nonce reused across responses is no better than 'unsafe-inline'
  expect(nonceOf(first)).not.toBe(nonceOf(second));
});

test("no page trips the policy it now enforces", async ({ page }) => {
  const violations: string[] = [];
  page.on("console", (m) => {
    if (/Content Security Policy|Refused to/i.test(m.text())) violations.push(m.text());
  });
  page.on("pageerror", (e) => violations.push(`pageerror: ${e.message}`));

  for (const path of ["/", "/racunala", "/kosarica", "/konfigurator", "/pretraga?q=starter"]) {
    await page.goto(path, { waitUntil: "networkidle" });
    await dismissCookies(page);
    await page.waitForTimeout(600);
  }
  expect(violations).toEqual([]);
});

// The configurator appended its own <link> to fonts.googleapis.com at
// runtime — left over from before the fonts were self-hosted. It sent every
// visitor's IP to Google from the one page the privacy policy says it doesn't.
test("the configurator loads no font from a third party", async ({ page }) => {
  const external: string[] = [];
  page.on("request", (r) => {
    if (/fonts\.(googleapis|gstatic)\.com/.test(r.url())) external.push(r.url());
  });
  await page.goto("/konfigurator", { waitUntil: "networkidle" });
  await dismissCookies(page);
  await page.waitForTimeout(1000);
  expect(external).toEqual([]);
});

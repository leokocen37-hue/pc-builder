# RAČUNALO.hr — implementation brief

You are working on a Next.js + Shopify (headless, Storefront API) storefront deployed on
Vercel. Products are managed in Shopify and pulled into the site. The site is pre-launch:
nothing is indexed by Google yet, so breaking-change URL work is safe to do now.

## Before you start

Do not assume the structure described below matches reality. First:

1. Read `package.json`, `next.config.*`, and list the `app/` (or `pages/`) directory.
2. Confirm: App Router or Pages Router? What Next.js version?
3. Find every place Shopify is queried. Search for `myshopify.com`, `Storefront`,
   `graphql.json`, `X-Shopify-Storefront-Access-Token`, `useEffect` + `fetch`.
4. Report back a short summary of what you found and how it differs from my assumptions
   BEFORE writing code. If anything below is wrong for this codebase, say so and propose
   the equivalent.

Work in phases. Commit after each phase with a clear message. Do not start the next phase
until the current one builds cleanly (`npm run build`).

---

## Phase 1 — Server-render all product data (highest priority)

**Problem:** Product content is fetched in the browser, not on the server. `view-source:`
on any category or product page shows no product names or prices — only nav, footer, and a
loading state. `/konfigurator` renders only "UČITAVANJE KOMPONENTI…". Meta tags ARE
server-rendered correctly; the body is not.

**Affected routes** (verify this list against the codebase):
`/gotova-racunala`, `/gaming-racunala`, `/radne-stanice`, `/periferija`, `/monitori`,
`/tipkovnice`, `/misevi`, `/slusalice`, `/konfigurator`, and all product detail pages.

**Do this:**

- Convert these pages to React Server Components. Remove `'use client'` from the page-level
  files and move the Shopify fetch out of `useEffect` and into the async component body.
- Keep `'use client'` ONLY on genuinely interactive leaf components: cart, add-to-cart
  button, configurator part pickers, filter controls. Pass server-fetched data into them
  as props.
- Use `next: { revalidate: 300 }` on the Shopify fetch (ISR — page is cached, refreshed
  every 5 minutes, so new Shopify products appear automatically without a redeploy).
- For product detail pages, add `generateStaticParams()` so known handles are pre-rendered
  at build time.
- Replace loading text with skeleton components for the parts that are still client-side.
- Ensure the Storefront access token is read from an env var, server-side only. It must
  not appear in the client bundle. If it is currently a `NEXT_PUBLIC_*` variable, rename it
  and update Vercel env settings (flag this to me — I need to change it in the dashboard).

**Reference shape:**

```jsx
// app/tipkovnice/page.jsx — no 'use client'
export const revalidate = 300;

async function getProducts(tag) {
  const res = await fetch(
    `https://${process.env.SHOPIFY_DOMAIN}/api/2024-10/graphql.json`,
    {
      method: 'POST',
      headers: {
        'X-Shopify-Storefront-Access-Token': process.env.SHOPIFY_STOREFRONT_TOKEN,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        query: `query($q: String!) {
          products(first: 50, query: $q) {
            edges { node {
              id title handle vendor description availableForSale
              priceRange { minVariantPrice { amount currencyCode } }
              featuredImage { url altText width height }
              variants(first: 1) { edges { node { id sku } } }
            } }
          }
        }`,
        variables: { q: `tag:'${tag}'` },
      }),
      next: { revalidate: 300 },
    }
  );
  if (!res.ok) throw new Error(`Shopify ${res.status}`);
  const json = await res.json();
  if (json.errors) throw new Error(JSON.stringify(json.errors));
  return json.data.products.edges.map((e) => e.node);
}

export default async function Page() {
  const products = await getProducts('Tipkovnica');
  return <ProductGrid products={products} />;
}
```

**Acceptance:** `curl -s <url> | grep -i "<a product name>"` returns a match for every
route listed above. `npm run build` succeeds. Products still display correctly in-browser.

---

## Phase 2 — Restructure URLs

**Problem:** Every product sits at the site root (`/razer-viper-v4-pro`, `/titan`), sharing
a namespace with real pages (`/kontakt`, `/faq`, `/uvjeti`). The `[slug]` catch-all must
query Shopify for every unknown path, so `/racunala` returns "Proizvod nije pronađen"
instead of a proper 404. No breadcrumbs, no SEO hierarchy, and future pages risk shadowing
auto-generated Shopify handles.

**Do this:**

- Move product detail pages to nested routes:
  - Peripherals: `/periferija/[kategorija]/[handle]`
    (kategorija ∈ `monitori`, `tipkovnice`, `misevi`, `slusalice`)
  - Computers: `/racunala/[kategorija]/[handle]`
    (kategorija ∈ `gaming`, `radne-stanice`)
  - Derive `kategorija` from the Shopify tag/collection the product belongs to.
- If nesting turns out to be disproportionately complex given how the data is modelled,
  fall back to a flat-but-namespaced `/proizvod/[handle]` and tell me why.
- Delete the root-level `[slug]` catch-all so unknown paths hit Next's real 404.
- Write a proper `app/not-found.jsx`: heading "Stranica nije pronađena", short Croatian
  copy, and links to Konfigurator / Gotova računala / Periferija / Kontakt. It must not say
  "Proizvod nije pronađen" — that message belongs only on a missing-product route.
- Make `/racunala` a working category landing page (currently 404s while the nav label is
  "Računala" pointing at `/gotova-racunala`). Either make `/racunala` the real listing and
  redirect `/gotova-racunala` to it, or keep `/gotova-racunala` and add a redirect from
  `/racunala`. Pick one, apply it consistently across nav, footer, sitemap, and canonicals.
- Add a visible breadcrumb component on category and product pages, plus matching
  `BreadcrumbList` JSON-LD.
- Regenerate `sitemap.xml` from the new route structure. It is currently hardcoded and
  lists old flat URLs.

**Acceptance:** No product is reachable at a root-level URL. `/racunala` resolves (200 or
redirect, not 404). A nonsense path like `/asdfgh` renders the generic 404, not a product
error. Sitemap URLs all return 200.

---

## Phase 3 — Structured data

Add JSON-LD, server-rendered (depends on Phase 1):

- **Product pages** — `Product` schema with `name`, `image`, `description`, `sku`, `brand`,
  and an `offers` object containing `url`, `priceCurrency: "EUR"`, `price`,
  `availability` (InStock / OutOfStock from `availableForSale`), and
  `itemCondition: "https://schema.org/NewCondition"`.
- **Category pages** — `BreadcrumbList`.
- **Homepage** — `Organization` with `name`, `url`, `logo`, `email`, `sameAs`. Leave
  address/phone/VAT out for now; company details are not finalised. Add a `// TODO:` note.

Build it as a reusable `<JsonLd data={...} />` component rather than repeating
`dangerouslySetInnerHTML` in each file. Validate the output shape against schema.org's
Product spec.

**Acceptance:** JSON-LD present in `view-source:` on product, category, and home. Valid JSON.

---

## Phase 4 — Surface price, delivery, and lead time

Buyers' three unanswered questions. Use placeholder constants in a single config file
(`lib/site-config.ts`) so I can edit the numbers in one place — do not scatter them.

```ts
export const SITE = {
  startingPrice: 599,        // EUR — placeholder, I will confirm
  freeShippingFrom: 500,     // EUR — placeholder
  buildDaysMin: 3,
  buildDaysMax: 5,
};
```

- **Hero chips:** replace "100+ komponenti" with build time, e.g.
  "Sastavljamo u 3–5 radnih dana". Keep the warranty and tested chips.
- **New strip directly under the hero**, three items on one row (stacked on mobile):
  "Konfiguracije od 599 €" · "Besplatna dostava iznad 500 €" · "Spremno za 3–5 radnih dana".
- **Configurator:** sticky bottom bar showing running total and estimated dispatch date,
  updating live as parts are selected. Must be readable on mobile without covering content.
- **Product pages:** show delivery cost and lead time next to the price, not in the footer.

---

## Phase 5 — Shareable build permalinks

- Encode the current configurator selection into the URL as a compact, URL-safe
  base64 param, e.g. `/konfigurator?b=<encoded>`. Encode Shopify handles, not internal ids,
  so links survive a data refresh.
- On load, decode the param and pre-select those parts. Handle gracefully: if a part no
  longer exists or is out of stock, skip it and show a Croatian notice naming what changed.
- Add a "Kopiraj link" button near the total, with copied-state feedback.
- Generate a dynamic Open Graph image for shared build links using Next.js `ImageResponse`
  (`app/konfigurator/opengraph-image.tsx`), showing the key specs (CPU, GPU, RAM) and the
  total price, so links pasted into forums and WhatsApp preview as a card.

**Acceptance:** A copied link opened in a fresh incognito window restores the same build.

---

## Out of scope — do not touch

- Footer placeholders `{NAZIV_TVRTKE}`, `{OIB}`, `{SJEDIŠTE}`, `{TELEFON}` and the
  `{LAWYER: ...}` / `{DATUM}` blocks in `/uvjeti`. These are filled in once the company is
  registered. Leave them exactly as they are.
- Contact page address and phone — same reason.
- Payment/installment integration (CorvusPay) — not yet decided.
- Product names and tier structure — I am renaming these in Shopify myself. Do not rename
  anything, but if you notice a slug typo (e.g. `perfomance-iii`) just list it at the end.

## General constraints

- All user-facing copy in Croatian, matching the existing tone. Keep proper diacritics.
- Currency formatted as Croatian EUR (`1.299,00 €`).
- Do not add new dependencies without asking first.
- Do not modify anything in the Shopify admin — this repo only.
- Keep existing visual design and styling. This is structural work, not a redesign.
- After each phase: run `npm run build`, confirm it passes, then commit.
- If a phase turns out to need decisions I have not covered, stop and ask rather than guess.

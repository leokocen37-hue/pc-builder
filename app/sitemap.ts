import type { MetadataRoute } from "next";
import { shopifyFetch } from "@/lib/shopify";

// shopifyFetch always fetches with `cache: "no-store"` (product data must stay
// live) — that's incompatible with Next trying to prerender this route statically
// at build time, which is what caused the DYNAMIC_SERVER_USAGE error on Vercel.
// Forcing it dynamic makes the route render per-request instead, which is also
// just correct for a sitemap backed by a catalog that changes independently of deploys.
export const dynamic = "force-dynamic";

const SITE_URL = "https://racunalo.hr";

// section -> collection handles that live under it, mirrors lib/product-page.ts's
// SECTIONS config (kept separate/duplicated on purpose — sitemap.ts can't import
// react's cache() from a route segment config file without pulling in server-only
// bits it doesn't need; this list is small and stable enough to just repeat).
const SECTION_COLLECTIONS: { base: string; collections: string[] }[] = [
  { base: "/racunala", collections: ["gaming", "radne-stanice"] },
  { base: "/periferija", collections: ["monitori", "tipkovnice", "misevi", "slusalice"] },
];

const PRODUCTS_QUERY = `
  query SitemapCollection($handle: String!) {
    collection(handle: $handle) {
      products(first: 250) { edges { node { handle updatedAt } } }
    }
  }
`;
type ProductsResp = { collection: { products: { edges: { node: { handle: string; updatedAt: string } }[] } } | null };

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const staticRoutes: MetadataRoute.Sitemap = [
    { url: `${SITE_URL}/`, changeFrequency: "weekly", priority: 1 },
    { url: `${SITE_URL}/konfigurator`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${SITE_URL}/racunala`, changeFrequency: "daily", priority: 0.9 },
    { url: `${SITE_URL}/racunala/gaming`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/racunala/radne-stanice`, changeFrequency: "daily", priority: 0.8 },
    { url: `${SITE_URL}/periferija`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/periferija/monitori`, changeFrequency: "daily", priority: 0.7 },
    { url: `${SITE_URL}/periferija/tipkovnice`, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/periferija/misevi`, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/periferija/slusalice`, changeFrequency: "daily", priority: 0.6 },
    { url: `${SITE_URL}/kontakt`, changeFrequency: "monthly", priority: 0.4 },
    // support
    { url: `${SITE_URL}/o-nama`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/dostava`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/faq`, changeFrequency: "monthly", priority: 0.5 },
    { url: `${SITE_URL}/jamstvo`, changeFrequency: "monthly", priority: 0.5 },
    // legal
    { url: `${SITE_URL}/uvjeti`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/raskid`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/privatnost`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/kolacici`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${SITE_URL}/reklamacije`, changeFrequency: "yearly", priority: 0.3 },
  ];

  const productRoutes: MetadataRoute.Sitemap = [];
  try {
    for (const { base, collections } of SECTION_COLLECTIONS) {
      const results = await Promise.all(
        collections.map((handle) =>
          shopifyFetch<ProductsResp>(PRODUCTS_QUERY, { handle }, { next: { revalidate: 3600 } }).then((r) => ({ handle, r }))
        )
      );
      const seen = new Set<string>();
      results.forEach(({ handle, r }) => {
        r.collection?.products.edges.forEach((e) => {
          if (seen.has(e.node.handle)) return;
          seen.add(e.node.handle);
          productRoutes.push({
            url: `${SITE_URL}${base}/${handle}/${e.node.handle}`,
            lastModified: e.node.updatedAt,
            changeFrequency: "weekly",
            priority: 0.7,
          });
        });
      });
    }
  } catch (e) {
    console.error("sitemap: failed to fetch products", e);
  }

  return [...staticRoutes, ...productRoutes];
}

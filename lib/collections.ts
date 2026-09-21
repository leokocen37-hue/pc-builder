// Shared by every category/collection page (racunala, racunala/[kategorija],
// periferija, periferija/[kategorija]) and the homepage's preview rows — one
// query shape, fetched server-side, instead of each page re-fetching client-side.
import { shopifyFetch } from "./shopify";

export type Money = { amount: string; currencyCode: string };
export type Metafield = { key: string; value: string } | null;
export type ProductNode = {
  id: string; title: string; handle: string; availableForSale: boolean;
  featuredImage?: { url: string; altText?: string | null } | null;
  priceRange: { minVariantPrice: Money };
  metafields?: Metafield[];
  // CPU/GPU/RAM for the card's spec line — only populated on pre-built PCs
  // (specs.* is a separate namespace from the configurator components' pcf.specs)
  specCpu?: { value: string } | null;
  specGpu?: { value: string } | null;
  specRam?: { value: string } | null;
  // which collection handle this product was fetched under — lets listing
  // pages that merge multiple collections (e.g. /racunala, /periferija) build
  // the correct nested /section/kategorija/handle link per product.
  category: string;
};
type CollectionResp = { collection: { products: { edges: { node: Omit<ProductNode, "category"> }[] } } | null };

const QUERY = `
  query Collection($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      products(first: $first) {
        edges { node {
          id title handle availableForSale
          featuredImage { url altText }
          priceRange { minVariantPrice { amount currencyCode } }
          metafields(identifiers: [
            { namespace: "pcf", key: "pick" },
            { namespace: "pcf", key: "recommended" },
            { namespace: "pcf", key: "tier" }
          ]) { key value }
          specCpu: metafield(namespace: "specs", key: "cpu") { value }
          specGpu: metafield(namespace: "specs", key: "gpu") { value }
          specRam: metafield(namespace: "specs", key: "ram") { value }
        }}
      }
    }
  }
`;

// Vendor/family prefixes stripped from spec values so the card line fits —
// "NVIDIA GeForce RTX3050" -> "RTX 3050", "Intel Core i5 14600K" -> "i5 14600K".
// Applied in sequence; each is a no-op if its prefix isn't present. The
// generic "AMD " pattern runs after the more specific "AMD Radeon" one, so
// it only fires on CPU values ("AMD Ryzen ...") and leaves "Ryzen" itself —
// unlike "Core"/"GeForce"/"Radeon", "Ryzen" isn't a fused, self-explanatory
// token without its number (there's no AMD equivalent of "i5"), so stripping
// it would leave a bare, meaningless digit.
const SPEC_VENDOR_PREFIXES = [
  /^NVIDIA\s+GeForce\s+/i,
  /^GeForce\s+/i,
  /^AMD\s+Radeon\s+/i,
  /^Radeon\s+/i,
  /^Intel\s+Core\s+/i,
  /^AMD\s+/i,
];
// Integrated graphics arrive as "Integrirana (Intel UHD 730)". Spelling that
// out on a card eats the whole spec line and pushes the RAM off the end —
// which on office PCs is the one spec that tells two otherwise identical
// models apart (Office Start I and II differ only in 8GB vs 16GB). The
// product page still says "Integrirana" in full.
const INTEGRATED_WRAPPER = /^Integrirana\s*\((.+)\)$/i;

function shortenSpecValue(value: string): string {
  const unwrapped = value.trim().replace(INTEGRATED_WRAPPER, "$1");
  const stripped = SPEC_VENDOR_PREFIXES.reduce((v, re) => v.replace(re, ""), unwrapped);
  // "Ultra7" -> "Ultra 7", "RTX3050" -> "RTX 3050" — but not "i5"/"i7"/"i9",
  // Intel's own fused single-letter+number convention (only 2+ letter runs
  // immediately before a digit get split)
  return stripped.replace(/([A-Za-z]{2,})(\d)/g, "$1 $2");
}

// CPU/GPU/RAM card spec line for pre-built PCs — values only, "·"-joined.
// Whichever of the three are missing are just left out, never padded.
export function specLine(p: Pick<ProductNode, "specCpu" | "specGpu" | "specRam">): string {
  return [p.specCpu?.value, p.specGpu?.value, p.specRam?.value]
    .filter((v): v is string => !!v)
    .map(shortenSpecValue)
    .join(" · ");
}

// The homepage's "od X €" tiles need the cheapest product in a collection, not
// the cheapest of the handful a row happens to show. Shopify's default
// collection order isn't by price, so taking the minimum of the six fetched
// for display put "od 999,99 €" on Uredska računala when the entry model is
// 699,99 € — a price claim that was simply wrong. sortKey: PRICE asks Shopify
// for the cheapest one directly.
const MIN_PRICE_QUERY = `
  query CollectionMinPrice($handle: String!) {
    collection(handle: $handle) {
      products(first: 1, sortKey: PRICE) {
        edges { node { priceRange { minVariantPrice { amount } } } }
      }
    }
  }
`;
type MinPriceResp = {
  collection: { products: { edges: { node: { priceRange: { minVariantPrice: Money } } }[] } } | null;
};

/** Cheapest product in a collection, or null when it's empty/unpriced. */
export async function getCollectionMinPrice(handle: string): Promise<number | null> {
  const r = await shopifyFetch<MinPriceResp>(MIN_PRICE_QUERY, { handle });
  const n = Number(r.collection?.products.edges[0]?.node.priceRange.minVariantPrice.amount);
  return Number.isFinite(n) && n > 0 ? n : null;
}

// fetches one or more collections and merges/dedupes them by product id —
// pass a single handle to keep a collection's results separate (e.g. homepage rows).
export async function getCollectionProducts(handles: string[], first = 30): Promise<ProductNode[]> {
  const results = await Promise.all(
    handles.map((h) => shopifyFetch<CollectionResp>(QUERY, { handle: h, first }).then((r) => ({ handle: h, r })))
  );
  const merged: ProductNode[] = [];
  const seen = new Set<string>();
  results.forEach(({ handle, r }) =>
    r.collection?.products.edges.forEach((e) => {
      if (!seen.has(e.node.id)) { seen.add(e.node.id); merged.push({ ...e.node, category: handle }); }
    })
  );
  return merged;
}

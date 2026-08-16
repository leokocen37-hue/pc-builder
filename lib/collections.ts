// Shared by every category/collection page (gotova-racunala, gaming-racunala,
// radne-stanice, periferija, monitori, tipkovnice, misevi, slusalice) and the
// homepage's preview rows — one query shape, fetched server-side, instead of
// each page re-fetching client-side in a useEffect.
import { shopifyFetch } from "./shopify";

export type Money = { amount: string; currencyCode: string };
export type Metafield = { key: string; value: string } | null;
export type ProductNode = {
  id: string; title: string; handle: string; availableForSale: boolean;
  featuredImage?: { url: string; altText?: string | null } | null;
  priceRange: { minVariantPrice: Money };
  metafields?: Metafield[];
};
type CollectionResp = { collection: { products: { edges: { node: ProductNode }[] } } | null };

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
            { namespace: "pcf", key: "recommended" }
          ]) { key value }
        }}
      }
    }
  }
`;

// fetches one or more collections and merges/dedupes them by product id —
// pass a single handle to keep a collection's results separate (e.g. homepage rows).
export async function getCollectionProducts(handles: string[], first = 30): Promise<ProductNode[]> {
  const results = await Promise.all(
    handles.map((h) => shopifyFetch<CollectionResp>(QUERY, { handle: h, first }))
  );
  const merged: ProductNode[] = [];
  const seen = new Set<string>();
  results.forEach((r) =>
    r.collection?.products.edges.forEach((e) => {
      if (!seen.has(e.node.id)) { seen.add(e.node.id); merged.push(e.node); }
    })
  );
  return merged;
}

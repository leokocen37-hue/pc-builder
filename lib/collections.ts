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

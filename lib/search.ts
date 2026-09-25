import { shopifyFetch } from "@/lib/shopify";
import { SECTIONS, type SectionKey } from "@/lib/product-page";

/**
 * Store-wide product search — computers and peripherals together.
 *
 * The per-collection search in CollectionGrid filters what a page already
 * holds, which is the right thing there and useless from anywhere else. This
 * asks Shopify, so it reaches every product whatever page the visitor is on.
 */

export type SearchHit = {
  id: string;
  title: string;
  handle: string;
  availableForSale: boolean;
  featuredImage?: { url: string; altText?: string | null } | null;
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  /** Where the product lives, resolved from its collections. */
  href: string;
  /** "Gaming računala", "Tipkovnice" … for the result's subtitle. */
  categoryLabel: string | null;
};

type Resp = {
  products: {
    edges: {
      node: {
        id: string;
        title: string;
        handle: string;
        availableForSale: boolean;
        featuredImage?: { url: string; altText?: string | null } | null;
        priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
        collections: { edges: { node: { handle: string } }[] };
      };
    }[];
  };
};

const QUERY = `
  query Search($q: String!, $first: Int!) {
    products(first: $first, query: $q) {
      edges {
        node {
          id
          title
          handle
          availableForSale
          featuredImage { url altText }
          priceRange { minVariantPrice { amount currencyCode } }
          collections(first: 10) { edges { node { handle } } }
        }
      }
    }
  }
`;

/** The section/category a product belongs to, or null if it is in neither. */
function placeOf(collectionHandles: string[]): { href: string; label: string } | null {
  for (const [section, config] of Object.entries(SECTIONS)) {
    for (const [category, label] of Object.entries(config.categories)) {
      if (collectionHandles.includes(category)) {
        return { href: `/${section as SectionKey}/${category}`, label };
      }
    }
  }
  return null;
}

export async function searchProducts(term: string, first = 24): Promise<SearchHit[]> {
  const q = term.trim();
  if (!q) return [];

  // Shopify's own syntax: match the term as a prefix across the default
  // searchable fields, so "rtx 50" finds an RTX 5070 without an exact word.
  const data = await shopifyFetch<Resp>(
    QUERY,
    { q: `${q}*`, first },
    // a search result set is not worth a five-minute cache
    { cache: "no-store" }
  );

  const hits: SearchHit[] = [];
  for (const { node } of data.products.edges) {
    const place = placeOf(node.collections.edges.map((e) => e.node.handle));
    // A product in none of our categories has no page to link to — the
    // configurator components are all products too, and they are not for sale
    // on their own.
    if (!place) continue;
    hits.push({
      id: node.id,
      title: node.title,
      handle: node.handle,
      availableForSale: node.availableForSale,
      featuredImage: node.featuredImage,
      priceRange: node.priceRange,
      href: `${place.href}/${node.handle}`,
      categoryLabel: place.label,
    });
  }
  return hits;
}

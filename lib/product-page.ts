// Shared by both /racunala/[kategorija]/[handle] and /periferija/[kategorija]/[handle]
// — one product query/fetch/validation implementation instead of two copies.
import { cache } from "react";
import { shopifyFetch } from "./shopify";

export type Money = { amount: string; currencyCode: string };
export type Variant = {
  id: string; title: string; availableForSale: boolean;
  price: Money;
  selectedOptions: { name: string; value: string }[];
  image?: { url: string; altText?: string | null } | null;
  sku?: string | null;
};
export type Metafield = { key: string; value: string } | null;
export type Product = {
  id: string; title: string; descriptionHtml: string;
  featuredImage?: { url: string; altText?: string | null } | null;
  images: { edges: { node: { url: string; altText?: string | null } }[] };
  options: { name: string; values: string[] }[];
  variants: { edges: { node: Variant }[] };
  metafields: Metafield[];
  priceRange: { minVariantPrice: Money };
  availableForSale: boolean;
  vendor: string;
  // which collections this product belongs to — used to validate the URL's
  // [kategorija] segment actually matches a real collection for this product.
  collections: { edges: { node: { handle: string } }[] };
};

const QUERY = `
  query Product($handle: String!) {
    product(handle: $handle) {
      id title descriptionHtml vendor
      featuredImage { url altText }
      images(first: 10) { edges { node { url altText } } }
      options { name values }
      variants(first: 50) { edges { node {
        id title availableForSale sku
        price { amount currencyCode }
        selectedOptions { name value }
        image { url altText }
      }}}
      metafields(identifiers: [
        { namespace: "specs", key: "cpu" },
        { namespace: "specs", key: "gpu" },
        { namespace: "specs", key: "ram" },
        { namespace: "specs", key: "storage" },
        { namespace: "specs", key: "full" }
      ]) { key value }
      priceRange { minVariantPrice { amount currencyCode } }
      availableForSale
      collections(first: 10) { edges { node { handle } } }
    }
  }
`;

// shared by generateMetadata and the page body so we only hit Shopify once per request
export const getProductByHandle = cache(async (handle: string): Promise<Product | null> => {
  const data = await shopifyFetch<{ product: Product | null }>(QUERY, { handle });
  return data.product;
});

export const stripHtml = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

// the two top-level sections and the kategorija segments each one accepts —
// kategorija is always the underlying Shopify collection handle.
export const SECTIONS = {
  racunala: {
    base: "/racunala",
    heading: "Gotova računala",
    categories: {
      gaming: "Gaming računala",
      "radne-stanice": "Radne stanice",
    } as Record<string, string>,
  },
  periferija: {
    base: "/periferija",
    heading: "Periferija",
    categories: {
      monitori: "Monitori",
      tipkovnice: "Tipkovnice",
      misevi: "Miševi",
      slusalice: "Slušalice",
    } as Record<string, string>,
  },
} as const;
export type SectionKey = keyof typeof SECTIONS;

export function isValidCategory(section: SectionKey, kategorija: string): boolean {
  return kategorija in SECTIONS[section].categories;
}

export function productBelongsToCategory(product: Product, kategorija: string): boolean {
  return product.collections.edges.some((e) => e.node.handle === kategorija);
}

export function buildProductJsonLd(product: Product, url: string) {
  const sku = product.variants.edges.find((e) => e.node.sku)?.node.sku ?? undefined;
  return {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    description: stripHtml(product.descriptionHtml) || undefined,
    image: product.featuredImage?.url ? [product.featuredImage.url] : undefined,
    sku,
    brand: product.vendor ? { "@type": "Brand", name: product.vendor } : undefined,
    offers: {
      "@type": "Offer",
      url,
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      price: product.priceRange.minVariantPrice.amount,
      availability: product.availableForSale ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
    },
  };
}

export type Crumb = { label: string; href?: string };

export function buildBreadcrumbJsonLd(crumbs: Crumb[], siteUrl: string) {
  return {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: crumbs.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: c.label,
      ...(c.href ? { item: `${siteUrl}${c.href}` } : {}),
    })),
  };
}

import type { Metadata } from "next";
import { cache } from "react";
import { shopifyFetch } from "@/lib/shopify";
import ProductClient from "./ProductClient";

type Money = { amount: string; currencyCode: string };
type SeoProduct = {
  title: string;
  descriptionHtml: string;
  featuredImage?: { url: string; altText?: string | null } | null;
  priceRange: { minVariantPrice: Money };
  availableForSale: boolean;
};

const SEO_QUERY = `
  query ProductSeo($handle: String!) {
    product(handle: $handle) {
      title
      descriptionHtml
      featuredImage { url altText }
      priceRange { minVariantPrice { amount currencyCode } }
      availableForSale
    }
  }
`;

// shared by generateMetadata and the page body so we only hit Shopify once per request
const getProduct = cache(async (handle: string) => {
  const data = await shopifyFetch<{ product: SeoProduct | null }>(SEO_QUERY, { handle });
  return data.product;
});

const stripHtml = (html: string) => html.replace(/<[^>]+>/g, " ").replace(/\s+/g, " ").trim();

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }): Promise<Metadata> {
  const { handle } = await params;
  const product = await getProduct(handle);

  if (!product) {
    return { title: "Proizvod nije pronađen", robots: { index: false, follow: false } };
  }

  const description = stripHtml(product.descriptionHtml).slice(0, 160) || `${product.title} — pogledajte specifikacije i cijenu na RAČUNALO.hr.`;
  const url = `/${handle}`;
  const images = product.featuredImage ? [{ url: product.featuredImage.url, alt: product.featuredImage.altText || product.title }] : undefined;

  return {
    title: product.title,
    description,
    alternates: { canonical: url },
    openGraph: { title: product.title, description, url, images },
    twitter: { title: product.title, description, images: images?.map((i) => i.url) },
  };
}

export default async function Page({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const product = await getProduct(handle);

  const jsonLd = product
    ? {
        "@context": "https://schema.org",
        "@type": "Product",
        name: product.title,
        description: stripHtml(product.descriptionHtml) || undefined,
        image: product.featuredImage?.url ? [product.featuredImage.url] : undefined,
        offers: {
          "@type": "Offer",
          url: `https://racunalo.hr/${handle}`,
          priceCurrency: product.priceRange.minVariantPrice.currencyCode,
          price: product.priceRange.minVariantPrice.amount,
          availability: product.availableForSale ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
        },
      }
    : null;

  return (
    <>
      {jsonLd && (
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd).replace(/</g, "\\u003c") }}
        />
      )}
      <ProductClient />
    </>
  );
}

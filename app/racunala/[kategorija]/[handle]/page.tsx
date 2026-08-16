import type { Metadata } from "next";
import { notFound } from "next/navigation";
import ProductClient from "@/components/ProductClient";
import Breadcrumbs from "@/components/Breadcrumbs";
import JsonLd from "@/components/JsonLd";
import { getCollectionProducts } from "@/lib/collections";
import {
  getProductByHandle,
  isValidCategory,
  productBelongsToCategory,
  stripHtml,
  buildProductJsonLd,
  buildBreadcrumbJsonLd,
  SECTIONS,
} from "@/lib/product-page";

const SITE_URL = "https://racunalo.hr";

export async function generateStaticParams() {
  const results = await Promise.all(
    Object.keys(SECTIONS.racunala.categories).map(async (kategorija) => {
      const products = await getCollectionProducts([kategorija]);
      return products.map((p) => ({ kategorija, handle: p.handle }));
    })
  );
  return results.flat();
}

export async function generateMetadata({ params }: { params: Promise<{ kategorija: string; handle: string }> }): Promise<Metadata> {
  const { kategorija, handle } = await params;
  if (!isValidCategory("racunala", kategorija)) return { robots: { index: false, follow: false } };

  const product = await getProductByHandle(handle);
  if (!product || !productBelongsToCategory(product, kategorija)) {
    return { title: "Proizvod nije pronađen", robots: { index: false, follow: false } };
  }

  const description = stripHtml(product.descriptionHtml).slice(0, 160) || `${product.title} — pogledajte specifikacije i cijenu na RAČUNALO.hr.`;
  const url = `/racunala/${kategorija}/${handle}`;
  const images = product.featuredImage ? [{ url: product.featuredImage.url, alt: product.featuredImage.altText || product.title }] : undefined;

  return {
    title: product.title,
    description,
    alternates: { canonical: url },
    openGraph: { title: product.title, description, url, images },
    twitter: { title: product.title, description, images: images?.map((i) => i.url) },
  };
}

export default async function Page({ params }: { params: Promise<{ kategorija: string; handle: string }> }) {
  const { kategorija, handle } = await params;
  if (!isValidCategory("racunala", kategorija)) notFound();

  const product = await getProductByHandle(handle);
  if (!product || !productBelongsToCategory(product, kategorija)) notFound();

  const url = `/racunala/${kategorija}/${handle}`;
  const jsonLd = buildProductJsonLd(product, `${SITE_URL}${url}`);
  const categoryLabel = SECTIONS.racunala.categories[kategorija];
  const breadcrumbJsonLd = buildBreadcrumbJsonLd(
    [
      { label: "Početna", href: "/" },
      { label: "Računala", href: "/racunala" },
      { label: categoryLabel, href: `/racunala/${kategorija}` },
      { label: product.title },
    ],
    SITE_URL
  );

  return (
    <>
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <div className="rs-root">
        <div className="rs-wrap">
          <Breadcrumbs
            items={[
              { label: "Početna", href: "/" },
              { label: "Računala", href: "/racunala" },
              { label: categoryLabel, href: `/racunala/${kategorija}` },
              { label: product.title },
            ]}
          />
        </div>
      </div>
      <ProductClient product={product} />
    </>
  );
}

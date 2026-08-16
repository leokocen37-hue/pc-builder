import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CollectionView from "@/components/CollectionView";
import { getCollectionProducts } from "@/lib/collections";
import { isValidCategory, SECTIONS } from "@/lib/product-page";

const COPY: Record<string, { title: string; description: string }> = {
  gaming: {
    title: "Gaming računala — Custom PC za igranje",
    description:
      "Gaming računala za visok FPS i igranje na najvišim postavkama — od Starter do Ultimate konfiguracije, ručno sastavljene i testirane u Hrvatskoj.",
  },
  "radne-stanice": {
    title: "Radne stanice — Računala za profesionalni rad",
    description:
      "Snažne radne stanice za montažu, 3D modeliranje, render i zahtjevan profesionalni rad. Testirano prije isporuke, uz 24 mjeseca jamstva.",
  },
};

export async function generateStaticParams() {
  return Object.keys(SECTIONS.racunala.categories).map((kategorija) => ({ kategorija }));
}

export async function generateMetadata({ params }: { params: Promise<{ kategorija: string }> }): Promise<Metadata> {
  const { kategorija } = await params;
  if (!isValidCategory("racunala", kategorija)) return { robots: { index: false, follow: false } };
  const { title, description } = COPY[kategorija];
  const url = `/racunala/${kategorija}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
    twitter: { title, description },
  };
}

export default async function RacunalaKategorijaPage({ params }: { params: Promise<{ kategorija: string }> }) {
  const { kategorija } = await params;
  if (!isValidCategory("racunala", kategorija)) notFound();

  const products = await getCollectionProducts([kategorija]);
  const label = SECTIONS.racunala.categories[kategorija];

  return (
    <CollectionView
      heading={label}
      activeHref={`/racunala/${kategorija}`}
      products={products}
      section="racunala"
      breadcrumbs={[{ label: "Početna", href: "/" }, { label: "Računala", href: "/racunala" }, { label }]}
    />
  );
}

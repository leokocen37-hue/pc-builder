import type { Metadata } from "next";
import { notFound } from "next/navigation";
import CollectionView from "@/components/CollectionView";
import { getCollectionProducts } from "@/lib/collections";
import { isValidCategory, SECTIONS } from "@/lib/product-page";

const PERIFERIJA_TABS = [
  { label: "Sve", href: "/periferija" },
  { label: "Monitori", href: "/periferija/monitori" },
  { label: "Tipkovnice", href: "/periferija/tipkovnice" },
  { label: "Miševi", href: "/periferija/misevi" },
  { label: "Slušalice", href: "/periferija/slusalice" },
];

const COPY: Record<string, { title: string; description: string }> = {
  monitori: {
    title: "Monitori — Gaming i uredski monitori",
    description: "Od brzih 1440p gaming panela do 4K OLED monitora. Pronađi savršen monitor za igre, rad ili kreativan rad.",
  },
  tipkovnice: {
    title: "Tipkovnice — Mehaničke i gaming tipkovnice",
    description: "Mehaničke, Hall-effect i custom tipkovnice za gaming i svakodnevni rad.",
  },
  misevi: {
    title: "Miševi — Gaming i precizni miševi",
    description: "Lagani, precizni i bežični gaming miševi za svaki stil igranja.",
  },
  slusalice: {
    title: "Slušalice — Gaming i bežične slušalice",
    description: "Vrhunski zvuk za igre, glazbu i pozive — žične i bežične slušalice.",
  },
};

export async function generateStaticParams() {
  return Object.keys(SECTIONS.periferija.categories).map((kategorija) => ({ kategorija }));
}

export async function generateMetadata({ params }: { params: Promise<{ kategorija: string }> }): Promise<Metadata> {
  const { kategorija } = await params;
  if (!isValidCategory("periferija", kategorija)) return { robots: { index: false, follow: false } };
  const { title, description } = COPY[kategorija];
  const url = `/periferija/${kategorija}`;
  return {
    title,
    description,
    alternates: { canonical: url },
    openGraph: { title, description, url },
    twitter: { title, description },
  };
}

export default async function PeriferijaKategorijaPage({ params }: { params: Promise<{ kategorija: string }> }) {
  const { kategorija } = await params;
  if (!isValidCategory("periferija", kategorija)) notFound();

  const products = await getCollectionProducts([kategorija]);
  const label = SECTIONS.periferija.categories[kategorija];

  return (
    <CollectionView
      kicker="Periferija"
      heading={label}
      activeHref={`/periferija/${kategorija}`}
      tabs={PERIFERIJA_TABS}
      products={products}
      section="periferija"
      breadcrumbs={[{ label: "Početna", href: "/" }, { label: "Periferija", href: "/periferija" }, { label }]}
    />
  );
}

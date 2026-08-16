import type { Metadata } from "next";
import CollectionView from "@/components/CollectionView";
import { getCollectionProducts } from "@/lib/collections";

const PERIFERIJA_TABS = [
  { label: "Sve", href: "/periferija" },
  { label: "Monitori", href: "/periferija/monitori" },
  { label: "Tipkovnice", href: "/periferija/tipkovnice" },
  { label: "Miševi", href: "/periferija/misevi" },
  { label: "Slušalice", href: "/periferija/slusalice" },
];

const TITLE = "Periferija — Monitori, tipkovnice, miševi i slušalice";
const DESCRIPTION =
  "Oprema za tvoj setup — gaming i uredski monitori, mehaničke tipkovnice, precizni miševi i slušalice vrhunskog zvuka.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/periferija" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/periferija" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default async function PeriferijaPage() {
  const products = await getCollectionProducts(["monitori", "tipkovnice", "misevi", "slusalice"]);
  return (
    <CollectionView
      kicker="Periferija"
      heading="Periferija"
      activeHref="/periferija"
      tabs={PERIFERIJA_TABS}
      products={products}
      section="periferija"
      breadcrumbs={[{ label: "Početna", href: "/" }, { label: "Periferija" }]}
    />
  );
}

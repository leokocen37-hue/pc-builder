import type { Metadata } from "next";
import CollectionView from "@/components/CollectionView";
import { getCollectionProducts } from "@/lib/collections";

const PERIFERIJA_TABS = [
  { label: "Sve", href: "/periferija" },
  { label: "Monitori", href: "/monitori" },
  { label: "Tipkovnice", href: "/tipkovnice" },
  { label: "Miševi", href: "/misevi" },
  { label: "Slušalice", href: "/slusalice" },
];

const TITLE = "Slušalice — Gaming i bežične slušalice";
const DESCRIPTION = "Vrhunski zvuk za igre, glazbu i pozive — žične i bežične slušalice.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/slusalice" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/slusalice" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default async function SlusalicePage() {
  const products = await getCollectionProducts(["slusalice"]);
  return (
    <CollectionView
      kicker="Periferija"
      heading="Slušalice"
      activeHref="/slusalice"
      tabs={PERIFERIJA_TABS}
      products={products}
    />
  );
}

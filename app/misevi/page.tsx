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

const TITLE = "Miševi — Gaming i precizni miševi";
const DESCRIPTION = "Lagani, precizni i bežični gaming miševi za svaki stil igranja.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/misevi" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/misevi" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default async function MiseviPage() {
  const products = await getCollectionProducts(["misevi"]);
  return (
    <CollectionView
      kicker="Periferija"
      heading="Miševi"
      activeHref="/misevi"
      tabs={PERIFERIJA_TABS}
      products={products}
    />
  );
}

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

const TITLE = "Monitori — Gaming i uredski monitori";
const DESCRIPTION =
  "Od brzih 1440p gaming panela do 4K OLED monitora. Pronađi savršen monitor za igre, rad ili kreativan rad.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/monitori" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/monitori" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default async function MonitoriPage() {
  const products = await getCollectionProducts(["monitori"]);
  return (
    <CollectionView
      kicker="Periferija"
      heading="Monitori"
      activeHref="/monitori"
      tabs={PERIFERIJA_TABS}
      products={products}
    />
  );
}

import type { Metadata } from "next";
import CollectionView from "@/components/CollectionView";
import { getCollectionProducts } from "@/lib/collections";

const TITLE = "Gaming računala — Custom PC za igranje";
const DESCRIPTION =
  "Gaming računala za visok FPS i igranje na najvišim postavkama — od Starter do Ultimate konfiguracije, ručno sastavljene i testirane u Hrvatskoj.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/gaming-racunala" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/gaming-racunala" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default async function GamingRacunalaPage() {
  const products = await getCollectionProducts(["gaming"]);
  return (
    <CollectionView
      heading="Gaming računala"
      activeHref="/gaming-racunala"
      products={products}
    />
  );
}

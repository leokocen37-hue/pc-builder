import type { Metadata } from "next";
import CollectionView from "@/components/CollectionView";
import { getCollectionProducts } from "@/lib/collections";

const TITLE = "Gotova računala — Gaming PC i radne stanice";
const DESCRIPTION =
  "Ručno sastavljena i testirana gotova računala, spremna za isporuku. Gaming računala i profesionalne radne stanice uz 24 mjeseca jamstva.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/racunala" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/racunala" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default async function RacunalaPage() {
  const products = await getCollectionProducts(["gaming", "radne-stanice"]);
  return (
    <CollectionView
      heading="Gotova računala"
      activeHref="/racunala"
      products={products}
      section="racunala"
      breadcrumbs={[{ label: "Početna", href: "/" }, { label: "Računala" }]}
    />
  );
}

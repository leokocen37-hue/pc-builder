import type { Metadata } from "next";
import CollectionView from "@/components/CollectionView";

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

export default function GamingRacunalaPage() {
  return (
    <CollectionView
      heading="Gaming računala"
      activeHref="/gaming-racunala"
      collectionHandles={["gaming"]}
    />
  );
}

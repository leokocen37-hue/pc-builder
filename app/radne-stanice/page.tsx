import type { Metadata } from "next";
import CollectionView from "@/components/CollectionView";

const TITLE = "Radne stanice — Računala za profesionalni rad";
const DESCRIPTION =
  "Snažne radne stanice za montažu, 3D modeliranje, render i zahtjevan profesionalni rad. Testirano prije isporuke, uz 24 mjeseca jamstva.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/radne-stanice" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/radne-stanice" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function RadneStanicePage() {
  return (
    <CollectionView
      heading="Radne stanice"
      activeHref="/radne-stanice"
      collectionHandles={["radne-stanice"]}
    />
  );
}

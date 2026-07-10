import type { Metadata } from "next";
import CollectionView from "@/components/CollectionView";

const PERIFERIJA_TABS = [
  { label: "Sve", href: "/periferija" },
  { label: "Monitori", href: "/monitori" },
  { label: "Tipkovnice", href: "/tipkovnice" },
  { label: "Miševi", href: "/misevi" },
  { label: "Slušalice", href: "/slusalice" },
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

export default function PeriferijaPage() {
  return (
    <CollectionView
      kicker="Periferija"
      heading="Periferija"
      activeHref="/periferija"
      tabs={PERIFERIJA_TABS}
      collectionHandles={["monitori", "tipkovnice", "misevi", "slusalice"]}
    />
  );
}

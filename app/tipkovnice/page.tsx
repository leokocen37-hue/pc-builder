import type { Metadata } from "next";
import CollectionView from "@/components/CollectionView";

const PERIFERIJA_TABS = [
  { label: "Sve", href: "/periferija" },
  { label: "Monitori", href: "/monitori" },
  { label: "Tipkovnice", href: "/tipkovnice" },
  { label: "Miševi", href: "/misevi" },
  { label: "Slušalice", href: "/slusalice" },
];

const TITLE = "Tipkovnice — Mehaničke i gaming tipkovnice";
const DESCRIPTION = "Mehaničke, Hall-effect i custom tipkovnice za gaming i svakodnevni rad.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/tipkovnice" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/tipkovnice" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function TipkovnicePage() {
  return (
    <CollectionView
      kicker="Periferija"
      heading="Tipkovnice"
      activeHref="/tipkovnice"
      tabs={PERIFERIJA_TABS}
      collectionHandles={["tipkovnice"]}
    />
  );
}

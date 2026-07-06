import CollectionView from "@/components/CollectionView";

const PERIFERIJA_TABS = [
  { label: "Sve", href: "/periferija" },
  { label: "Monitori", href: "/monitori" },
  { label: "Tipkovnice", href: "/tipkovnice" },
  { label: "Miševi", href: "/misevi" },
  { label: "Slušalice", href: "/slusalice" },
];

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
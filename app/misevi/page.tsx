import CollectionView from "@/components/CollectionView";
 
const PERIFERIJA_TABS = [
  { label: "Sve", href: "/periferija" },
  { label: "Monitori", href: "/monitori" },
  { label: "Tipkovnice", href: "/tipkovnice" },
  { label: "Miševi", href: "/misevi" },
  { label: "Slušalice", href: "/slusalice" },
];
 
export default function MiseviPage() {
  return (
    <CollectionView
      kicker="Periferija"
      heading="Miševi"
      activeHref="/misevi"
      tabs={PERIFERIJA_TABS}
      collectionHandles={["misevi"]}
    />
  );
}
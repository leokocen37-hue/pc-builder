import CollectionView from "@/components/CollectionView";
 
const PERIFERIJA_TABS = [
  { label: "Sve", href: "/periferija" },
  { label: "Monitori", href: "/monitori" },
  { label: "Tipkovnice", href: "/tipkovnice" },
  { label: "Miševi", href: "/misevi" },
];
 
export default function MonitoriPage() {
  return (
    <CollectionView
      kicker="Periferija"
      heading="Monitori"
      activeHref="/monitori"
      tabs={PERIFERIJA_TABS}
      collectionHandles={["monitori"]}
    />
  );
}
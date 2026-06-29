import CollectionView from "@/components/CollectionView";
 
const PERIFERIJA_TABS = [
  { label: "Sve", href: "/periferija" },
  { label: "Monitori", href: "/monitori" },
  { label: "Tipkovnice", href: "/tipkovnice" },
  { label: "Miševi", href: "/misevi" },
];
 
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
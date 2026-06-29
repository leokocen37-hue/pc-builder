import CollectionView from "@/components/CollectionView";
 
export default function PlayStationPage() {
  return (
    <CollectionView
      kicker="PlayStation"
      heading="PlayStation"
      activeHref="/playstation"
      tabs={[{ label: "PlayStation", href: "/playstation" }]}
      collectionHandles={["playstation"]}
    />
  );
}
 import CollectionView from "@/components/CollectionView";
 
export default function RadneStanicePage() {
  return (
    <CollectionView
      heading="Radne stanice"
      activeHref="/radne-stanice"
      collectionHandles={["radne-stanice"]}
    />
  );
}
 
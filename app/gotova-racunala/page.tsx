import CollectionView from "@/components/CollectionView";
 
export default function GotovaRacunalaPage() {
  return (
    <CollectionView
      heading="Gotova računala"
      activeHref="/gotova-racunala"
      collectionHandles={["gaming", "radne-stanice"]}
    />
  );
}
 
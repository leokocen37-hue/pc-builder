import CollectionView from "@/components/CollectionView";
const APPLE_TABS = [
  { label: "Svi Apple", href: "/laptopi/apple" },
  { label: "Air", href: "/laptopi/apple/air" },
  { label: "Pro", href: "/laptopi/apple/pro" },
  { label: "Neo", href: "/laptopi/apple/neo" },
];
export default function MacBookAirPage() {
  return <CollectionView kicker="Apple" heading="MacBook Pro" activeHref="/laptopi/apple/po" tabs={APPLE_TABS} collectionHandles={["macbook-pro"]} />;
}
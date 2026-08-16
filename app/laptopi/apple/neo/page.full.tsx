import CollectionView from "@/components/CollectionView";
import { getCollectionProducts } from "@/lib/collections";
const APPLE_TABS = [
  { label: "Svi Apple", href: "/laptopi/apple" },
  { label: "Air", href: "/laptopi/apple/air" },
  { label: "Pro", href: "/laptopi/apple/pro" },
  { label: "Neo", href: "/laptopi/apple/neo" },
];
export default async function MacBookAirPage() {
  const products = await getCollectionProducts(["macbook-neoS"]);
  return <CollectionView kicker="Apple" heading="MacBook Neo" activeHref="/laptopi/apple/neo" tabs={APPLE_TABS} products={products} />;
}
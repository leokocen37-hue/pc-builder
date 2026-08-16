import CollectionView from "@/components/CollectionView";
import { getCollectionProducts } from "@/lib/collections";
const WIN_TABS = [
  { label: "Svi Windows", href: "/laptopi/windows" },
  { label: "Gaming", href: "/laptopi/windows/gaming" },
  { label: "Ultrabook", href: "/laptopi/windows/ultrabook" },
  { label: "Poslovni", href: "/laptopi/windows/poslovni" },
];
export default async function WinGamingPage() {
  const products = await getCollectionProducts(["laptopi-ultrabook"]);
  return <CollectionView kicker="Windows" heading="Ultrabook" activeHref="/laptopi/windows/ultrabook" tabs={WIN_TABS} products={products} />;
}
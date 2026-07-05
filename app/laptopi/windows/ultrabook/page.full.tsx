import CollectionView from "@/components/CollectionView";
const WIN_TABS = [
  { label: "Svi Windows", href: "/laptopi/windows" },
  { label: "Gaming", href: "/laptopi/windows/gaming" },
  { label: "Ultrabook", href: "/laptopi/windows/ultrabook" },
  { label: "Poslovni", href: "/laptopi/windows/poslovni" },
];
export default function WinGamingPage() {
  return <CollectionView kicker="Windows" heading="Ultrabook" activeHref="/laptopi/windows/ultrabook" tabs={WIN_TABS} collectionHandles={["laptopi-ultrabook"]} />;
}
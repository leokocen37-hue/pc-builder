"use client";
import CategoryHub from "@/components/CategoryHub";
 
export default function WindowsPage() {
  return (
    <CategoryHub
      kicker="Laptopi · Windows"
      title="Windows laptopi"
      subtitle="Od gaminga do uredskog rada — širok izbor Windows laptopa."
      gradient="radial-gradient(85% 130% at 50% 0%,#0a3aa0 0%,#191160 45%,var(--bg) 100%)"
      accent="#2f6ff7"
      boxes={[
        { label: "Gaming", sub: "Snažni za igre", href: "/laptopi/windows/gaming", collectionHandle: "laptopi-gaming" },
        { label: "Ultrabook", sub: "Tanki i lagani", href: "/laptopi/windows/ultrabook", collectionHandle: "laptopi-ultrabook" },
        { label: "Poslovni", sub: "Za posao i ured", href: "/laptopi/windows/poslovni", collectionHandle: "laptopi-poslovni" },
      ]}
      gridHandles={["laptopi-windows"]}
      gridHeading="Svi Windows laptopi"
    />
  );
}
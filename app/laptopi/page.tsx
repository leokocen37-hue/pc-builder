"use client";
import CategoryHub from "@/components/CategoryHub";
 
export default function LaptopiPage() {
  return (
    <CategoryHub
      kicker="Laptopi"
      title="Laptopi"
      subtitle="Apple ili Windows — pronađi savršen laptop za posao, igru ili kreativan rad."
      gradient="radial-gradient(85% 130% at 50% 0%,#3a1f7a 0%,#1a1140 45%,var(--bg) 100%)"
      accent="#d81fd8"
      boxes={[
        { label: "Apple", sub: "MacBook Air, Pro, Neo", href: "/laptopi/apple", collectionHandle: "laptopi-apple" },
        { label: "Windows", sub: "Gaming, Ultrabook, Poslovni", href: "/laptopi/windows", collectionHandle: "laptopi-windows" },
      ]}
      gridHandles={["laptopi-apple", "laptopi-windows"]}
      gridHeading="Svi laptopi"
    />
  );
}
 
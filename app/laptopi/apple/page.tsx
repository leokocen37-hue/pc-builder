"use client";
import CategoryHub from "@/components/CategoryHub";
 
export default function ApplePage() {
  return (
    <CategoryHub
      kicker="Laptopi · Apple"
      title="MacBook"
      subtitle="Snaga, autonomija i izrada vrhunske klase. Odaberi svoj MacBook."
      gradient="radial-gradient(85% 130% at 50% 0%,#3a3f4a 0%,#1c2026 45%,var(--bg) 100%)"
      accent="#c9ccd4"
      boxes={[
        { label: "MacBook Air", sub: "Tanak i lagan", href: "/laptopi/apple/air", collectionHandle: "macbook-air" },
        { label: "MacBook Pro", sub: "Maksimalne performanse", href: "/laptopi/apple/pro", collectionHandle: "macbook-pro" },
        { label: "MacBook Neo", sub: "Najnoviji model", href: "/laptopi/apple/neo", collectionHandle: "macbook-neo", small: true },
      ]}
      gridHandles={["laptopi-apple"]}
      gridHeading="Svi Apple laptopi"
    />
  );
}
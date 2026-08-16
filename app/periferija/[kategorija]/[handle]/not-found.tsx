import type { Metadata } from "next";
import ProductNotFound from "@/components/ProductNotFound";

export const metadata: Metadata = {
  title: "Proizvod nije pronađen",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <ProductNotFound backHref="/periferija" backLabel="Natrag na periferiju" />;
}

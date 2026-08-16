import type { Metadata } from "next";
import ProductNotFound from "@/components/ProductNotFound";

export const metadata: Metadata = {
  title: "Proizvod nije pronađen",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return <ProductNotFound backHref="/racunala" backLabel="Natrag na računala" />;
}

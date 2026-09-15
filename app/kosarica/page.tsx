import type { Metadata } from "next";
import CartPageClient from "@/components/CartPageClient";

const TITLE = "Košarica";
const DESCRIPTION = "Pregled odabranih proizvoda prije narudžbe.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/kosarica" },
  // cart contents live in the browser, there is nothing here to index
  robots: { index: false, follow: true },
};

export default function KosaricaPage() {
  return (
    <div className="rs-root">
      <section className="kos-wrap">
        <div className="rs-wrap">
          <h1 className="kos-h1">Košarica</h1>
          <CartPageClient />
        </div>
      </section>
    </div>
  );
}

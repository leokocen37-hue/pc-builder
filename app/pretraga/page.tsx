import type { Metadata } from "next";
import Link from "next/link";
import { searchProducts } from "@/lib/search";
import { formatMoney } from "@/lib/format-money";
import { shopifyImage } from "@/lib/shopify-image";
import { NOUNS, plural } from "@/lib/plural";
import Breadcrumbs from "@/components/Breadcrumbs";
import SearchBox from "./SearchBox";

export const metadata: Metadata = {
  title: "Pretraga",
  description: "Pretražite sva računala i periferiju na RAČUNALO.hr.",
  // a results page has nothing stable to index
  robots: { index: false, follow: true },
};

export default async function PretragaPage({
  searchParams,
}: {
  searchParams: Promise<{ q?: string }>;
}) {
  const { q } = await searchParams;
  const term = (q || "").trim();
  const hits = term ? await searchProducts(term) : [];

  return (
    <div className="rs-root">
      <section className="rs-coll">
        <div className="rs-wrap">
          <Breadcrumbs items={[{ label: "Početna", href: "/" }, { label: "Pretraga" }]} />
          <div className="rs-coll-head">
            <div className="rs-kicker">Pretraga</div>
            <h1>{term ? `Rezultati za „${term}”` : "Pretraži trgovinu"}</h1>
          </div>

          <SearchBox initial={term} />

          {term && (
            <div className="rs-coll-bar" style={{ borderBottom: "none", marginBottom: 18 }}>
              <span className="rs-coll-count">{plural(hits.length, NOUNS.proizvod)}</span>
            </div>
          )}

          <div className="rs-grid">
            {!term ? (
              <div className="rs-empty">Upišite naziv računala ili komponente — pretražujemo i računala i periferiju.</div>
            ) : hits.length === 0 ? (
              <div className="rs-empty">
                <p>Nema rezultata za „{term}”.</p>
                <div className="rs-empty-actions">
                  <Link href="/racunala" className="rs-tier-pill">Sva računala</Link>
                  <Link href="/periferija" className="rs-tier-pill">Periferija</Link>
                </div>
              </div>
            ) : (
              hits.map((p) => (
                <Link key={p.id} href={p.href} className="rs-card rs-card-fin">
                  <div className="rs-ph">
                    {p.featuredImage?.url ? (
                      <img
                        src={shopifyImage(p.featuredImage.url, 320)}
                        alt={p.featuredImage.altText || p.title}
                        loading="lazy"
                        decoding="async"
                      />
                    ) : (
                      <div className="rs-ph-fallback" />
                    )}
                    {!p.availableForSale && <span className="rs-badge">Uskoro</span>}
                  </div>
                  <div className="rs-card-body">
                    <h4>{p.title}</h4>
                    {p.categoryLabel && <div className="rs-card-specs">{p.categoryLabel}</div>}
                    <div className="rs-price-row">
                      <span className="rs-price">{formatMoney(p.priceRange?.minVariantPrice)}</span>
                      <span className="rs-buy">Detalji →</span>
                    </div>
                  </div>
                </Link>
              ))
            )}
          </div>
        </div>
      </section>
    </div>
  );
}

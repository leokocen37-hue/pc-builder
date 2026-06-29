// → put this at:  components/CollectionView.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { shopifyFetch } from "@/lib/shopify";
import { formatMoney } from "@/lib/cart";

type Money = { amount: string; currencyCode: string };
type ProductNode = {
  id: string; title: string; handle: string; availableForSale: boolean;
  featuredImage?: { url: string; altText?: string | null } | null;
  priceRange: { minVariantPrice: Money };
};
type CollectionResp = { collection: { products: { edges: { node: ProductNode }[] } } | null };

const QUERY = `
  query Collection($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      products(first: $first) {
        edges { node {
          id title handle availableForSale
          featuredImage { url altText }
          priceRange { minVariantPrice { amount currencyCode } }
        }}
      }
    }
  }
`;

// route -> Shopify collection handle(s). Edit if your collection handles differ.
const TABS = [
  { label: "Sva računala", href: "/gotova-racunala" },
  { label: "Gaming računala", href: "/gaming-racunala" },
  { label: "Radne stanice", href: "/radne-stanice" },
];

export default function CollectionView({
  heading,
  activeHref,
  collectionHandles,
}: {
  heading: string;
  activeHref: string;
  collectionHandles: string[]; // one or more Shopify collection handles to merge
}) {
  const [products, setProducts] = useState<ProductNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const results = await Promise.all(
          collectionHandles.map((h) => shopifyFetch<CollectionResp>(QUERY, { handle: h, first: 30 }))
        );
        if (!alive) return;
        const merged: ProductNode[] = [];
        const seen = new Set<string>();
        results.forEach((r) =>
          r.collection?.products.edges.forEach((e) => {
            if (!seen.has(e.node.id)) { seen.add(e.node.id); merged.push(e.node); }
          })
        );
        setProducts(merged);
      } catch (e) {
        console.error("collection fetch failed", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [collectionHandles.join(",")]);

  return (
    <div className="rs-root">
      <section className="rs-coll">
        <div className="rs-wrap">
          <div className="rs-coll-head">
            <div className="rs-kicker">Gotova računala</div>
            <h1>{heading}</h1>
          </div>

          <div className="rs-tabs">
            {TABS.map((t) => (
              <Link key={t.href} href={t.href} className={`rs-tab ${t.href === activeHref ? "active" : ""}`}>
                {t.label}
              </Link>
            ))}
          </div>

          <div className="rs-grid">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <div key={i} className="rs-skel" />)
            ) : products.length === 0 ? (
              <div className="rs-empty">Trenutno nema konfiguracija u ovoj kategoriji.</div>
            ) : (
              products.map((p) => (
                <Link key={p.id} href={`/${p.handle}`} className="rs-card">
                  <div className="rs-ph">
                    {p.featuredImage?.url ? (
                      <img src={p.featuredImage.url} alt={p.featuredImage.altText || p.title} loading="lazy" />
                    ) : (
                      <div className="rs-ph-fallback" />
                    )}
                    {!p.availableForSale && <span className="rs-badge">Uskoro</span>}
                  </div>
                  <div className="rs-card-body">
                    <h4>{p.title}</h4>
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
// → put this at:  components/CollectionView.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { shopifyFetch } from "@/lib/shopify";
import { formatMoney } from "@/lib/cart";

type Money = { amount: string; currencyCode: string };
type Metafield = { key: string; value: string } | null;
type ProductNode = {
  id: string; title: string; handle: string; availableForSale: boolean;
  featuredImage?: { url: string; altText?: string | null } | null;
  priceRange: { minVariantPrice: Money };
  metafields?: Metafield[];
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
          metafields(identifiers: [
            { namespace: "pcf", key: "pick" },
            { namespace: "pcf", key: "recommended" }
          ]) { key value }
        }}
      }
    }
  }
`;

// default tab set (prebuilt PCs). Pass your own `tabs` for other sections (e.g. Periferija).
const PC_TABS = [
  { label: "Sva računala", href: "/gotova-racunala" },
  { label: "Gaming računala", href: "/gaming-racunala" },
  { label: "Radne stanice", href: "/radne-stanice" },
];

type Tab = { label: string; href: string };

// per-page subtitles (shown under the heading). Falls back to none.
const SUBTITLES: Record<string, string> = {
  "/gotova-racunala": "Ručno sastavljena i testirana računala, spremna za isporuku — bez čekanja i nagađanja.",
  "/gaming-racunala": "Konfiguracije optimizirane za visok broj sličica i igranje na visokim postavkama.",
  "/radne-stanice": "Snaga za montažu, 3D, render i najzahtjevniji profesionalni rad.",
  "/periferija": "Pažljivo odabrana oprema — svaki komad s razlogom na popisu.",
  "/monitori": "Od brzih 1440p panela do 4K OLED-a — zaslon koji tvoja grafička zaslužuje.",
  "/tipkovnice": "Mehaničke, Hall-effect i custom tipkovnice za gaming i tipkanje.",
  "/misevi": "Lagani, precizni i bežični — miš za svaki stil igre.",
  "/slusalice": "Bežične i žične slušalice s vrhunskim zvukom i mikrofonom.",
};

export default function CollectionView({
  heading,
  activeHref,
  collectionHandles,
  kicker = "Gotova računala",
  tabs = PC_TABS,
  subtitle,
}: {
  heading: string;
  activeHref: string;
  collectionHandles: string[]; // one or more Shopify collection handles to merge
  kicker?: string;
  tabs?: Tab[];
  subtitle?: string;
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
            <div className="rs-kicker">{kicker}</div>
            <h1>{heading}</h1>
            {(subtitle || SUBTITLES[activeHref]) && <p className="rs-coll-sub">{subtitle || SUBTITLES[activeHref]}</p>}
          </div>

          <div className="rs-coll-bar">
            <nav className="rs-tabs">
              {tabs.map((t) => (
                <Link key={t.href} href={t.href} className={`rs-tab ${t.href === activeHref ? "active" : ""}`}>
                  {t.label}
                </Link>
              ))}
            </nav>
            {!loading && products.length > 0 && (
              <span className="rs-coll-count">{products.length} {products.length === 1 ? "proizvod" : products.length < 5 ? "proizvoda" : "proizvoda"}</span>
            )}
          </div>

          <div className="rs-grid">
            {loading ? (
              Array.from({ length: 6 }).map((_, i) => <div key={i} className="rs-skel" />)
            ) : products.length === 0 ? (
              <div className="rs-empty">Trenutno nema proizvoda u ovoj kategoriji.</div>
            ) : (
              products.map((p) => {
                const pick = p.metafields?.find((m) => m && m.key === "pick")?.value || "";
                const rec = (p.metafields?.find((m) => m && m.key === "recommended")?.value || "").toLowerCase() === "true";
                return (
                  <Link key={p.id} href={`/${p.handle}`} className="rs-card rs-card-fin">
                    <div className="rs-ph">
                      {p.featuredImage?.url ? (
                        <img src={p.featuredImage.url} alt={p.featuredImage.altText || p.title} loading="lazy" />
                      ) : (
                        <div className="rs-ph-fallback" />
                      )}
                      {pick && <span className={`rs-pick ${rec ? "rs-pick-rec" : ""}`}>{rec ? `★ ${pick}` : pick}</span>}
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
                );
              })
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
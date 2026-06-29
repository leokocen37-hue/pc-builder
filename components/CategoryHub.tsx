// → put this at:  components/CategoryHub.tsx
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
type GridResp = { collection: { products: { edges: { node: ProductNode }[] } } | null };
type BoxResp = { collection: { products: { edges: { node: { featuredImage?: { url: string } | null } }[] } } | null };

export type HubBox = {
  label: string;
  sub?: string;
  href: string;
  collectionHandle?: string; // used to pull a representative image for the box
  small?: boolean;            // render as a smaller secondary tile (e.g. "MacBook Neo")
};

const GRID_Q = `
  query Grid($handle: String!) {
    collection(handle: $handle) {
      products(first: 30) {
        edges { node {
          id title handle availableForSale
          featuredImage { url altText }
          priceRange { minVariantPrice { amount currencyCode } }
        }}
      }
    }
  }
`;
const IMG_Q = `query Img($handle: String!){ collection(handle:$handle){ products(first:1){ edges{ node{ featuredImage{ url } } } } } }`;

export default function CategoryHub({
  kicker, title, subtitle, gradient, accent = "#d81fd8",
  boxes, gridHandles, gridHeading = "Sve",
}: {
  kicker: string;
  title: string;
  subtitle: string;
  gradient: string;     // CSS background for the hero
  accent?: string;      // hex used for tags / hover borders
  boxes: HubBox[];
  gridHandles: string[];
  gridHeading?: string;
}) {
  const [boxImgs, setBoxImgs] = useState<Record<string, string>>({});
  const [products, setProducts] = useState<ProductNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      // box images
      const withColl = boxes.filter((b) => b.collectionHandle);
      Promise.all(withColl.map((b) => shopifyFetch<BoxResp>(IMG_Q, { handle: b.collectionHandle })))
        .then((res) => {
          if (!alive) return;
          const map: Record<string, string> = {};
          res.forEach((r, i) => {
            const url = r.collection?.products.edges[0]?.node.featuredImage?.url;
            if (url) map[withColl[i].href] = url;
          });
          setBoxImgs(map);
        })
        .catch(() => {});
      // grid
      try {
        const results = await Promise.all(gridHandles.map((h) => shopifyFetch<GridResp>(GRID_Q, { handle: h })));
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
        console.error("hub grid fetch failed", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [gridHandles.join(","), boxes.map((b) => b.href).join(",")]);

  const big = boxes.filter((b) => !b.small);
  const small = boxes.filter((b) => b.small);

  const renderBox = (b: HubBox) => (
    <Link key={b.href} href={b.href} className={`hub-box ${b.small ? "hub-box--small" : ""}`}>
      <div className="hub-box-img">{boxImgs[b.href] ? <img src={boxImgs[b.href]} alt={b.label} /> : <div className="hub-box-imgfallback" />}</div>
      <div className="hub-box-body">
        <div className="hub-box-tag">MODEL</div>
        <div className="hub-box-title">{b.label}</div>
        {b.sub && <div className="hub-box-sub">{b.sub}</div>}
        <div className="hub-box-cta">Pogledaj →</div>
      </div>
    </Link>
  );

  return (
    <div className="rs-root" style={{ ["--hub-accent" as any]: accent }}>
      <section className="hub-hero" style={{ background: gradient }}>
        <div className="hub-kicker">{kicker}</div>
        <h1>{title}</h1>
        <p>{subtitle}</p>
      </section>

      <div className="hub-boxes" data-cols={big.length}>{big.map(renderBox)}</div>
      {small.length > 0 && <div className="hub-boxes hub-boxes--small">{small.map(renderBox)}</div>}

      <section className="rs-section">
        <div className="rs-wrap">
          <div className="rs-row-head"><h3>{gridHeading}</h3></div>
          <div className="rs-grid">
            {loading ? (
              Array.from({ length: 4 }).map((_, i) => <div key={i} className="rs-skel" />)
            ) : products.length === 0 ? (
              <div className="rs-empty">Uskoro u ponudi.</div>
            ) : (
              products.map((p) => (
                <Link key={p.id} href={`/${p.handle}`} className="rs-card">
                  <div className="rs-ph">
                    {p.featuredImage?.url ? <img src={p.featuredImage.url} alt={p.featuredImage.altText || p.title} loading="lazy" /> : <div className="rs-ph-fallback" />}
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
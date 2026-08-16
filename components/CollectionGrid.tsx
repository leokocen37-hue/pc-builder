// → put this at: components/CollectionGrid.tsx
// Client island: tabs nav + item count + tier-filter pills + the product grid.
// Products arrive pre-fetched from the server (CollectionView) as a prop —
// this component only owns presentation/interaction, no data fetching.
"use client";

import { useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/cart";
import type { ProductNode } from "@/lib/collections";

type Tab = { label: string; href: string };

// Product names in this store follow "<Tier> <roman numeral>" (e.g. "Pro Gamer III",
// "Starter V") for tiered lineups. Strip the numeral to get the tier's display name,
// so e.g. "Starter", "Starter II", "Starter III" all group under one "Starter" filter.
const ROMAN_SUFFIX = /\s+[IVXLCDM]+$/i;
const tierOf = (title: string) => title.replace(ROMAN_SUFFIX, "").trim() || title;

export default function CollectionGrid({
  products,
  tabs,
  activeHref,
}: {
  products: ProductNode[];
  tabs: Tab[];
  activeHref: string;
}) {
  const [activeTier, setActiveTier] = useState<string | null>(null);

  // distinct tiers, in first-seen order — only worth showing as a filter if the
  // titles actually group into a handful of tiers (not just N unrelated products)
  const tiers: string[] = [];
  products.forEach((p) => {
    const t = tierOf(p.title);
    if (!tiers.includes(t)) tiers.push(t);
  });
  const showTierFilter = tiers.length >= 2 && tiers.length < products.length;
  const visibleProducts = showTierFilter && activeTier ? products.filter((p) => tierOf(p.title) === activeTier) : products;

  return (
    <>
      <div className="rs-coll-bar">
        <nav className="rs-tabs">
          {tabs.map((t) => (
            <Link key={t.href} href={t.href} className={`rs-tab ${t.href === activeHref ? "active" : ""}`}>
              {t.label}
            </Link>
          ))}
        </nav>
        {visibleProducts.length > 0 && (
          <span className="rs-coll-count">{visibleProducts.length} {visibleProducts.length === 1 ? "proizvod" : visibleProducts.length < 5 ? "proizvoda" : "proizvoda"}</span>
        )}
      </div>

      {showTierFilter && (
        <div className="rs-tier-row">
          <button className={`rs-tier-pill ${!activeTier ? "active" : ""}`} onClick={() => setActiveTier(null)}>
            Sve
          </button>
          {tiers.map((t) => (
            <button key={t} className={`rs-tier-pill ${activeTier === t ? "active" : ""}`} onClick={() => setActiveTier(t)}>
              {t}
            </button>
          ))}
        </div>
      )}

      <div className="rs-grid">
        {products.length === 0 ? (
          <div className="rs-empty">Trenutno nema proizvoda u ovoj kategoriji.</div>
        ) : (
          visibleProducts.map((p) => {
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
    </>
  );
}

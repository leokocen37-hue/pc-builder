// → put this at: components/CollectionGrid.tsx
// Client island: tabs nav + item count + tier-filter pills + the product grid.
// Products arrive pre-fetched from the server (CollectionView) as a prop —
// this component only owns presentation/interaction, no data fetching.
"use client";

import { useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/cart";
import { specLine, type ProductNode } from "@/lib/collections";
import type { SectionKey } from "@/lib/product-page";

type Tab = { label: string; href: string };

// Tier comes from the product's pcf.tier metafield (set in Shopify), not
// inferred from the title — title-matching broke on the "Perfomance" typo
// (a separate tier from "Performance") and on any product whose name has no
// trailing numeral (each became its own one-item tier). Known tiers render
// in this order; a tier value Shopify has that isn't listed here yet still
// shows (appended after the known ones) instead of silently vanishing.
const TIER_ORDER = [
  "Starter", "Performance", "Pro Gamer", "Elite", "Ultimate",
  "Workstation", "Creator", "Power Studio", "Render Pro", "Titan",
];
const NO_TIER = "Ostalo";
const tierOf = (p: ProductNode): string => p.metafields?.find((m) => m && m.key === "tier")?.value?.trim() || NO_TIER;

export default function CollectionGrid({
  products,
  tabs,
  activeHref,
  section,
}: {
  products: ProductNode[];
  tabs: Tab[];
  activeHref: string;
  section?: SectionKey;
}) {
  const linkFor = (p: ProductNode) => (section ? `/${section}/${p.category}/${p.handle}` : `/${p.handle}`);
  const [activeTier, setActiveTier] = useState<string | null>(null);

  // known tiers first (in TIER_ORDER), then any tier value present in the data
  // that isn't in TIER_ORDER yet, then the no-tier fallback last
  const presentTiers = new Set(products.map(tierOf));
  const tiers = [
    ...TIER_ORDER.filter((t) => presentTiers.has(t)),
    ...[...presentTiers].filter((t) => t !== NO_TIER && !TIER_ORDER.includes(t)),
    ...(presentTiers.has(NO_TIER) ? [NO_TIER] : []),
  ];
  const showTierFilter = tiers.length >= 2;
  const visibleProducts = showTierFilter && activeTier ? products.filter((p) => tierOf(p) === activeTier) : products;

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
              <Link key={p.id} href={linkFor(p)} className="rs-card rs-card-fin">
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
                  {specLine(p) && <div className="rs-card-specs">{specLine(p)}</div>}
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

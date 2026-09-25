// → put this at: components/CollectionGrid.tsx
// Client island: tabs nav + search + sort + tier-filter pills + the product
// grid. Products arrive pre-fetched from the server (CollectionView) as a
// prop — this component only owns presentation/interaction, no data fetching.
"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { formatMoney } from "@/lib/cart";
import { specLine, type ProductNode } from "@/lib/collections";
import type { SectionKey } from "@/lib/product-page";
import { NOUNS, plural } from "@/lib/plural";
import { shopifyImage } from "@/lib/shopify-image";

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

type SortKey = "default" | "price-asc" | "price-desc" | "title";
const SORTS: { key: SortKey; label: string }[] = [
  // "Preporučeno" is the order the server handed us, which is the order set in
  // Shopify — a merchandising decision, so it stays the default.
  { key: "default", label: "Preporučeno" },
  { key: "price-asc", label: "Cijena: niža → viša" },
  { key: "price-desc", label: "Cijena: viša → niža" },
  { key: "title", label: "Naziv: A → Ž" },
];

const priceOf = (p: ProductNode) => Number(p.priceRange?.minVariantPrice?.amount || 0);

// Nobody types "Računala" with the diacritics when searching, so fold them
// away: "racunalo", "Računalo" and "RAČUNALO" are one query. đ has no
// decomposed form, so it needs its own pass before NFD handles č/ć/š/ž.
const fold = (s: string) =>
  s.toLowerCase().replace(/đ/g, "d").normalize("NFD").replace(/[̀-ͯ]/g, "");

// Searchable text per product: the name, the spec line printed under it, and
// the tier — so "starter" finds the Starters and "rtx 5060" finds what has one.
const haystackOf = (p: ProductNode) => fold([p.title, specLine(p), tierOf(p)].join(" "));

// Croatian agreement lives in one place now — see lib/plural.ts
const productCount = (n: number) => plural(n, NOUNS.proizvod);

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
  const [query, setQuery] = useState("");
  const [sort, setSort] = useState<SortKey>("default");

  // known tiers first (in TIER_ORDER), then any tier value present in the data
  // that isn't in TIER_ORDER yet, then the no-tier fallback last
  const presentTiers = new Set(products.map(tierOf));
  const tiers = [
    ...TIER_ORDER.filter((t) => presentTiers.has(t)),
    ...[...presentTiers].filter((t) => t !== NO_TIER && !TIER_ORDER.includes(t)),
    ...(presentTiers.has(NO_TIER) ? [NO_TIER] : []),
  ];
  const showTierFilter = tiers.length >= 2;

  const visibleProducts = useMemo(() => {
    let list = products;

    if (showTierFilter && activeTier) list = list.filter((p) => tierOf(p) === activeTier);

    // every word has to match somewhere, so "starter ii" narrows rather than widens
    const terms = fold(query).split(/\s+/).filter(Boolean);
    if (terms.length > 0) {
      list = list.filter((p) => {
        const hay = haystackOf(p);
        return terms.every((t) => hay.includes(t));
      });
    }

    if (sort === "default") return list;
    // copy first: sorting the prop array in place would reorder the server's data
    return [...list].sort((a, b) => {
      if (sort === "price-asc") return priceOf(a) - priceOf(b) || a.title.localeCompare(b.title, "hr");
      if (sort === "price-desc") return priceOf(b) - priceOf(a) || a.title.localeCompare(b.title, "hr");
      return a.title.localeCompare(b.title, "hr");
    });
  }, [products, activeTier, showTierFilter, query, sort]);

  const filtering = query.trim().length > 0 || activeTier !== null;
  const resetFilters = () => {
    setQuery("");
    setActiveTier(null);
  };

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
          <span className="rs-coll-count">{productCount(visibleProducts.length)}</span>
        )}
      </div>

      {products.length > 0 && (
        <div className="rs-coll-tools">
          <div className="rs-search">
            <span className="rs-search-ic" aria-hidden="true">
              <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
            </span>
            <input
              type="search"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Pretraži po nazivu ili komponenti…"
              aria-label="Pretraži proizvode"
            />
            {query && (
              <button className="rs-search-x" onClick={() => setQuery("")} aria-label="Očisti pretragu">
                ✕
              </button>
            )}
          </div>
          <div className="rs-sort">
            <label htmlFor="rs-sort-select">Sortiraj</label>
            <select id="rs-sort-select" value={sort} onChange={(e) => setSort(e.target.value as SortKey)}>
              {SORTS.map((s) => (
                <option key={s.key} value={s.key}>{s.label}</option>
              ))}
            </select>
          </div>
        </div>
      )}

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
        ) : visibleProducts.length === 0 ? (
          // a search that finds nothing has to say so and offer the way out,
          // otherwise the page just looks broken
          <div className="rs-empty">
            <p>Nema rezultata{query.trim() ? ` za "${query.trim()}"` : ""}.</p>
            <div className="rs-empty-actions">
              <button className="rs-tier-pill" onClick={resetFilters}>Poništi filtere</button>
              {section === "racunala" && activeHref !== "/racunala" && (
                <Link href="/racunala" className="rs-tier-pill">Pretraži sva računala</Link>
              )}
            </div>
          </div>
        ) : (
          visibleProducts.map((p) => {
            const pick = p.metafields?.find((m) => m && m.key === "pick")?.value || "";
            const rec = (p.metafields?.find((m) => m && m.key === "recommended")?.value || "").toLowerCase() === "true";
            return (
              <Link key={p.id} href={linkFor(p)} className="rs-card rs-card-fin">
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

      {filtering && visibleProducts.length > 0 && (
        <div className="rs-coll-foot">
          <button className="rs-tier-pill" onClick={resetFilters}>Poništi filtere</button>
        </div>
      )}
    </>
  );
}

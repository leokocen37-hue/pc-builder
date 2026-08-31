"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { useCart, formatMoney, formatEUR } from "@/lib/cart";
import type { Product } from "@/lib/product-page";
import { SITE } from "@/lib/site-config";

// dated version tag for the withdrawal-right notice text below — bump this
// (and keep the old text in git history) whenever the notice copy changes,
// so a past order's saved tag can be matched back to the exact text a buyer
// actually saw. See uvjeti-jednostrani-raskid-spec.md section 3.
const RASKID_NOTICE_VERSION = "gotova-racunala-2026-08";

// callers are expected to have already handled the missing/mismatched-category
// case via notFound() (see the segment-scoped not-found.tsx next to each page.tsx)
// before rendering this — product is always real here.
export default function ProductClient({ product, section }: { product: Product; section: "racunala" | "periferija" }) {
  const { addProduct } = useCart();

  const [variantId, setVariantId] = useState<string | null>(() => {
    const firstAvail = product.variants.edges.find((e) => e.node.availableForSale)?.node
      ?? product.variants.edges[0]?.node;
    return firstAvail?.id ?? null;
  });
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);

  const variants = product.variants.edges.map((e) => e.node);
  const selected = useMemo(() => variants.find((v) => v.id === variantId) ?? null, [variants, variantId]);
  const images = product.images.edges.map((e) => e.node).length ? product.images.edges.map((e) => e.node) : (product.featuredImage ? [product.featuredImage] : []);
  const hasRealOptions = product.options.some((o) => !(o.values.length === 1 && o.values[0] === "Default Title"));

  // --- specs from Shopify metafields (namespace "specs") ---
  const mf = (key: string) => product.metafields?.find((m) => m && m.key === key)?.value || "";
  const highlights = [
    { label: "Procesor", value: mf("cpu") },
    { label: "Grafička", value: mf("gpu") },
    { label: "Memorija", value: mf("ram") },
    { label: "Pohrana", value: mf("storage") },
  ].filter((h) => h.value);
  // full spec: one "Label: Value" per line
  const specRows = mf("full")
    .split("\n")
    .map((line) => line.trim())
    .filter(Boolean)
    .map((line) => {
      const idx = line.indexOf(":");
      return idx === -1 ? { label: "", value: line } : { label: line.slice(0, idx).trim(), value: line.slice(idx + 1).trim() };
    });

  return (
    <div className="rs-root">
      <section className="rs-pdp">
        <div className="rs-wrap rs-pdp-grid">
          {/* gallery */}
          <div>
            <div className="rs-gallery-main">
              {images[activeImg]?.url
                ? <img src={images[activeImg].url} alt={images[activeImg].altText || product.title} />
                : <div className="rs-ph-fallback" />}
            </div>
            {images.length > 1 && (
              <div className="rs-thumbs">
                {images.map((img, i) => (
                  <div key={i} className={`rs-thumb ${i === activeImg ? "active" : ""}`} onClick={() => setActiveImg(i)}>
                    <img src={img.url} alt={img.altText || ""} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* info */}
          <div className="rs-pdp-info">
            <h1>{product.title}</h1>
            <div className="rs-pdp-price">{formatMoney(selected?.price)}</div>
            <div className="rs-pdp-delivery">
              <span>
                {selected && Number(selected.price.amount) >= SITE.freeShippingFrom
                  ? "✓ Besplatna dostava"
                  : `Besplatna dostava iznad ${formatEUR(SITE.freeShippingFrom)}`}
              </span>
              <span className="rs-pdp-delivery-sep">·</span>
              <span>Isporuka za {SITE.buildDaysMin}–{SITE.buildDaysMax} radnih dana</span>
            </div>

            {highlights.length > 0 && (
              <div className="rs-spec-highlights">
                {highlights.map((h) => (
                  <div key={h.label} className="rs-spec-hl">
                    <div className="rs-spec-hl-label">{h.label}</div>
                    <div className="rs-spec-hl-value">{h.value}</div>
                  </div>
                ))}
              </div>
            )}

            {hasRealOptions && (
              <div className="rs-opt">
                <div className="rs-opt-label">Varijanta</div>
                <div className="rs-opt-vals">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      className={`rs-chip ${v.id === variantId ? "active" : ""}`}
                      disabled={!v.availableForSale}
                      onClick={() => { setVariantId(v.id); if (v.image) { const idx = images.findIndex((im) => im.url === v.image!.url); if (idx >= 0) setActiveImg(idx); } }}
                    >
                      {v.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selected && !selected.availableForSale && <div className="rs-soldout">Trenutno nedostupno</div>}

            <div className="rs-qty">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)}>+</button>
            </div>

            <button
              className="rs-btn"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={!selected?.availableForSale}
              onClick={() =>
                selected &&
                addProduct({
                  variantId: selected.id,
                  title: product.title,
                  price: Number(selected.price.amount),
                  image: selected.image?.url || product.featuredImage?.url || undefined,
                  variantTitle: selected.title !== "Default Title" ? selected.title : undefined,
                  quantity: qty,
                  section,
                  // recorded automatically, no buyer interaction — see the
                  // dated-version comment on RASKID_NOTICE_VERSION above
                  raskidObavijest: section === "racunala" ? RASKID_NOTICE_VERSION : undefined,
                })
              }
            >
              {selected?.availableForSale ? "Dodaj u košaricu" : "Nedostupno"}
            </button>

            {/* uvjeti-jednostrani-raskid-spec.md section 3: notice must sit
                right next to the add-to-cart button, visible without any
                interaction — not small print, not below the fold, not in a
                closed accordion. */}
            {section === "racunala" ? (
              <div className="rs-raskid-notice rs-raskid-notice-strong">
                Ovo računalo ne držimo na zalihi. Riječ je o preporučenoj konfiguraciji koju sastavljamo nakon
                vaše narudžbe, prema odabranim komponentama. Za takvu robu, sukladno Zakonu o zaštiti potrošača,
                ne postoji pravo na jednostrani raskid ugovora u roku od 14 dana. <Link href="/raskid">Više u Uvjetima →</Link>
              </div>
            ) : (
              <div className="rs-raskid-notice">
                Pravo na povrat u roku od 14 dana. <Link href="/raskid">Uvjeti →</Link>
              </div>
            )}
          </div>
        </div>

        {/* --- description + full specification (from Shopify) --- */}
        {(product.descriptionHtml || specRows.length > 0) && (
          <div className="rs-wrap rs-pdp-detail">
            {product.descriptionHtml && (
              <div className="rs-pdp-detail-desc">
                <h2 className="rs-detail-h">Opis</h2>
                <div className="rs-pdp-desc" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
              </div>
            )}
            {specRows.length > 0 && (
              <div className="rs-pdp-detail-spec">
                <h2 className="rs-detail-h">Specifikacije</h2>
                <table className="rs-spec-table">
                  <tbody>
                    {specRows.map((r, i) => (
                      <tr key={i}>
                        {r.label ? <><th>{r.label}</th><td>{r.value}</td></> : <td colSpan={2}>{r.value}</td>}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}
      </section>
    </div>
  );
}

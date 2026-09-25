"use client";

import { useState } from "react";
import Link from "next/link";
import { useCart, formatEUR, splitSummary } from "@/lib/cart";
import CrossSell from "@/components/CrossSell";
import TermsAcceptance from "@/components/TermsAcceptance";
import { FREE_SHIPPING_FROM, shippingFor } from "@/lib/pricing";

export default function CartPageClient() {
  const { items, count, subtotal, updateQty, removeItem, checkout, checkoutBusy, termsAccepted } = useCart();
  // Shown only once someone actually tries to continue without ticking — a
  // warning next to an untouched checkbox would just be noise.
  const [showTermsHint, setShowTermsHint] = useState(false);
  // the same rule the courier bills by, so the cart doesn't have to hedge
  const shipping = shippingFor(subtotal);

  if (items.length === 0) {
    return (
      <div className="kos-empty">
        <h2>Vaša košarica je prazna</h2>
        <p>Složite računalo po mjeri u konfiguratoru ili pogledajte gotove konfiguracije.</p>
        <div className="kos-empty-cta">
          <Link href="/konfigurator" className="rs-btn">Otvori konfigurator →</Link>
          <Link href="/racunala" className="rs-btn ghost">Gotova računala</Link>
        </div>
      </div>
    );
  }

  return (
    <div className="kos-grid">
      <div className="kos-items">
        {items.map((l) => (
          <div key={l.lineId} className="rs-line kos-line">
            <div className="rs-line-img kos-line-img">
              {l.kind === "product" && l.image ? (
                <img src={l.image} alt={l.title} />
              ) : (
                <div className="kos-line-ph">🖥</div>
              )}
            </div>
            <div className="rs-line-info">
              <div className="rs-line-title kos-line-title">{l.title}</div>
              {l.kind === "custom" ? (
                <details className="rs-line-specs kos-line-specs">
                  <summary>Prikaži komponente</summary>
                  <ul>
                    {splitSummary(l.summary).map((part, i) => (
                      <li key={i}>{part.trim()}</li>
                    ))}
                  </ul>
                </details>
              ) : (
                l.variantTitle && <div className="rs-line-variant">{l.variantTitle}</div>
              )}
              <div className="rs-line-bottom">
                {l.kind === "custom" ? (
                  <span className="rs-line-variant" style={{ margin: 0 }}>Kom. 1</span>
                ) : (
                  <div className="rs-line-qty">
                    <button onClick={() => updateQty(l.lineId, l.quantity - 1)} aria-label="Smanji količinu">−</button>
                    <span>{l.quantity}</span>
                    <button onClick={() => updateQty(l.lineId, l.quantity + 1)} aria-label="Povećaj količinu">+</button>
                  </div>
                )}
                <div className="rs-line-price">{formatEUR(l.price * l.quantity)}</div>
              </div>
              <button className="rs-line-rm" onClick={() => removeItem(l.lineId)}>Ukloni</button>
            </div>
          </div>
        ))}

        <CrossSell />
      </div>

      <aside className="kos-summary">
        <h2 className="kos-summary-h">Sažetak narudžbe</h2>

        <div className="kos-row">
          <span>Međuzbroj ({count} {count === 1 ? "stavka" : "stavki"})</span>
          <span>{formatEUR(subtotal)}</span>
        </div>
        <div className="kos-row kos-row-muted">
          <span>Dostava</span>
          <span>{shipping === 0 ? "Besplatno" : formatEUR(shipping)}</span>
        </div>
        {shipping > 0 && (
          <div className="kos-row kos-row-hint">
            Besplatna dostava za narudžbe od {formatEUR(FREE_SHIPPING_FROM)}.
          </div>
        )}

        <div className="kos-total">
          <span>Ukupno <small>(s PDV-om)</small></span>
          <b>{formatEUR(subtotal + shipping)}</b>
        </div>

        <TermsAcceptance showHint={showTermsHint} />

        {/* Not disabled, in either sense: a disabled button — and one marked
            aria-disabled — swallows the click, and the click is precisely what
            raises the hint. It reads as unavailable, stays operable, and says
            why when used. The invalid state lives on the checkbox, which is
            the field actually missing an answer. */}
        <button
          className={`rs-btn kos-checkout${termsAccepted ? "" : " is-locked"}`}
          disabled={checkoutBusy}
          onClick={() => {
            if (!termsAccepted) { setShowTermsHint(true); return; }
            checkout();
          }}
        >
          {checkoutBusy ? "Otvaram blagajnu…" : "Na blagajnu →"}
        </button>

        <div className="rs-cart-note">Sve cijene uključuju PDV</div>

        <Link href="/racunala" className="kos-continue">← Nastavi kupovinu</Link>
      </aside>
    </div>
  );
}

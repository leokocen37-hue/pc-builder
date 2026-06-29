// → put this at:  components/CartDrawer.tsx
"use client";

import { useCart, formatEUR } from "@/lib/cart";
import CrossSell from "@/components/CrossSell";

export default function CartDrawer() {
  const { items, open, setOpen, updateQty, removeItem, subtotal, checkout, checkoutBusy, count } = useCart();

  return (
    <>
      <div className={`rs-cart-overlay ${open ? "open" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`rs-cart-panel ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="rs-cart-top">
          <h3>Košarica {count ? `(${count})` : ""}</h3>
          <button className="rs-cart-x" onClick={() => setOpen(false)} aria-label="Zatvori">✕</button>
        </div>

        {items.length === 0 ? (
          <div className="rs-cart-empty">
            Vaša košarica je prazna.
            <br /><br />
            <button className="rs-btn ghost" onClick={() => setOpen(false)}>Nastavi kupovinu</button>
          </div>
        ) : (
          <>
            <div className="rs-cart-lines">
              {items.map((l) => (
                <div key={l.lineId} className="rs-line">
                  <div className="rs-line-img">
                    {l.kind === "product" && l.image ? (
                      <img src={l.image} alt={l.title} />
                    ) : (
                      <div style={{ width: "100%", height: "100%", display: "flex", alignItems: "center", justifyContent: "center", color: "var(--accent)", fontSize: 22 }}>🖥</div>
                    )}
                  </div>
                  <div className="rs-line-info">
                    <div className="rs-line-title">{l.title}</div>
                    {l.kind === "custom" ? (
                      <div className="rs-line-variant" style={{ maxHeight: 34, overflow: "hidden" }}>Custom konfiguracija</div>
                    ) : (
                      l.variantTitle && <div className="rs-line-variant">{l.variantTitle}</div>
                    )}
                    <div className="rs-line-bottom">
                      {l.kind === "custom" ? (
                        <span className="rs-line-variant">Kom. 1</span>
                      ) : (
                        <div className="rs-line-qty">
                          <button onClick={() => updateQty(l.lineId, l.quantity - 1)}>−</button>
                          <span>{l.quantity}</span>
                          <button onClick={() => updateQty(l.lineId, l.quantity + 1)}>+</button>
                        </div>
                      )}
                      <div className="rs-line-price">{formatEUR(l.price * l.quantity)}</div>
                    </div>
                    <button className="rs-line-rm" onClick={() => removeItem(l.lineId)}>Ukloni</button>
                  </div>
                </div>
              ))}

              {/* cross-sell: "add a keyboard / mouse / monitor" */}
              <CrossSell />
            </div>

            <div className="rs-cart-foot">
              <div className="rs-cart-sub">
                <span>Međuzbroj</span>
                <b>{formatEUR(subtotal)}</b>
              </div>
              <button
                className="rs-btn"
                style={{ width: "100%", justifyContent: "center", opacity: checkoutBusy ? 0.7 : 1 }}
                disabled={checkoutBusy}
                onClick={checkout}
              >
                {checkoutBusy ? "Otvaram blagajnu…" : "Na blagajnu →"}
              </button>
              <div className="rs-cart-note">Sigurno plaćanje · dostava i PDV obračunavaju se na blagajni</div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
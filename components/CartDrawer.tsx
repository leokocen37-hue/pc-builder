// → put this at:  components/CartDrawer.tsx
"use client";

import { useCart, formatMoney } from "@/lib/cart";

export default function CartDrawer() {
  const { cart, open, setOpen, updateItem, removeItem, busy } = useCart();
  const lines = cart?.lines.edges.map((e) => e.node) ?? [];

  return (
    <>
      <div className={`rs-cart-overlay ${open ? "open" : ""}`} onClick={() => setOpen(false)} />
      <aside className={`rs-cart-panel ${open ? "open" : ""}`} aria-hidden={!open}>
        <div className="rs-cart-top">
          <h3>Košarica {cart?.totalQuantity ? `(${cart.totalQuantity})` : ""}</h3>
          <button className="rs-cart-x" onClick={() => setOpen(false)} aria-label="Zatvori">✕</button>
        </div>

        {lines.length === 0 ? (
          <div className="rs-cart-empty">
            Vaša košarica je prazna.
            <br />
            <br />
            <button className="rs-btn ghost" onClick={() => setOpen(false)}>Nastavi kupovinu</button>
          </div>
        ) : (
          <>
            <div className="rs-cart-lines">
              {lines.map((l) => {
                const variantLabel = l.merchandise.selectedOptions
                  .filter((o) => o.value && o.value !== "Default Title")
                  .map((o) => o.value)
                  .join(" · ");
                return (
                  <div key={l.id} className="rs-line">
                    <div className="rs-line-img">
                      {l.merchandise.product.featuredImage?.url && (
                        <img src={l.merchandise.product.featuredImage.url} alt={l.merchandise.product.title} />
                      )}
                    </div>
                    <div className="rs-line-info">
                      <div className="rs-line-title">{l.merchandise.product.title}</div>
                      {variantLabel && <div className="rs-line-variant">{variantLabel}</div>}
                      <div className="rs-line-bottom">
                        <div className="rs-line-qty">
                          <button disabled={busy} onClick={() => (l.quantity > 1 ? updateItem(l.id, l.quantity - 1) : removeItem(l.id))}>−</button>
                          <span>{l.quantity}</span>
                          <button disabled={busy} onClick={() => updateItem(l.id, l.quantity + 1)}>+</button>
                        </div>
                        <div className="rs-line-price">{formatMoney({ amount: String(Number(l.merchandise.price.amount) * l.quantity), currencyCode: l.merchandise.price.currencyCode })}</div>
                      </div>
                      <button className="rs-line-rm" disabled={busy} onClick={() => removeItem(l.id)}>Ukloni</button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="rs-cart-foot">
              <div className="rs-cart-sub">
                <span>Međuzbroj</span>
                <b>{formatMoney(cart?.cost.subtotalAmount)}</b>
              </div>
              <a
                className="rs-btn"
                style={{ width: "100%", justifyContent: "center" }}
                href={cart?.checkoutUrl}
              >
                Na blagajnu →
              </a>
              <div className="rs-cart-note">Sigurno plaćanje preko Shopify checkouta · dostava i PDV obračunavaju se na blagajni</div>
            </div>
          </>
        )}
      </aside>
    </>
  );
}
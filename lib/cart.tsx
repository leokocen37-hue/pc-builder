// → put this at:  lib/cart.tsx   (draft-order cart: custom builds + real products together)
"use client";

import { createContext, useContext, useEffect, useState, useCallback, useRef, ReactNode } from "react";
import { usePathname } from "next/navigation";
import { TERMS_VERSION } from "@/lib/terms";

/* ---- item types ---- */
// price here is only for the cart UI's own running total — the checkout API
// never trusts it; it re-derives the real price from variantIds server-side.
//
// Terms acceptance is deliberately NOT stored per line: it is given once, in
// the cart, for the whole order, and travels to Shopify as order-level cart
// attributes (see checkout() below and /api/checkout).
type CustomItem = {
  kind: "custom"; lineId: string; title: string; price: number; summary: string; quantity: number; variantIds: string[];
};
type ProductItem = {
  kind: "product"; lineId: string; variantId: string; title: string; price: number; image?: string; variantTitle?: string; quantity: number;
};
export type CartItem = CustomItem | ProductItem;

const LS = "rs_cart_v2";
/** Joins the component list on a custom build, and splits it again in the
 *  cart. Not a comma: a Croatian price carries one ("200,00 €"), so a
 *  comma-split list tore every amount in half. */
export const SUMMARY_SEP = " · ";
/** Legacy carts in localStorage were joined on ", " — fall back so a basket
 *  filled before this deploy still reads as a list. */
export const splitSummary = (summary: string) =>
  summary.includes(SUMMARY_SEP) ? summary.split(SUMMARY_SEP) : summary.split(",");
// The draft order the buyer was last sent to pay for. Leaving for Shopify's
// invoice page is a plain redirect and nothing on the way back says an order
// went through, so the cart remembers what it is waiting on and asks the
// server about it on the next visit.
const PENDING = "rs_pending_order_v1";
// Long enough that an order paid days later still clears the cart, short
// enough that an invoice that was never paid stops being asked about.
const PENDING_TTL = 14 * 24 * 60 * 60 * 1000;

type PendingOrder = { id: string; token: string; at: number };

const uid = () => Math.random().toString(36).slice(2, 10);
// Random enough that draft order ids, which are sequential, can't be walked:
// /api/checkout/status only answers to a caller holding this.
const cartToken = () => {
  try {
    return crypto.randomUUID().replace(/-/g, "");
  } catch {
    return (uid() + uid() + uid() + uid()).slice(0, 32);
  }
};

type Ctx = {
  items: CartItem[];
  open: boolean;
  count: number;
  subtotal: number;
  checkoutBusy: boolean;
  setOpen: (o: boolean) => void;
  addCustomBuild: (b: { title?: string; price: number; summary: string; variantIds: string[] }) => void;
  addProduct: (p: { variantId: string; title: string; price: number; image?: string; variantTitle?: string; quantity?: number }) => void;
  updateQty: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clear: () => void;
  /** Terms acceptance, given once per order on /kosarica. Deliberately NOT
   *  persisted: it lives in memory only, so a reload or a later visit asks
   *  again. */
  termsAccepted: boolean;
  setTermsAccepted: (v: boolean) => void;
  checkout: () => Promise<void>;
};

const CartContext = createContext<Ctx | null>(null);
export const useCart = () => {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart must be used inside <CartProvider>");
  return c;
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [items, setItems] = useState<CartItem[]>([]);
  const [open, setOpen] = useState(false);
  const [checkoutBusy, setCheckoutBusy] = useState(false);
  const [hydrated, setHydrated] = useState(false);

  // Terms acceptance. Plain state, never written to localStorage, so it is
  // unticked on every fresh load — a pre-ticked box carries no legal weight.
  // The timestamp is taken at the moment of ticking, not at checkout, since
  // that is the act being recorded.
  const [termsAccepted, setTermsAcceptedState] = useState(false);
  const termsAcceptedAtRef = useRef<string | null>(null);
  const setTermsAccepted = useCallback((v: boolean) => {
    termsAcceptedAtRef.current = v ? new Date().toISOString() : null;
    setTermsAcceptedState(v);
  }, []);

  // On /kosarica the same list is already on screen, so popping the drawer
  // open after an add (e.g. a cross-sell) would just cover it with a copy of
  // itself. Opening it from the header there still works — only the
  // automatic open is suppressed. Read through a ref so the add callbacks
  // don't need the pathname in their dependency list.
  const pathname = usePathname();
  const onCartPageRef = useRef(false);
  onCartPageRef.current = pathname === "/kosarica";
  const openAfterAdd = useCallback(() => {
    if (!onCartPageRef.current) setOpen(true);
  }, []);

  // load + persist
  useEffect(() => {
    try { const raw = localStorage.getItem(LS); if (raw) setItems(JSON.parse(raw)); } catch {}
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) { try { localStorage.setItem(LS, JSON.stringify(items)); } catch {} }
  }, [items, hydrated]);

  // Coming back from checkout: if the order we last sent the buyer to has been
  // paid, empty the cart — otherwise they return to a cart still holding
  // everything they just bought. Only a *paid* order clears it, so abandoning
  // the Shopify page leaves the cart exactly as it was.
  useEffect(() => {
    if (!hydrated) return;
    let pending: PendingOrder | null = null;
    try {
      const raw = localStorage.getItem(PENDING);
      pending = raw ? (JSON.parse(raw) as PendingOrder) : null;
    } catch {}
    const forget = () => { try { localStorage.removeItem(PENDING); } catch {} };
    if (!pending?.id || !pending?.token) { if (pending) forget(); return; }
    if (Date.now() - (pending.at ?? 0) > PENDING_TTL) { forget(); return; }

    const ctrl = new AbortController();
    fetch(`/api/checkout/status?id=${encodeURIComponent(pending.id)}&token=${encodeURIComponent(pending.token)}`,
      { signal: ctrl.signal })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => { if (d?.completed) { setItems([]); forget(); } })
      // offline, or the check failed — leave the cart alone and try next visit
      .catch(() => {});
    return () => ctrl.abort();
  }, [hydrated]);

  const addCustomBuild = useCallback((b: { title?: string; price: number; summary: string; variantIds: string[] }) => {
    setItems((p) => [...p, { kind: "custom", lineId: uid(), title: b.title || "Custom PC Konfiguracija", price: b.price, summary: b.summary, quantity: 1, variantIds: b.variantIds }]);
    openAfterAdd();
  }, [openAfterAdd]);

  const addProduct = useCallback(
    (pr: { variantId: string; title: string; price: number; image?: string; variantTitle?: string; quantity?: number }) => {
      const qty = pr.quantity ?? 1;
      setItems((p) => {
        const i = p.findIndex((x) => x.kind === "product" && x.variantId === pr.variantId);
        if (i >= 0) { const c = [...p]; (c[i] as ProductItem).quantity += qty; return c; }
        return [...p, { kind: "product", lineId: uid(), variantId: pr.variantId, title: pr.title, price: pr.price, image: pr.image, variantTitle: pr.variantTitle, quantity: qty }];
      });
      openAfterAdd();
    },
    [openAfterAdd]
  );

  const updateQty = useCallback((lineId: string, quantity: number) => {
    setItems((p) => (quantity <= 0 ? p.filter((x) => x.lineId !== lineId) : p.map((x) => (x.lineId === lineId ? { ...x, quantity } : x))));
  }, []);
  const removeItem = useCallback((lineId: string) => setItems((p) => p.filter((x) => x.lineId !== lineId)), []);
  const clear = useCallback(() => setItems([]), []);

  const count = items.reduce((s, i) => s + i.quantity, 0);
  const subtotal = items.reduce((s, i) => s + i.price * i.quantity, 0);

  const checkout = useCallback(async () => {
    if (items.length === 0) return;
    // the UI gates this too, but never send an order without the acceptance
    // that is supposed to be recorded on it
    if (!termsAccepted) return;
    setCheckoutBusy(true);
    try {
      const token = cartToken();
      const payload = {
        kosaricaToken: token,
        items: items.map((i) =>
          i.kind === "custom"
            ? { kind: "custom", title: i.title, summary: i.summary, quantity: i.quantity, variantIds: i.variantIds }
            : { kind: "product", variantId: i.variantId, quantity: i.quantity }
        ),
        uvjeti: {
          prihvat: "da",
          verzija: TERMS_VERSION,
          vrijeme: termsAcceptedAtRef.current ?? new Date().toISOString(),
        },
      };
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.draftOrder?.invoiceUrl) {
        // note what we are waiting on before handing over to Shopify
        try {
          localStorage.setItem(
            PENDING,
            JSON.stringify({ id: data.draftOrder.id, token, at: Date.now() } satisfies PendingOrder)
          );
        } catch {}
        window.location.href = data.draftOrder.invoiceUrl;
      } else {
        alert("Greška pri kreiranju narudžbe: " + (data.error || data.userErrors?.[0]?.message || "nepoznato"));
        setCheckoutBusy(false);
      }
    } catch (e) {
      console.error("checkout failed", e);
      alert("Serverska greška pri naplati.");
      setCheckoutBusy(false);
    }
  }, [items, termsAccepted]);

  return (
    <CartContext.Provider value={{ items, open, count, subtotal, checkoutBusy, setOpen, addCustomBuild, addProduct, updateQty, removeItem, clear, termsAccepted, setTermsAccepted, checkout }}>
      {children}
    </CartContext.Provider>
  );
}

/* money helpers */
// re-exported so the many client components importing it from here are
// unaffected; the definition lives in lib/pricing.ts, which the server can use
export { formatEUR } from "@/lib/pricing";
export function formatMoney(m?: { amount: string; currencyCode: string }) {
  if (!m) return "Na upit";
  const n = Number(m.amount);
  if (!n || n <= 0) return "Na upit";
  return new Intl.NumberFormat("hr-HR", { style: "currency", currency: m.currencyCode || "EUR" }).format(n);
}
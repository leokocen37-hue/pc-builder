// → put this at:  lib/cart.tsx   (draft-order cart: custom builds + real products together)
"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";

/* ---- item types ---- */
type CustomItem = { kind: "custom"; lineId: string; title: string; price: number; summary: string; quantity: number };
type ProductItem = { kind: "product"; lineId: string; variantId: string; title: string; price: number; image?: string; variantTitle?: string; quantity: number };
export type CartItem = CustomItem | ProductItem;

const LS = "rs_cart_v2";
const uid = () => Math.random().toString(36).slice(2, 10);

type Ctx = {
  items: CartItem[];
  open: boolean;
  count: number;
  subtotal: number;
  checkoutBusy: boolean;
  setOpen: (o: boolean) => void;
  addCustomBuild: (b: { title?: string; price: number; summary: string }) => void;
  addProduct: (p: { variantId: string; title: string; price: number; image?: string; variantTitle?: string; quantity?: number }) => void;
  updateQty: (lineId: string, quantity: number) => void;
  removeItem: (lineId: string) => void;
  clear: () => void;
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

  // load + persist
  useEffect(() => {
    try { const raw = localStorage.getItem(LS); if (raw) setItems(JSON.parse(raw)); } catch {}
    setHydrated(true);
  }, []);
  useEffect(() => {
    if (hydrated) { try { localStorage.setItem(LS, JSON.stringify(items)); } catch {} }
  }, [items, hydrated]);

  const addCustomBuild = useCallback((b: { title?: string; price: number; summary: string }) => {
    setItems((p) => [...p, { kind: "custom", lineId: uid(), title: b.title || "Custom PC Konfiguracija", price: b.price, summary: b.summary, quantity: 1 }]);
    setOpen(true);
  }, []);

  const addProduct = useCallback(
    (pr: { variantId: string; title: string; price: number; image?: string; variantTitle?: string; quantity?: number }) => {
      const qty = pr.quantity ?? 1;
      setItems((p) => {
        const i = p.findIndex((x) => x.kind === "product" && x.variantId === pr.variantId);
        if (i >= 0) { const c = [...p]; (c[i] as ProductItem).quantity += qty; return c; }
        return [...p, { kind: "product", lineId: uid(), variantId: pr.variantId, title: pr.title, price: pr.price, image: pr.image, variantTitle: pr.variantTitle, quantity: qty }];
      });
      setOpen(true);
    },
    []
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
    setCheckoutBusy(true);
    try {
      const payload = {
        items: items.map((i) =>
          i.kind === "custom"
            ? { kind: "custom", title: i.title, price: i.price, summary: i.summary, quantity: i.quantity }
            : { kind: "product", variantId: i.variantId, quantity: i.quantity }
        ),
      };
      const res = await fetch("/api/checkout", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(payload) });
      const data = await res.json();
      if (data.draftOrder?.invoiceUrl) {
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
  }, [items]);

  return (
    <CartContext.Provider value={{ items, open, count, subtotal, checkoutBusy, setOpen, addCustomBuild, addProduct, updateQty, removeItem, clear, checkout }}>
      {children}
    </CartContext.Provider>
  );
}

/* money helpers */
export const formatEUR = (n: number) => new Intl.NumberFormat("hr-HR", { style: "currency", currency: "EUR" }).format(n || 0);
export function formatMoney(m?: { amount: string; currencyCode: string }) {
  if (!m) return "Na upit";
  const n = Number(m.amount);
  if (!n || n <= 0) return "Na upit";
  return new Intl.NumberFormat("hr-HR", { style: "currency", currency: m.currencyCode || "EUR" }).format(n);
}
// → put this at:  lib/cart.tsx
"use client";

import { createContext, useContext, useEffect, useState, useCallback, ReactNode } from "react";
import { shopifyFetch } from "@/lib/shopify";

/* ---- types ---- */
type Money = { amount: string; currencyCode: string };
export type CartLine = {
  id: string;
  quantity: number;
  merchandise: {
    id: string;
    title: string;
    price: Money;
    product: { title: string; handle: string; featuredImage?: { url: string; altText?: string | null } | null };
    selectedOptions: { name: string; value: string }[];
  };
};
export type Cart = {
  id: string;
  checkoutUrl: string;
  totalQuantity: number;
  cost: { subtotalAmount: Money };
  lines: { edges: { node: CartLine }[] };
};

const CART_FIELDS = `
  id
  checkoutUrl
  totalQuantity
  cost { subtotalAmount { amount currencyCode } }
  lines(first: 50) {
    edges { node {
      id
      quantity
      merchandise {
        ... on ProductVariant {
          id
          title
          price { amount currencyCode }
          product { title handle featuredImage { url altText } }
          selectedOptions { name value }
        }
      }
    }}
  }
`;

const Q_GET = `query Cart($id: ID!) { cart(id: $id) { ${CART_FIELDS} } }`;
const M_CREATE = `mutation Create($lines:[CartLineInput!]) { cartCreate(input:{lines:$lines}) { cart { ${CART_FIELDS} } userErrors { message } } }`;
const M_ADD = `mutation Add($cartId:ID!,$lines:[CartLineInput!]!){ cartLinesAdd(cartId:$cartId,lines:$lines){ cart { ${CART_FIELDS} } userErrors { message } } }`;
const M_UPDATE = `mutation Upd($cartId:ID!,$lines:[CartLineUpdateInput!]!){ cartLinesUpdate(cartId:$cartId,lines:$lines){ cart { ${CART_FIELDS} } userErrors { message } } }`;
const M_REMOVE = `mutation Rem($cartId:ID!,$lineIds:[ID!]!){ cartLinesRemove(cartId:$cartId,lineIds:$lineIds){ cart { ${CART_FIELDS} } userErrors { message } } }`;

const LS_KEY = "rs_cart_id";

type Ctx = {
  cart: Cart | null;
  open: boolean;
  busy: boolean;
  setOpen: (o: boolean) => void;
  addItem: (variantId: string, quantity?: number) => Promise<void>;
  updateItem: (lineId: string, quantity: number) => Promise<void>;
  removeItem: (lineId: string) => Promise<void>;
  count: number;
};

const CartContext = createContext<Ctx | null>(null);
export const useCart = () => {
  const c = useContext(CartContext);
  if (!c) throw new Error("useCart must be used inside <CartProvider>");
  return c;
};

export function CartProvider({ children }: { children: ReactNode }) {
  const [cart, setCart] = useState<Cart | null>(null);
  const [open, setOpen] = useState(false);
  const [busy, setBusy] = useState(false);

  // load existing cart from localStorage on first mount
  useEffect(() => {
    const id = typeof window !== "undefined" ? localStorage.getItem(LS_KEY) : null;
    if (!id) return;
    (async () => {
      try {
        const d = await shopifyFetch<{ cart: Cart | null }>(Q_GET, { id });
        if (d.cart) setCart(d.cart);
        else localStorage.removeItem(LS_KEY); // expired/invalid
      } catch {
        /* ignore */
      }
    })();
  }, []);

  const persist = useCallback((c: Cart | null) => {
    setCart(c);
    if (typeof window !== "undefined") {
      if (c?.id) localStorage.setItem(LS_KEY, c.id);
      else localStorage.removeItem(LS_KEY);
    }
  }, []);

  const addItem = useCallback(
    async (variantId: string, quantity = 1) => {
      setBusy(true);
      try {
        const line = { merchandiseId: variantId, quantity };
        if (!cart) {
          const d = await shopifyFetch<{ cartCreate: { cart: Cart } }>(M_CREATE, { lines: [line] });
          persist(d.cartCreate.cart);
        } else {
          const d = await shopifyFetch<{ cartLinesAdd: { cart: Cart } }>(M_ADD, { cartId: cart.id, lines: [line] });
          persist(d.cartLinesAdd.cart);
        }
        setOpen(true);
      } catch (e) {
        console.error("addItem failed", e);
        alert("Greška pri dodavanju u košaricu. Pokušajte ponovno.");
      } finally {
        setBusy(false);
      }
    },
    [cart, persist]
  );

  const updateItem = useCallback(
    async (lineId: string, quantity: number) => {
      if (!cart) return;
      setBusy(true);
      try {
        const d = await shopifyFetch<{ cartLinesUpdate: { cart: Cart } }>(M_UPDATE, {
          cartId: cart.id,
          lines: [{ id: lineId, quantity }],
        });
        persist(d.cartLinesUpdate.cart);
      } catch (e) {
        console.error("updateItem failed", e);
      } finally {
        setBusy(false);
      }
    },
    [cart, persist]
  );

  const removeItem = useCallback(
    async (lineId: string) => {
      if (!cart) return;
      setBusy(true);
      try {
        const d = await shopifyFetch<{ cartLinesRemove: { cart: Cart } }>(M_REMOVE, { cartId: cart.id, lineIds: [lineId] });
        persist(d.cartLinesRemove.cart);
      } catch (e) {
        console.error("removeItem failed", e);
      } finally {
        setBusy(false);
      }
    },
    [cart, persist]
  );

  return (
    <CartContext.Provider
      value={{ cart, open, busy, setOpen, addItem, updateItem, removeItem, count: cart?.totalQuantity ?? 0 }}
    >
      {children}
    </CartContext.Provider>
  );
}

export function formatMoney(m?: Money) {
  if (!m) return "Na upit";
  const n = Number(m.amount);
  if (!n || n <= 0) return "Na upit";
  return new Intl.NumberFormat("hr-HR", { style: "currency", currency: m.currencyCode || "EUR" }).format(n);
}
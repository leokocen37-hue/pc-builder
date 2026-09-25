import { formatEUR } from "@/lib/pricing";

/** A Shopify money object, or "Na upit" when there is no real price on it.
 *  Server-safe: lib/cart.tsx exports the same function but is "use client". */
export function formatMoney(m?: { amount: string; currencyCode: string }) {
  if (!m) return "Na upit";
  const n = Number(m.amount);
  if (!n || n <= 0) return "Na upit";
  return formatEUR(n);
}

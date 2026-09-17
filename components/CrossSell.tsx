// → put this at:  components/CrossSell.tsx
"use client";

import { useEffect, useState } from "react";
import { shopifyFetch } from "@/lib/shopify";
import { useCart, formatEUR } from "@/lib/cart";

// Which collections to pull cross-sell items from. Edit to match your handles.
const CROSS_SELL_HANDLES = ["tipkovnice", "misevi", "monitori", "slusalice"];
const MAX_ITEMS = 6;

type Node = {
  id: string; title: string; availableForSale: boolean;
  featuredImage?: { url: string } | null;
  variants: { edges: { node: { id: string; price: { amount: string; currencyCode: string } } }[] };
};
type Resp = { collection: { products: { edges: { node: Node }[] } } | null };

const QUERY = `
  query Cross($handle: String!) {
    collection(handle: $handle) {
      products(first: 4) {
        edges { node {
          id title availableForSale
          featuredImage { url }
          variants(first: 1) { edges { node { id price { amount currencyCode } } } }
        }}
      }
    }
  }
`;

export default function CrossSell() {
  const { addProduct } = useCart();
  const [items, setItems] = useState<Node[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const res = await Promise.all(CROSS_SELL_HANDLES.map((h) => shopifyFetch<Resp>(QUERY, { handle: h })));
        if (!alive) return;
        const merged: Node[] = [];
        const seen = new Set<string>();
        res.forEach((r) =>
          r.collection?.products.edges.forEach((e) => {
            if (!seen.has(e.node.id) && e.node.variants.edges[0]) { seen.add(e.node.id); merged.push(e.node); }
          })
        );
        setItems(merged.slice(0, MAX_ITEMS));
      } catch {
        /* collections may not exist yet — just show nothing */
      }
    })();
    return () => { alive = false; };
  }, []);

  if (items.length === 0) return null;

  return (
    <div className="rs-xsell">
      <div className="rs-xsell-head">Nadogradi svoj setup</div>
      <div className="rs-xsell-row">
        {items.map((p) => {
          const v = p.variants.edges[0].node;
          return (
            <div key={p.id} className="rs-xsell-card">
              <div className="rs-xsell-img">{p.featuredImage?.url && <img src={p.featuredImage.url} alt={p.title} />}</div>
              <div className="rs-xsell-title">{p.title}</div>
              <div className="rs-xsell-price">{formatEUR(Number(v.price.amount))}</div>
              <button
                className="rs-xsell-add"
                disabled={!p.availableForSale}
                onClick={() => addProduct({ variantId: v.id, title: p.title, price: Number(v.price.amount), image: p.featuredImage?.url })}
              >
                + Dodaj
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}
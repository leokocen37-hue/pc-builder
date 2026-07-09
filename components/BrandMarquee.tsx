// → put this at:  components/BrandMarquee.tsx
"use client";

import { useEffect, useState } from "react";
import { shopifyFetch } from "@/lib/shopify";

type Node = { id: string; title: string; featuredImage?: { url: string; altText?: string | null } | null };
type Resp = { collection: { products: { edges: { node: Node }[] } } | null };

const QUERY = `
  query Marke($handle: String!) {
    collection(handle: $handle) {
      products(first: 40) { edges { node { id title featuredImage { url altText } } } }
    }
  }
`;

export default function BrandMarquee() {
  const [logos, setLogos] = useState<Node[]>([]);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await shopifyFetch<Resp>(QUERY, { handle: "marke" });
        if (!alive) return;
        setLogos((d.collection?.products.edges.map((e) => e.node) ?? []).filter((n) => n.featuredImage?.url));
      } catch {
        /* collection may not exist yet — render nothing */
      }
    })();
    return () => { alive = false; };
  }, []);

  if (logos.length === 0) return null;

  // duplicate the list so the loop is seamless
  const loop = [...logos, ...logos];

  return (
    <div className="rs-marquee" aria-label="Marke koje koristimo">
      <div className="rs-marquee-track">
        {loop.map((l, i) => (
          <div className="rs-marquee-item" key={l.id + "-" + i}>
            <img src={l.featuredImage!.url} alt={l.featuredImage!.altText || l.title} loading="lazy" />
          </div>
        ))}
      </div>
    </div>
  );
}
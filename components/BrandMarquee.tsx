// → put this at:  components/BrandMarquee.tsx
"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";
import { shopifyFetch } from "@/lib/shopify";
import { shopifyImage } from "@/lib/shopify-image";

type Node = { id: string; title: string; featuredImage?: { url: string; altText?: string | null } | null };
type Resp = { collection: { products: { edges: { node: Node }[] } } | null };

const QUERY = `
  query Marke($handle: String!) {
    collection(handle: $handle) {
      products(first: 40) { edges { node { id title featuredImage { url altText } } } }
    }
  }
`;

// Seconds of scroll per logo — the loop's duration is derived from this so the
// strip moves at the same speed whatever the shop has in the "marke" collection.
const SECONDS_PER_LOGO = 2.4;

// The number of copies is measured, but a broken measurement must not be able
// to flood the DOM with thousands of images.
const MAX_COPIES = 12;

export default function BrandMarquee() {
  const [logos, setLogos] = useState<Node[]>([]);
  // The loop works by shifting the track left by exactly one copy of the list
  // and starting over, which only looks continuous while the copies that have
  // NOT yet been shifted away still cover the strip. One copy of these logos
  // is about 860px wide, so the old fixed pair ran out partway across a 1280px
  // screen and the row visibly ended mid-scroll. How many copies that takes
  // depends on the logos and on the viewport, so it is measured rather than
  // guessed.
  const [copies, setCopies] = useState(2);
  const wrapRef = useRef<HTMLDivElement>(null);
  const groupRef = useRef<HTMLDivElement>(null);

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

  useEffect(() => {
    if (logos.length === 0) return;
    const wrap = wrapRef.current;
    const group = groupRef.current;
    if (!wrap || !group) return;

    const measure = () => {
      const copyWidth = group.offsetWidth;
      // the images are lazy: before they lay out, a "copy" is just its margins
      if (copyWidth < 50) return;
      // A copy's width doesn't depend on how many copies there are, so this
      // can settle downwards too: the first measurement runs before the lazy
      // images have laid out and over-counts, and correcting it back saves
      // rendering a few dozen <img> nobody sees.
      const needed = Math.ceil(wrap.clientWidth / copyWidth) + 1;
      setCopies(Math.max(2, Math.min(MAX_COPIES, needed)));
    };

    measure();
    // the wrap for viewport changes, the group for the images finishing loading
    const ro = new ResizeObserver(measure);
    ro.observe(wrap);
    ro.observe(group);
    return () => ro.disconnect();
  }, [logos]);

  if (logos.length === 0) return null;

  const style = {
    // always exactly one copy, so any copy count over the measured minimum is
    // still seamless — only wasted DOM, never a gap
    "--rs-marquee-shift": `-${100 / copies}%`,
    "--rs-marquee-duration": `${(logos.length * SECONDS_PER_LOGO).toFixed(1)}s`,
  } as CSSProperties;

  return (
    <div className="rs-marquee" ref={wrapRef} aria-label="Marke koje koristimo">
      <div className="rs-marquee-track" style={style}>
        {Array.from({ length: copies }, (_, copy) => (
          <div className="rs-marquee-group" key={copy} ref={copy === 0 ? groupRef : undefined} aria-hidden={copy > 0}>
            {logos.map((l) => (
              <div className="rs-marquee-item" key={l.id}>
                <img
                  src={shopifyImage(l.featuredImage!.url, 160)}
                  alt={l.featuredImage!.altText || l.title}
                  loading="lazy"
                  decoding="async"
                />
              </div>
            ))}
          </div>
        ))}
      </div>
    </div>
  );
}

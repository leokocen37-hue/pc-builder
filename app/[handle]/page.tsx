// → put this at:  app/[handle]/page.tsx
"use client";

import { useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import { shopifyFetch } from "@/lib/shopify";
import { useCart, formatMoney } from "@/lib/cart";

type Money = { amount: string; currencyCode: string };
type Variant = {
  id: string; title: string; availableForSale: boolean;
  price: Money;
  selectedOptions: { name: string; value: string }[];
  image?: { url: string; altText?: string | null } | null;
};
type Product = {
  id: string; title: string; descriptionHtml: string;
  featuredImage?: { url: string; altText?: string | null } | null;
  images: { edges: { node: { url: string; altText?: string | null } }[] };
  options: { name: string; values: string[] }[];
  variants: { edges: { node: Variant }[] };
};

const QUERY = `
  query Product($handle: String!) {
    product(handle: $handle) {
      id title descriptionHtml
      featuredImage { url altText }
      images(first: 10) { edges { node { url altText } } }
      options { name values }
      variants(first: 50) { edges { node {
        id title availableForSale
        price { amount currencyCode }
        selectedOptions { name value }
        image { url altText }
      }}}
    }
  }
`;

export default function ProductPage() {
  const params = useParams();
  const handle = Array.isArray(params.handle) ? params.handle[0] : params.handle;
  const { addProduct } = useCart();

  const [product, setProduct] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [variantId, setVariantId] = useState<string | null>(null);
  const [activeImg, setActiveImg] = useState(0);
  const [qty, setQty] = useState(1);

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      try {
        const d = await shopifyFetch<{ product: Product | null }>(QUERY, { handle });
        if (!alive) return;
        setProduct(d.product);
        const firstAvail = d.product?.variants.edges.find((e) => e.node.availableForSale)?.node
          ?? d.product?.variants.edges[0]?.node;
        setVariantId(firstAvail?.id ?? null);
      } catch (e) {
        console.error("product fetch failed", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, [handle]);

  const variants = product?.variants.edges.map((e) => e.node) ?? [];
  const selected = useMemo(() => variants.find((v) => v.id === variantId) ?? null, [variants, variantId]);
  const images = product?.images.edges.map((e) => e.node) ?? (product?.featuredImage ? [product.featuredImage] : []);
  const hasRealOptions = (product?.options ?? []).some((o) => !(o.values.length === 1 && o.values[0] === "Default Title"));

  if (loading) {
    return (
      <div className="rs-root"><section className="rs-pdp"><div className="rs-wrap rs-pdp-grid">
        <div className="rs-skel" style={{ height: 460 }} /><div className="rs-skel" style={{ height: 460 }} />
      </div></section></div>
    );
  }
  if (!product) {
    return (
      <div className="rs-root"><section className="rs-pdp"><div className="rs-wrap" style={{ textAlign: "center", padding: "80px 0" }}>
        <h1 style={{ fontSize: 28, marginBottom: 12 }}>Proizvod nije pronađen</h1>
        <p style={{ color: "var(--muted)", marginBottom: 24 }}>Možda je uklonjen ili je poveznica netočna.</p>
        <Link href="/gotova-racunala" className="rs-btn">Natrag na računala</Link>
      </div></section></div>
    );
  }

  return (
    <div className="rs-root">
      <section className="rs-pdp">
        <div className="rs-wrap rs-pdp-grid">
          {/* gallery */}
          <div>
            <div className="rs-gallery-main">
              {images[activeImg]?.url
                ? <img src={images[activeImg].url} alt={images[activeImg].altText || product.title} />
                : <div className="rs-ph-fallback" />}
            </div>
            {images.length > 1 && (
              <div className="rs-thumbs">
                {images.map((img, i) => (
                  <div key={i} className={`rs-thumb ${i === activeImg ? "active" : ""}`} onClick={() => setActiveImg(i)}>
                    <img src={img.url} alt={img.altText || ""} />
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* info */}
          <div className="rs-pdp-info">
            <h1>{product.title}</h1>
            <div className="rs-pdp-price">{formatMoney(selected?.price)}</div>

            {hasRealOptions && (
              <div className="rs-opt">
                <div className="rs-opt-label">Varijanta</div>
                <div className="rs-opt-vals">
                  {variants.map((v) => (
                    <button
                      key={v.id}
                      className={`rs-chip ${v.id === variantId ? "active" : ""}`}
                      disabled={!v.availableForSale}
                      onClick={() => { setVariantId(v.id); if (v.image) { const idx = images.findIndex((im) => im.url === v.image!.url); if (idx >= 0) setActiveImg(idx); } }}
                    >
                      {v.title}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {selected && !selected.availableForSale && <div className="rs-soldout">Trenutno nedostupno</div>}

            <div className="rs-qty">
              <button onClick={() => setQty((q) => Math.max(1, q - 1))}>−</button>
              <span>{qty}</span>
              <button onClick={() => setQty((q) => q + 1)}>+</button>
            </div>

            <button
              className="rs-btn"
              style={{ width: "100%", justifyContent: "center" }}
              disabled={!selected?.availableForSale}
              onClick={() =>
                selected &&
                addProduct({
                  variantId: selected.id,
                  title: product.title,
                  price: Number(selected.price.amount),
                  image: selected.image?.url || product.featuredImage?.url || undefined,
                  variantTitle: selected.title !== "Default Title" ? selected.title : undefined,
                  quantity: qty,
                })
              }
            >
              {selected?.availableForSale ? "Dodaj u košaricu" : "Nedostupno"}
            </button>

            {product.descriptionHtml && (
              <div className="rs-pdp-desc" dangerouslySetInnerHTML={{ __html: product.descriptionHtml }} />
            )}
          </div>
        </div>
      </section>
    </div>
  );
}
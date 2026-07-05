"use client";
 
import { useEffect, useState } from "react";
import Link from "next/link";
import { shopifyFetch } from "@/lib/shopify";
import { formatMoney } from "@/lib/cart";
 
type Money = { amount: string; currencyCode: string };
type BoxData = { handle?: string; img?: string; price?: Money };
type Resp = {
  collection: {
    image?: { url: string } | null;
    products: { edges: { node: { handle: string; featuredImage?: { url: string } | null; priceRange: { minVariantPrice: Money } } }[] };
  } | null;
};
 
const Q = `
  query Box($handle: String!) {
    collection(handle: $handle) {
      image { url }
      products(first: 1) {
        edges { node { handle featuredImage { url } priceRange { minVariantPrice { amount currencyCode } } } }
      }
    }
  }
`;
 
export default function PlayStationPage() {
  const [slim, setSlim] = useState<BoxData>({});
  const [pro, setPro] = useState<BoxData>({});
 
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [s, p] = await Promise.all([
          shopifyFetch<Resp>(Q, { handle: "playstation-slim" }),
          shopifyFetch<Resp>(Q, { handle: "playstation-pro" }),
        ]);
        if (!alive) return;
        const sn = s.collection?.products.edges[0]?.node;
        const pn = p.collection?.products.edges[0]?.node;
        if (sn) setSlim({ handle: sn.handle, img: s.collection?.image?.url || sn.featuredImage?.url, price: sn.priceRange.minVariantPrice });
        if (pn) setPro({ handle: pn.handle, img: p.collection?.image?.url || pn.featuredImage?.url, price: pn.priceRange.minVariantPrice });
      } catch {
        /* collections may not exist yet */
      }
    })();
    return () => { alive = false; };
  }, []);
 
  const Box = ({ data, tag, title, spec }: { data: BoxData; tag: string; title: string; spec: string }) => {
    const href = data.handle ? `/${data.handle}` : "#";
    return (
      <Link href={href} className="ps-box" aria-disabled={!data.handle}>
        <div className="ps-box-img">{data.img ? <img src={data.img} alt={title} /> : <div className="ps-box-imgfallback" />}</div>
        <div className="ps-box-body">
          <div className="ps-box-tag">{tag}</div>
          <div className="ps-box-title">{title}</div>
          <div className="ps-box-spec">{spec}</div>
          <div className="ps-box-foot">
            <span className="ps-box-price">{data.price ? `od ${formatMoney(data.price)}` : "Uskoro"}</span>
            <span className="ps-box-cta">{data.handle ? "Pogledaj →" : ""}</span>
          </div>
        </div>
      </Link>
    );
  };
 
  return (
    <div className="rs-root">
      <section className="ps-hero">
        <div className="ps-kicker">RAČUNALO.hr × PlayStation</div>
        <h1>PlayStation 5</h1>
        <p>Nova generacija igranja — odaberi svoj model. Novo, službeno i s jamstvom, isporuka diljem Hrvatske.</p>
      </section>
 
      <div className="ps-boxes">
        <Box data={slim} tag="MODEL" title="PS5 Slim" spec="Kompaktan dizajn · vrhunske performanse" />
        <Box data={pro} tag="MODEL" title="PS5 Pro" spec="Maksimalna snaga · za zahtjevne igrače" />
      </div>
    </div>
  );
}
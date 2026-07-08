// → replace app/page.tsx with this (header + CSS now live globally in layout/storefront.css)
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { shopifyFetch } from "@/lib/shopify";
import { formatMoney } from "@/lib/cart";
import Reveal from "@/components/Reveal";

const CONFIGURATOR_PATH = "/konfigurator";

type Money = { amount: string; currencyCode: string };
type ProductNode = {
  id: string; title: string; handle: string; availableForSale: boolean;
  featuredImage?: { url: string; altText?: string | null } | null;
  priceRange: { minVariantPrice: Money };
};
type CollectionResp = { collection: { products: { edges: { node: ProductNode }[] } } | null };

const COLLECTION_QUERY = `
  query Collection($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      products(first: $first) {
        edges { node {
          id title handle availableForSale
          featuredImage { url altText }
          priceRange { minVariantPrice { amount currencyCode } }
        }}
      }
    }
  }
`;

export default function HomePage() {
  const [gaming, setGaming] = useState<ProductNode[]>([]);
  const [stanice, setStanice] = useState<ProductNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [g, s] = await Promise.all([
          shopifyFetch<CollectionResp>(COLLECTION_QUERY, { handle: "gaming", first: 4 }),
          shopifyFetch<CollectionResp>(COLLECTION_QUERY, { handle: "radne-stanice", first: 4 }),
        ]);
        if (!alive) return;
        setGaming(g.collection?.products.edges.map((e) => e.node) ?? []);
        setStanice(s.collection?.products.edges.map((e) => e.node) ?? []);
      } catch (e) {
        console.error("Homepage product fetch failed:", e);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => { alive = false; };
  }, []);

  return (
    <div className="rs-root">
      {/* hero */}
      <section className="rs-hero">
        <div className="rs-hero-inner">
          <div className="rs-kicker">Custom PC · ručno sastavljeno u Hrvatskoj</div>
          <h1>Tvoje računalo,<em>tvoja pravila</em></h1>
          <p>Složi svaku komponentu uz provjeru kompatibilnosti u stvarnom vremenu — ili odaberi gotovu, testiranu konfiguraciju.</p>
          <div className="rs-hero-cta">
            <Link href={CONFIGURATOR_PATH} className="rs-btn">Otvori konfigurator →</Link>
            <Link href="/gotova-racunala" className="rs-btn ghost">Gotova računala</Link>
          </div>
          <div className="rs-stats">
            <div><b>100+</b><span>komponenti</span></div>
            <div><b>24 mj.</b><span>jamstvo</span></div>
            <div><b>✓</b><span>testirano prije slanja</span></div>
          </div>
        </div>
      </section>

      {/* configurator centerpiece */}
      <section className="rs-config" id="konfigurator">
        <Reveal className="rs-wrap rs-config-grid">
          <div>
            <div className="rs-kicker">Naš konfigurator</div>
            <h2>Sastavi računalo<br />točno po svojoj mjeri</h2>
            <p>Biraj procesor, grafičku, kućište i sve ostalo — provjeravamo kompatibilnost, snagu napajanja i pristajanje komponenti na svakom koraku. Bez pogrešaka, bez nagađanja.</p>
            <ul className="rs-check">
              <li>Provjera kompatibilnosti u stvarnom vremenu</li>
              <li>Stvarne komponente i cijene</li>
              <li>Mi sklapamo, testiramo i šaljemo</li>
            </ul>
            <Link href={CONFIGURATOR_PATH} className="rs-btn" style={{ marginTop: 22 }}>Započni gradnju →</Link>
          </div>
          <Link href={CONFIGURATOR_PATH} className="rs-config-visual" aria-label="Otvori konfigurator">
            <div className="rs-config-glow" />
            <span className="rs-config-badge">KONFIGURATOR</span>
            <div className="rs-config-rows">
              {["Procesor", "Grafička", "Memorija", "Kućište", "Napajanje"].map((r, i) => (
                <div key={r} className="rs-config-row" style={{ opacity: 1 - i * 0.13 }}>
                  <span>{r}</span><span className="rs-config-tick">✓</span>
                </div>
              ))}
            </div>
          </Link>
        </Reveal>
      </section>

      {/* prebuilts */}
      <section id="gotova" className="rs-section">
        <div className="rs-wrap">
          <Reveal className="rs-head">
            <div className="rs-kicker">Gotova računala</div>
            <h2>Spremno za svaki izazov</h2>
            <p>Provjereni buildovi — ili kreni od nule u konfiguratoru.</p>
          </Reveal>
          <Reveal delay={80}>
            <CollectionRow title="Gaming računala" href="/gaming-racunala" products={gaming} loading={loading} />
          </Reveal>
          <Reveal delay={140}>
            <CollectionRow title="Radne stanice" href="/radne-stanice" products={stanice} loading={loading} />
          </Reveal>
        </div>
      </section>

      {/* categories */}
      <section id="kategorije" className="rs-section rs-section-alt">
        <div className="rs-wrap">
          <Reveal className="rs-head">
            <div className="rs-kicker">Trgovina</div>
            <h2>Sve za tvoj setup</h2>
            <p>Nadopuni svoje računalo — monitori, tipkovnice i miševi.</p>
          </Reveal>
          <Reveal className="rs-cats" delay={80}>
            <Link href="/monitori" className="rs-cat" style={{ background: "linear-gradient(135deg,#0e5a8a,#22a3d8)" }}>
              <span className="rs-cat-label">Monitori</span>
              <span className="rs-cat-sub">Gaming & uredski</span>
              <span className="rs-cat-link">Pogledaj →</span>
            </Link>
            <Link href="/tipkovnice" className="rs-cat" style={{ background: "linear-gradient(135deg,#8a0e6a,#d81fd8)" }}>
              <span className="rs-cat-label">Tipkovnice</span>
              <span className="rs-cat-sub">Mehaničke & RGB</span>
              <span className="rs-cat-link">Pogledaj →</span>
            </Link>
            <Link href="/misevi" className="rs-cat" style={{ background: "linear-gradient(135deg,#0e7a52,#27c08a)" }}>
              <span className="rs-cat-label">Miševi</span>
              <span className="rs-cat-sub">Gaming & precizni</span>
              <span className="rs-cat-link">Pogledaj →</span>
            </Link>
            <Link href="/slusalice" className="rs-cat" style={{ background: "linear-gradient(135deg,#3a1f7a,#7b2ff7)" }}>
              <span className="rs-cat-label">Slušalice</span>
              <span className="rs-cat-sub">Gaming & bežične</span>
              <span className="rs-cat-link">Pogledaj →</span>
            </Link>
          </Reveal>
        </div>
      </section>

      {/* why us */}
      <section className="rs-section">
        <div className="rs-wrap">
          <Reveal className="rs-head">
            <div className="rs-kicker">Zašto Računalo.hr</div>
            <h2>Sigurna kupnja, bez iznenađenja</h2>
          </Reveal>
          <Reveal className="rs-why" delay={80}>
            {[
              ["Brza dostava", "Sklapanje i isporuka u nekoliko radnih dana, diljem Hrvatske."],
              ["Testirano prije slanja", "Svako računalo prolazi stress-test i kontrolu prije isporuke."],
              ["24 mjeseca jamstva", "Puno jamstvo i podrška — uvijek smo tu nakon kupnje."],
              ["Savjet stručnjaka", "Niste sigurni? Javite nam namjenu i proračun, složimo idealan build."],
            ].map(([t, d]) => (
              <div key={t} className="rs-why-item">
                <div className="rs-why-ic">◆</div>
                <h4>{t}</h4>
                <p>{d}</p>
              </div>
            ))}
          </Reveal>
        </div>
      </section>

      {/* cta band */}
      <section className="rs-band">
        <Reveal className="rs-wrap">
          <h2>Spreman sastaviti svoje?</h2>
          <p>Pokreni konfigurator i složi računalo baš po svojoj mjeri — uz provjeru kompatibilnosti na svakom koraku.</p>
          <Link href={CONFIGURATOR_PATH} className="rs-btn">Otvori konfigurator →</Link>
        </Reveal>
      </section>

      {/* footer */}
      <footer id="kontakt" className="rs-footer">
        <div className="rs-wrap rs-foot-grid">
          <div>
            <div className="rs-logo" style={{ fontSize: 22, marginBottom: 12 }}>RAČUNALO<span>.hr</span></div>
            <p className="rs-foot-blurb">Ručno sastavljena i testirana računala po mjeri. Jedinstvene konfiguracije za igru, posao i kreativan rad.</p>
          </div>
          <div>
            <h5>Trgovina</h5>
            <Link href={CONFIGURATOR_PATH}>Konfigurator</Link>
            <Link href="/gaming-racunala">Gaming računala</Link>
            <Link href="/radne-stanice">Radne stanice</Link>
            <Link href="/gotova-racunala">Sva računala</Link>
          </div>
          <div>
            <h5>Pomoć</h5>
            <a href="https://racunalo.hr/pages/about-us">Česta pitanja</a>
            <a href="#">Dostava</a>
            <a href="#">Jamstvo</a>
            <a href="#kontakt">Kontakt</a>
          </div>
          <div>
            <h5>Kontakt</h5>
            <p>info@racunalo.hr</p>
            <p className="rs-faint">Pon–Pet · 9–17h</p>
          </div>
        </div>
        <div className="rs-foot-bottom">
          <span>© {new Date().getFullYear()} RAČUNALO.hr — sva prava pridržana</span>
          <span className="rs-faint">Plaćanje: kartice · PayPal · KEKS Pay</span>
        </div>
      </footer>
    </div>
  );
}

function CollectionRow({ title, href, products, loading }: { title: string; href: string; products: ProductNode[]; loading: boolean }) {
  return (
    <div className="rs-row-block">
      <div className="rs-row-head">
        <h3>{title}</h3>
        <Link href={href} className="rs-row-all">Pogledaj sve →</Link>
      </div>
      <div className="rs-grid">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="rs-skel" />)
          : products.length === 0
          ? <div className="rs-empty">Konfiguracije uskoro.</div>
          : products.slice(0, 4).map((p) => (
              <Link key={p.id} href={`/${p.handle}`} className="rs-card">
                <div className="rs-ph">
                  {p.featuredImage?.url ? <img src={p.featuredImage.url} alt={p.featuredImage.altText || p.title} loading="lazy" /> : <div className="rs-ph-fallback" />}
                  {!p.availableForSale && <span className="rs-badge">Uskoro</span>}
                </div>
                <div className="rs-card-body">
                  <h4>{p.title}</h4>
                  <div className="rs-price-row">
                    <span className="rs-price">{formatMoney(p.priceRange?.minVariantPrice)}</span>
                    <span className="rs-buy">Detalji →</span>
                  </div>
                </div>
              </Link>
            ))}
      </div>
    </div>
  );
}
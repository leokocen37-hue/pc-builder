"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { shopifyFetch } from "@/lib/shopify";
import { formatMoney, formatEUR } from "@/lib/cart";
import Reveal from "@/components/Reveal";
import BrandMarquee from "@/components/BrandMarquee";
import { specLine, type ProductNode } from "@/lib/collections";
import { SITE } from "@/lib/site-config";

const CONFIGURATOR_PATH = "/konfigurator";

export default function HomeClient({ gaming, stanice }: { gaming: ProductNode[]; stanice: ProductNode[] }) {
  return (
    <div className="rs-root">
      {/* hero */}
      <section className="rs-hero">
        <div className="rs-hero-inner">
          <div className="rs-kicker rs-hero-kicker">Custom PC <span className="rs-hero-kicker-dot">·</span> ručno sastavljeno u Hrvatskoj</div>
          <h1>Tvoje računalo,<em>tvoja pravila</em></h1>
          <p>Složi svaku komponentu uz provjeru kompatibilnosti u stvarnom vremenu — ili odaberi gotovu, testiranu konfiguraciju.</p>
          <div className="rs-hero-cta">
            <Link href={CONFIGURATOR_PATH} className="rs-btn">Otvori konfigurator →</Link>
            <Link href="/racunala" className="rs-btn ghost">Gotova računala</Link>
          </div>
          <div className="rs-stats">
            <div><b>{SITE.buildDaysMin}–{SITE.buildDaysMax} dana</b><span>sastavljanje</span></div>
            <div><b>24 mj.</b><span>jamstvo</span></div>
            <div><b>✓</b><span>testirano prije slanja</span></div>
          </div>
        </div>
      </section>

      {/* value strip — the three questions buyers ask first */}
      <section className="rs-value-strip">
        <div className="rs-wrap rs-value-strip-inner">
          <div className="rs-value-item">Konfiguracije od <b>{formatEUR(SITE.startingPrice)}</b></div>
          <div className="rs-value-item">Besplatna dostava iznad <b>{formatEUR(SITE.freeShippingFrom)}</b></div>
          <div className="rs-value-item">Spremno za <b>{SITE.buildDaysMin}–{SITE.buildDaysMax} radnih dana</b></div>
        </div>
      </section>

      {/* brand logo marquee (pulls from Shopify "marke" collection) */}
      <BrandMarquee />

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
            <p>Ručno sastavljene i testirane konfiguracije — odaberi provjeren build ili kreni od nule u konfiguratoru.</p>
            <Link href="/racunala" className="rs-head-cta">Pogledaj sva računala →</Link>
          </Reveal>
          <Reveal delay={80}>
            <CollectionRow title="Gaming računala" subtitle="Za igranje na visokim postavkama i visokom broju sličica." href="/racunala/gaming" products={gaming} />
          </Reveal>
          <Reveal delay={140}>
            <CollectionRow title="Radne stanice" subtitle="Snaga za montažu, 3D, render i zahtjevan profesionalni rad." href="/racunala/radne-stanice" products={stanice} />
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
            <CatTile href="/periferija/monitori" label="Monitori" sub="Gaming & uredski" handle="monitori" g="linear-gradient(135deg,#0e5a8a,#22a3d8)" />
            <CatTile href="/periferija/tipkovnice" label="Tipkovnice" sub="Mehaničke & RGB" handle="tipkovnice" g="linear-gradient(135deg,#8a0e6a,#d81fd8)" />
            <CatTile href="/periferija/misevi" label="Miševi" sub="Gaming & precizni" handle="misevi" g="linear-gradient(135deg,#0e7a52,#27c08a)" />
            <CatTile href="/periferija/slusalice" label="Slušalice" sub="Gaming & bežične" handle="slusalice" g="linear-gradient(135deg,#3a1f7a,#7b2ff7)" />
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
    </div>
  );
}

function CatTile({ href, label, sub, handle, g }: { href: string; label: string; sub: string; handle: string; g: string }) {
  const [img, setImg] = useState<string | null>(null);
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const d = await shopifyFetch<{ collection: { image?: { url: string } | null; products: { edges: { node: { featuredImage?: { url: string } | null } }[] } } | null }>(
          `query($h:String!){ collection(handle:$h){ image{url} products(first:1){ edges{ node{ featuredImage{url} } } } } }`,
          { h: handle }
        );
        if (!alive) return;
        setImg(d.collection?.image?.url || d.collection?.products.edges[0]?.node.featuredImage?.url || null);
      } catch {}
    })();
    return () => { alive = false; };
  }, [handle]);

  return (
    <Link href={href} className="rs-cat" style={{ background: g }}>
      {img && <img src={img} alt={label} className="rs-cat-img" loading="lazy" />}
      <span className="rs-cat-label">{label}</span>
      <span className="rs-cat-sub">{sub}</span>
      <span className="rs-cat-link">Pogledaj →</span>
    </Link>
  );
}

function CollectionRow({ title, href, products, subtitle }: { title: string; href: string; products: ProductNode[]; subtitle?: string }) {
  return (
    <div className="rs-row-block">
      <div className="rs-row-head">
        <div className="rs-row-head-left">
          <h3>{title}</h3>
          {subtitle && <p className="rs-row-sub">{subtitle}</p>}
        </div>
        <Link href={href} className="rs-row-all">Pogledaj sve <span className="rs-row-arrow">→</span></Link>
      </div>
      <div className="rs-row-grid">
        {products.length === 0
          ? <div className="rs-empty">Konfiguracije uskoro.</div>
          : products.slice(0, 5).map((p) => (
              <Link key={p.id} href={`/racunala/${p.category}/${p.handle}`} className="rs-card rs-card-fin">
                <div className="rs-ph">
                  {p.featuredImage?.url ? <img src={p.featuredImage.url} alt={p.featuredImage.altText || p.title} loading="lazy" /> : <div className="rs-ph-fallback" />}
                  {!p.availableForSale && <span className="rs-badge">Uskoro</span>}
                </div>
                <div className="rs-card-body">
                  <h4>{p.title}</h4>
                  {specLine(p) && <div className="rs-card-specs">{specLine(p)}</div>}
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

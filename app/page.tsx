// → replace your current app/page.tsx with this file
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { shopifyFetch } from "@/lib/shopify";

/* ------------------------------------------------------------------ *
 *  RAČUNALO.hr — headless storefront homepage
 *  - Hero (configurator centerpiece)
 *  - Gotova računala: live from Shopify collections `gaming` + `radne-stanice`
 *  - Kategorije: Konzole / Monitori / Tipkovnice / Miševi
 *  - Zašto mi / footer
 *
 *  Prebuilt cards currently link to the live Shopify product page so they
 *  work today. When we build native product pages (app/proizvodi/[handle]),
 *  swap PRODUCT_BASE for `/proizvodi/`.
 * ------------------------------------------------------------------ */

const PRODUCT_BASE = "https://racunalo.hr/products/"; // TODO: → "/proizvodi/" once native product pages exist
const CONFIGURATOR_PATH = "/konfigurator";

type Money = { amount: string; currencyCode: string };
type ProductNode = {
  id: string;
  title: string;
  handle: string;
  availableForSale: boolean;
  featuredImage?: { url: string; altText?: string | null } | null;
  priceRange: { minVariantPrice: Money };
};
type CollectionResp = {
  collection: { title: string; products: { edges: { node: ProductNode }[] } } | null;
};

const COLLECTION_QUERY = `
  query Collection($handle: String!, $first: Int!) {
    collection(handle: $handle) {
      title
      products(first: $first) {
        edges {
          node {
            id
            title
            handle
            availableForSale
            featuredImage { url altText }
            priceRange { minVariantPrice { amount currencyCode } }
          }
        }
      }
    }
  }
`;

function formatPrice(m?: Money) {
  if (!m) return "Na upit";
  const n = Number(m.amount);
  if (!n || n <= 0) return "Na upit"; // prebuilts not yet priced show gracefully
  return new Intl.NumberFormat("hr-HR", { style: "currency", currency: m.currencyCode || "EUR" }).format(n);
}

export default function HomePage() {
  const [gaming, setGaming] = useState<ProductNode[]>([]);
  const [stanice, setStanice] = useState<ProductNode[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const [g, s] = await Promise.all([
          shopifyFetch<CollectionResp>(COLLECTION_QUERY, { handle: "gaming", first: 8 }),
          shopifyFetch<CollectionResp>(COLLECTION_QUERY, { handle: "radne-stanice", first: 8 }),
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
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="rs-root">
      <style>{CSS}</style>

      {/* announcement */}
      <div className="rs-announce">
        ⚡ Ručno sastavljamo i testiramo svako računalo u Hrvatskoj — <b>besplatna dostava iznad 1.000 €</b>
      </div>

      {/* header */}
      <header className="rs-nav">
        <div className="rs-wrap rs-nav-inner">
          <Link href="/" className="rs-logo">RAČUNALO<span>.hr</span></Link>
          <nav className="rs-links">
            <Link href="/">Početna</Link>
            <Link href={CONFIGURATOR_PATH}>Konfigurator</Link>
            <a href="#gotova">Gotova računala</a>
            <a href="#kategorije">Periferija</a>
            <a href="#kontakt">Kontakt</a>
          </nav>
          <Link href={CONFIGURATOR_PATH} className="rs-nav-cta">Složi svoje →</Link>
        </div>
      </header>

      {/* hero */}
      <section className="rs-hero">
        <div className="rs-hero-inner">
          <div className="rs-kicker">Custom PC · ručno sastavljeno u Hrvatskoj</div>
          <h1>Tvoje računalo,<em>tvoja pravila</em></h1>
          <p>Složi svaku komponentu uz provjeru kompatibilnosti u stvarnom vremenu — ili odaberi gotovu, testiranu konfiguraciju.</p>
          <div className="rs-hero-cta">
            <Link href={CONFIGURATOR_PATH} className="rs-btn">Otvori konfigurator →</Link>
            <a href="#gotova" className="rs-btn ghost">Gotova računala</a>
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
        <div className="rs-wrap rs-config-grid">
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
        </div>
      </section>

      {/* prebuilts */}
      <section id="gotova" className="rs-section">
        <div className="rs-wrap">
          <div className="rs-head">
            <div className="rs-kicker">Gotova računala</div>
            <h2>Spremno za svaki izazov</h2>
            <p>Provjereni buildovi — ili kreni od nule u konfiguratoru.</p>
          </div>

          <CollectionRow title="Gaming računala" handle="gaming" products={gaming} loading={loading} />
          <CollectionRow title="Radne stanice" handle="radne-stanice" products={stanice} loading={loading} />
        </div>
      </section>

      {/* categories */}
      <section id="kategorije" className="rs-section rs-section-alt">
        <div className="rs-wrap">
          <div className="rs-head">
            <div className="rs-kicker">Trgovina</div>
            <h2>Sve za tvoje računalo</h2>
            <p>Periferija, monitori i konzole — uskoro u ponudi.</p>
          </div>
          <div className="rs-cats">
            {[
              { label: "Konzole", sub: "PlayStation, Xbox", handle: "konzole", g: "linear-gradient(135deg,#3a1f7a,#7b2ff7)" },
              { label: "Monitori", sub: "Gaming & uredski", handle: "monitori", g: "linear-gradient(135deg,#0e5a8a,#22a3d8)" },
              { label: "Tipkovnice", sub: "Mehaničke & RGB", handle: "tipkovnice", g: "linear-gradient(135deg,#8a0e6a,#d81fd8)" },
              { label: "Miševi", sub: "Gaming & precizni", handle: "misevi", g: "linear-gradient(135deg,#0e7a52,#27c08a)" },
            ].map((c) => (
              <a key={c.handle} href={`https://racunalo.hr/collections/${c.handle}`} className="rs-cat" style={{ background: c.g }}>
                <span className="rs-cat-label">{c.label}</span>
                <span className="rs-cat-sub">{c.sub}</span>
                <span className="rs-cat-link">Pogledaj →</span>
              </a>
            ))}
          </div>
        </div>
      </section>

      {/* why us */}
      <section className="rs-section rs-why-wrap">
        <div className="rs-wrap">
          <div className="rs-head">
            <div className="rs-kicker">Zašto Računalo.hr</div>
            <h2>Sigurna kupnja, bez iznenađenja</h2>
          </div>
          <div className="rs-why">
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
          </div>
        </div>
      </section>

      {/* cta band */}
      <section className="rs-band">
        <div className="rs-wrap">
          <h2>Spreman sastaviti svoje?</h2>
          <p>Pokreni konfigurator i složi računalo baš po svojoj mjeri — uz provjeru kompatibilnosti na svakom koraku.</p>
          <Link href={CONFIGURATOR_PATH} className="rs-btn">Otvori konfigurator →</Link>
        </div>
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
            <a href="#gotova">Gaming računala</a>
            <a href="#gotova">Radne stanice</a>
            <a href="#kategorije">Periferija</a>
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
        <div className="rs-wrap rs-foot-bottom">
          <span>© {new Date().getFullYear()} RAČUNALO.hr — sva prava pridržana</span>
          <span className="rs-faint">Plaćanje: kartice · PayPal · KEKS Pay</span>
        </div>
      </footer>
    </div>
  );
}

/* ---- prebuilt product row ---- */
function CollectionRow({
  title, handle, products, loading,
}: { title: string; handle: string; products: ProductNode[]; loading: boolean }) {
  return (
    <div className="rs-row-block">
      <div className="rs-row-head">
        <h3>{title}</h3>
        <a href={`https://racunalo.hr/collections/${handle}`} className="rs-row-all">Pogledaj sve →</a>
      </div>
      <div className="rs-grid">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => <div key={i} className="rs-card rs-skel" />)
          : products.length === 0
          ? <div className="rs-empty">Konfiguracije uskoro.</div>
          : products.slice(0, 4).map((p) => (
              <a key={p.id} href={PRODUCT_BASE + p.handle} className="rs-card">
                <div className="rs-ph">
                  {p.featuredImage?.url ? (
                    <img src={p.featuredImage.url} alt={p.featuredImage.altText || p.title} loading="lazy" />
                  ) : (
                    <div className="rs-ph-fallback" />
                  )}
                  {!p.availableForSale && <span className="rs-badge">Uskoro</span>}
                </div>
                <div className="rs-card-body">
                  <h4>{p.title}</h4>
                  <div className="rs-price-row">
                    <span className="rs-price">{formatPrice(p.priceRange?.minVariantPrice)}</span>
                    <span className="rs-buy">Detalji →</span>
                  </div>
                </div>
              </a>
            ))}
      </div>
    </div>
  );
}

/* ------------------------------ styles ------------------------------ */
const CSS = `
@import url('https://fonts.googleapis.com/css2?family=Space+Grotesk:wght@400;500;600;700&family=IBM+Plex+Mono:wght@400;500;600&display=swap');
.rs-root{--bg:#07080c;--bg2:#0b0d14;--card:#11131b;--line:rgba(255,255,255,.08);--line2:rgba(255,255,255,.16);
  --text:#f3f4f8;--muted:#9aa0b0;--faint:#5f6473;--accent:#d81fd8;--accent2:#7b2ff7;
  background:var(--bg);color:var(--text);font-family:'Space Grotesk',sans-serif;-webkit-font-smoothing:antialiased}
.rs-root *{box-sizing:border-box;margin:0;padding:0}
.rs-root a{text-decoration:none;color:inherit}
.rs-root img{display:block;max-width:100%}
.rs-wrap{max-width:1240px;margin:0 auto;padding:0 28px}
.rs-kicker{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:3px;color:var(--accent);text-transform:uppercase}

.rs-announce{background:linear-gradient(90deg,#15101c,#1a0f1f);border-bottom:1px solid var(--line);text-align:center;
  font-size:12.5px;color:var(--muted);padding:9px}
.rs-announce b{color:var(--text)}

.rs-nav{position:sticky;top:0;z-index:50;background:rgba(7,8,12,.82);backdrop-filter:blur(12px);border-bottom:1px solid var(--line)}
.rs-nav-inner{display:flex;align-items:center;justify-content:space-between;height:68px}
.rs-logo{font-weight:700;font-size:21px;letter-spacing:-.5px}
.rs-logo span{color:var(--accent)}
.rs-links{display:flex;gap:30px;font-size:14px;font-weight:500}
.rs-links a{color:var(--muted);transition:.2s}
.rs-links a:hover{color:var(--text)}
.rs-nav-cta{font-family:'IBM Plex Mono',monospace;font-size:12.5px;border:1px solid var(--line2);border-radius:20px;
  padding:8px 15px;color:var(--text);transition:.2s}
.rs-nav-cta:hover{border-color:var(--accent);background:rgba(216,31,216,.12)}
@media(max-width:860px){.rs-links{display:none}}

.rs-hero{position:relative;min-height:92vh;display:flex;align-items:center;justify-content:center;text-align:center;overflow:hidden;
  background:#0a0816 center/cover no-repeat;
  background-image:url('https://racunalo.hr/cdn/shop/files/Custom_PC_website_-_web_banner.jpg?width=2400')}
.rs-hero::before{content:"";position:absolute;inset:0;pointer-events:none;
  background:radial-gradient(58% 60% at 50% 50%,rgba(7,8,12,.66),rgba(7,8,12,.28) 55%,transparent 80%),
  linear-gradient(180deg,rgba(7,8,12,.5) 0%,transparent 20%,transparent 64%,rgba(7,8,12,.95) 100%)}
.rs-hero-inner{position:relative;z-index:2;max-width:780px;padding:0 24px}
.rs-hero-inner h1{font-size:clamp(46px,8.5vw,104px);line-height:.9;font-weight:700;letter-spacing:-2.5px;text-transform:uppercase;
  margin-top:16px;text-shadow:0 8px 50px rgba(0,0,0,.6)}
.rs-hero-inner h1 em{font-style:normal;display:block;color:transparent;-webkit-text-stroke:1.6px #fff}
.rs-hero-inner p{margin:24px auto 32px;color:#ece8f3;font-size:17px;line-height:1.6;max-width:470px;text-shadow:0 2px 16px rgba(0,0,0,.65)}
.rs-hero-cta{display:flex;gap:12px;justify-content:center;flex-wrap:wrap}
.rs-stats{display:flex;gap:42px;margin-top:44px;justify-content:center}
.rs-stats div{font-family:'IBM Plex Mono',monospace}
.rs-stats b{display:block;font-size:24px;color:#fff;text-shadow:0 2px 14px rgba(0,0,0,.6)}
.rs-stats span{font-size:11px;letter-spacing:1.5px;color:#cbb3d6;text-transform:uppercase}
@media(max-width:600px){.rs-stats{gap:24px}}

.rs-btn{display:inline-flex;align-items:center;gap:10px;background:linear-gradient(135deg,var(--accent),var(--accent2));
  color:#fff;font-weight:700;font-size:15px;padding:15px 30px;border-radius:13px;cursor:pointer;
  box-shadow:0 12px 34px -8px rgba(216,31,216,.6);transition:.2s}
.rs-btn:hover{transform:translateY(-2px);box-shadow:0 18px 44px -8px rgba(216,31,216,.75)}
.rs-btn.ghost{background:rgba(10,8,16,.4);border:1px solid rgba(255,255,255,.28);box-shadow:none;backdrop-filter:blur(6px)}
.rs-btn.ghost:hover{border-color:var(--accent);background:rgba(216,31,216,.15)}

.rs-section{padding:88px 0}
.rs-section-alt{background:var(--bg2);border-top:1px solid var(--line);border-bottom:1px solid var(--line)}
.rs-head{text-align:center;margin-bottom:46px}
.rs-head h2{font-size:clamp(28px,4vw,40px);font-weight:700;letter-spacing:-1px;margin-top:12px;text-transform:uppercase}
.rs-head p{color:var(--muted);margin-top:10px;font-size:15px}

/* configurator centerpiece */
.rs-config{padding:96px 0;background:radial-gradient(80% 120% at 70% 0%,#170f26,var(--bg))}
.rs-config-grid{display:grid;grid-template-columns:1fr 1fr;gap:54px;align-items:center}
.rs-config-grid h2{font-size:clamp(28px,4vw,44px);font-weight:700;letter-spacing:-1px;line-height:1.05;margin:14px 0 16px;text-transform:uppercase}
.rs-config-grid p{color:var(--muted);font-size:15.5px;line-height:1.65;max-width:460px}
.rs-check{list-style:none;margin:20px 0 0}
.rs-check li{position:relative;padding-left:26px;margin-bottom:11px;color:var(--text);font-size:14.5px}
.rs-check li::before{content:"✓";position:absolute;left:0;color:var(--accent);font-weight:700}
.rs-config-visual{position:relative;background:var(--card);border:1px solid var(--line2);border-radius:20px;padding:26px;
  min-height:300px;display:flex;flex-direction:column;justify-content:center;overflow:hidden;transition:.25s}
.rs-config-visual:hover{transform:translateY(-4px);border-color:var(--accent)}
.rs-config-glow{position:absolute;width:300px;height:300px;border-radius:50%;background:radial-gradient(circle,rgba(216,31,216,.35),transparent 70%);top:-80px;right:-60px}
.rs-config-badge{font-family:'IBM Plex Mono',monospace;font-size:11px;letter-spacing:3px;color:var(--accent);margin-bottom:18px;position:relative}
.rs-config-rows{display:flex;flex-direction:column;gap:10px;position:relative}
.rs-config-row{display:flex;justify-content:space-between;align-items:center;background:rgba(255,255,255,.03);
  border:1px solid var(--line);border-radius:10px;padding:13px 16px;font-size:14px}
.rs-config-tick{color:#27c08a;font-weight:700}
@media(max-width:840px){.rs-config-grid{grid-template-columns:1fr;gap:36px}}

/* prebuilt rows */
.rs-row-block{margin-bottom:48px}
.rs-row-head{display:flex;align-items:baseline;justify-content:space-between;margin-bottom:20px}
.rs-row-head h3{font-size:20px;font-weight:600}
.rs-row-all{font-family:'IBM Plex Mono',monospace;font-size:12.5px;color:var(--accent)}
.rs-grid{display:grid;grid-template-columns:repeat(4,1fr);gap:20px}
@media(max-width:980px){.rs-grid{grid-template-columns:repeat(2,1fr)}}
@media(max-width:520px){.rs-grid{grid-template-columns:1fr}}
.rs-card{background:var(--card);border:1px solid var(--line);border-radius:16px;overflow:hidden;transition:.25s;display:block}
.rs-card:hover{transform:translateY(-4px);border-color:var(--line2);box-shadow:0 24px 50px -24px rgba(0,0,0,.8)}
.rs-ph{aspect-ratio:1/1;background:#0a0c12;position:relative;overflow:hidden}
.rs-ph img{width:100%;height:100%;object-fit:cover;transition:.4s}
.rs-card:hover .rs-ph img{transform:scale(1.05)}
.rs-ph-fallback{width:100%;height:100%;background:linear-gradient(135deg,#1a1230,#0a0c12)}
.rs-badge{position:absolute;top:12px;left:12px;font-family:'IBM Plex Mono',monospace;font-size:10px;letter-spacing:1px;
  text-transform:uppercase;padding:5px 10px;border-radius:7px;color:#fff;font-weight:600;background:rgba(0,0,0,.55);backdrop-filter:blur(4px)}
.rs-card-body{padding:15px 16px 17px}
.rs-card-body h4{font-size:16px;font-weight:600;margin-bottom:10px}
.rs-price-row{display:flex;align-items:baseline;justify-content:space-between}
.rs-price{font-size:18px;font-weight:700}
.rs-buy{font-family:'IBM Plex Mono',monospace;font-size:12px;color:var(--accent)}
.rs-skel{aspect-ratio:auto;height:300px;background:linear-gradient(100deg,#11131b 30%,#171a24 50%,#11131b 70%);
  background-size:200% 100%;animation:rs-sh 1.3s infinite}
@keyframes rs-sh{to{background-position:-200% 0}}
.rs-empty{grid-column:1/-1;text-align:center;color:var(--faint);padding:40px;font-size:14px}

/* categories */
.rs-cats{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
@media(max-width:860px){.rs-cats{grid-template-columns:repeat(2,1fr)}}
@media(max-width:480px){.rs-cats{grid-template-columns:1fr}}
.rs-cat{position:relative;border-radius:16px;padding:26px;min-height:150px;display:flex;flex-direction:column;justify-content:flex-end;
  overflow:hidden;transition:.25s;border:1px solid rgba(255,255,255,.1)}
.rs-cat::after{content:"";position:absolute;inset:0;background:rgba(7,8,12,.45);transition:.25s}
.rs-cat:hover{transform:translateY(-4px)}
.rs-cat:hover::after{background:rgba(7,8,12,.25)}
.rs-cat span{position:relative;z-index:2}
.rs-cat-label{font-size:21px;font-weight:700}
.rs-cat-sub{font-size:12.5px;color:rgba(255,255,255,.8);margin-top:2px}
.rs-cat-link{font-family:'IBM Plex Mono',monospace;font-size:12px;margin-top:14px;color:#fff}

/* why */
.rs-why-wrap{background:var(--bg)}
.rs-why{display:grid;grid-template-columns:repeat(4,1fr);gap:18px}
@media(max-width:860px){.rs-why{grid-template-columns:repeat(2,1fr)}}
@media(max-width:480px){.rs-why{grid-template-columns:1fr}}
.rs-why-item{padding:26px 22px;background:var(--card);border:1px solid var(--line);border-radius:14px}
.rs-why-ic{width:38px;height:38px;border-radius:10px;display:flex;align-items:center;justify-content:center;
  background:rgba(216,31,216,.12);color:var(--accent);margin-bottom:14px;font-size:16px}
.rs-why-item h4{font-size:15px;font-weight:600;margin-bottom:6px}
.rs-why-item p{font-size:13px;color:var(--muted);line-height:1.55}

/* band */
.rs-band{text-align:center;padding:96px 0;background:radial-gradient(80% 140% at 50% 0%,#1a1030,var(--bg));border-top:1px solid var(--line)}
.rs-band h2{font-size:clamp(30px,4.5vw,52px);font-weight:700;text-transform:uppercase;letter-spacing:-1.5px;line-height:1}
.rs-band p{color:var(--muted);margin:18px auto 30px;max-width:480px;font-size:16px;line-height:1.6}

/* footer */
.rs-footer{background:var(--bg2);border-top:1px solid var(--line);padding:60px 0 28px;color:var(--muted)}
.rs-foot-grid{display:grid;grid-template-columns:2fr 1fr 1fr 1.3fr;gap:40px;margin-bottom:42px}
@media(max-width:760px){.rs-foot-grid{grid-template-columns:1fr 1fr}}
.rs-foot-grid h5{color:var(--text);font-family:'IBM Plex Mono',monospace;font-size:12px;letter-spacing:1.5px;text-transform:uppercase;margin-bottom:15px}
.rs-foot-grid a,.rs-foot-grid p{display:block;font-size:13.5px;margin-bottom:9px;color:var(--muted);transition:.2s}
.rs-foot-grid a:hover{color:var(--accent)}
.rs-foot-blurb{max-width:260px;line-height:1.6}
.rs-faint{color:var(--faint)}
.rs-foot-bottom{border-top:1px solid var(--line);padding-top:22px;display:flex;justify-content:space-between;flex-wrap:wrap;gap:12px;font-size:12px;color:var(--faint)}
`;
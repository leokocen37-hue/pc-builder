// → put this at:  components/SiteHeader.tsx
"use client";

import Link from "next/link";
import { useCart } from "@/lib/cart";

export default function SiteHeader() {
  const { count, setOpen } = useCart();

  return (
    <>
      <div className="rs-announce">
        ⚡ Ručno sastavljamo i testiramo svako računalo u Hrvatskoj — <b>besplatna dostava iznad 1.000 €</b>
      </div>
      <header className="rs-nav">
        <div className="rs-nav-inner">
          <Link href="/" className="rs-logo">RAČUNALO<span>.hr</span></Link>
          <nav className="rs-links">
            <Link href="/konfigurator">Konfigurator</Link>
            <Link href="/gotova-racunala">Računala</Link>
            <Link href="/laptopi">Laptopi</Link>
            <Link href="/periferija">Periferija</Link>
            <Link href="/playstation">PlayStation</Link>
            <a href="/#kontakt">Kontakt</a>
          </nav>
          <div className="rs-nav-right">
            <button className="rs-cart-btn" onClick={() => setOpen(true)} aria-label="Košarica">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
              </svg>
              Košarica
              {count > 0 && <span className="rs-cart-count">{count}</span>}
            </button>
          </div>
        </div>
      </header>
    </>
  );
}
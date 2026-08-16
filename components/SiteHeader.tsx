// → put this at:  components/SiteHeader.tsx
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { useCart } from "@/lib/cart";

const NAV_LINKS = [
  { href: "/", label: "Početna" },
  { href: "/konfigurator", label: "Konfigurator" },
  { href: "/racunala", label: "Gotova računala" },
  { href: "/periferija", label: "Periferija" },
  { href: "/kontakt", label: "Kontakt" },
];

export default function SiteHeader() {
  const { count, setOpen } = useCart();
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();

  // close the mobile menu whenever navigation happens — adjusting state during
  // render (React's sanctioned pattern for this) instead of in an effect, so
  // the menu never flashes open on the new page before an effect can catch up.
  const [lastPathname, setLastPathname] = useState(pathname);
  if (pathname !== lastPathname) {
    setLastPathname(pathname);
    setMenuOpen(false);
  }

  // lock page scroll while the mobile menu is open
  useEffect(() => {
    if (!menuOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    return () => {
      document.body.style.overflow = prev;
    };
  }, [menuOpen]);

  // close on Escape
  useEffect(() => {
    if (!menuOpen) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Escape") setMenuOpen(false);
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [menuOpen]);

  return (
    <>
      <div className="rs-announce">
        ⚡ Ručno sastavljena i testirana računala u Hrvatskoj · <b>24 mjeseca jamstva</b>
      </div>
      <header className="rs-nav">
        <div className="rs-nav-inner">
          <Link href="/" className="rs-logo">RAČUNALO<span>.hr</span></Link>
          <nav className="rs-links">
            {NAV_LINKS.map((l) => (
              <Link key={l.href} href={l.href}>{l.label}</Link>
            ))}
          </nav>
          <div className="rs-nav-right">
            <button className="rs-cart-btn" onClick={() => setOpen(true)} aria-label="Košarica">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <circle cx="9" cy="21" r="1" /><circle cx="20" cy="21" r="1" />
                <path d="M1 1h4l2.7 13.4a2 2 0 0 0 2 1.6h9.7a2 2 0 0 0 2-1.6L23 6H6" />
              </svg>
              <span className="rs-cart-label">Košarica</span>
              {count > 0 && <span className="rs-cart-count">{count}</span>}
            </button>
            <button
              className={`rs-menu-btn ${menuOpen ? "open" : ""}`}
              onClick={() => setMenuOpen((o) => !o)}
              aria-label={menuOpen ? "Zatvori izbornik" : "Otvori izbornik"}
              aria-expanded={menuOpen}
              aria-controls="rs-mobile-nav"
            >
              <span /><span /><span />
            </button>
          </div>
        </div>

        {/* mobile nav panel — pushes down under the header, only reachable <860px */}
        <nav id="rs-mobile-nav" className={`rs-mobile-nav ${menuOpen ? "open" : ""}`} aria-hidden={!menuOpen}>
          {NAV_LINKS.map((l) => (
            <Link key={l.href} href={l.href} onClick={() => setMenuOpen(false)}>{l.label}</Link>
          ))}
        </nav>
      </header>
      {menuOpen && <div className="rs-mobile-nav-overlay" onClick={() => setMenuOpen(false)} />}
    </>
  );
}

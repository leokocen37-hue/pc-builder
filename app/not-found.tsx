import type { Metadata } from "next";
import Link from "next/link";

export const metadata: Metadata = {
  title: "Stranica nije pronađena",
  robots: { index: false, follow: false },
};

export default function NotFound() {
  return (
    <div className="rs-root">
      <section className="rs-404">
        <div className="rs-wrap">
          <div className="rs-404-code">404</div>
          <h1>Stranica nije pronađena</h1>
          <p>Stranica koju tražite ne postoji, uklonjena je ili je poveznica netočna. Isprobajte jednu od poveznica ispod.</p>
          <div className="rs-404-links">
            <Link href="/konfigurator" className="rs-btn">Konfigurator</Link>
            <Link href="/racunala" className="rs-btn ghost">Gotova računala</Link>
            <Link href="/periferija" className="rs-btn ghost">Periferija</Link>
            <Link href="/kontakt" className="rs-btn ghost">Kontakt</Link>
          </div>
        </div>
      </section>
    </div>
  );
}

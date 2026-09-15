// → put this at: components/Footer.tsx
// Global site footer — rendered once from app/layout.tsx so every page gets it.
import Link from "next/link";
import { COMPANY, COMPANY_ADDRESS } from "@/lib/company";

const CONFIGURATOR_PATH = "/konfigurator";

export default function Footer() {
  return (
    <footer className="rs-footer">
      <div className="rs-wrap rs-foot-grid">
        <div>
          <div className="rs-logo" style={{ fontSize: 22, marginBottom: 12 }}>RAČUNALO<span>.hr</span></div>
          <p className="rs-foot-blurb">Ručno sastavljena i testirana računala po mjeri. Jedinstvene konfiguracije za igru, posao i kreativan rad.</p>
          {/* impressum — see lib/company.ts (court register data) */}
          <div className="rs-foot-impressum">
            <div><b>{COMPANY.name}</b></div>
            <div>OIB: {COMPANY.oib}</div>
            <div>{COMPANY_ADDRESS}</div>
            <div>{COMPANY.email}</div>
          </div>
        </div>

        <div>
          <h5>Trgovina</h5>
          <Link href={CONFIGURATOR_PATH}>Konfigurator</Link>
          <Link href="/racunala">Gotova računala</Link>
          <Link href="/periferija">Periferija</Link>
          <Link href="/kontakt">Kontakt</Link>
        </div>

        <div>
          <h5>Pravno</h5>
          <Link href="/uvjeti">Uvjeti poslovanja</Link>
          <Link href="/raskid">Pravo na raskid</Link>
          <Link href="/uvjeti/obrazac-za-jednostrani-raskid">Obrazac za raskid</Link>
          <Link href="/privatnost">Politika privatnosti</Link>
          <Link href="/kolacici">Kolačići</Link>
          <Link href="/reklamacije">Reklamacije</Link>
        </div>

        <div>
          <h5>Podrška</h5>
          <Link href="/o-nama">O nama</Link>
          <Link href="/dostava">Dostava i plaćanje</Link>
          <Link href="/faq">FAQ</Link>
          <Link href="/jamstvo">Jamstvo</Link>
        </div>
      </div>

      <div className="rs-wrap" style={{ marginBottom: 28 }}>
        {/* payment method row — text placeholders; swap for real provider logos once available */}
        <div className="rs-foot-pay">
          <span>Visa</span>
          <span>Mastercard</span>
          <span>Maestro</span>
          <span>PayPal</span>
        </div>
      </div>

      <div className="rs-foot-bottom">
        <span>© {new Date().getFullYear()} RAČUNALO.hr — sva prava pridržana</span>
        <span className="rs-faint">{COMPANY.name} · OIB: {COMPANY.oib}</span>
      </div>
    </footer>
  );
}

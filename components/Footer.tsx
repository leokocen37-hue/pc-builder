// → put this at: components/Footer.tsx
// Global site footer — rendered once from app/layout.tsx so every page gets it.
import Link from "next/link";

const CONFIGURATOR_PATH = "/konfigurator";

export default function Footer() {
  return (
    <footer className="rs-footer">
      <div className="rs-wrap rs-foot-grid">
        <div>
          <div className="rs-logo" style={{ fontSize: 22, marginBottom: 12 }}>RAČUNALO<span>.hr</span></div>
          <p className="rs-foot-blurb">Ručno sastavljena i testirana računala po mjeri. Jedinstvene konfiguracije za igru, posao i kreativan rad.</p>
          {/* impressum — placeholders must be filled with real registration data before launch */}
          <div className="rs-foot-impressum">
            <div><b>{"{NAZIV_TVRTKE}"}</b></div>
            <div>OIB: {"{OIB}"}</div>
            <div>{"{SJEDIŠTE}"}</div>
            <div>info@racunalo.hr</div>
            <div>{"{TELEFON}"}</div>
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
          <span>Kartice</span>
          <span>PayPal</span>
          <span>KEKS Pay</span>
        </div>
      </div>

      <div className="rs-foot-bottom">
        <span>© {new Date().getFullYear()} RAČUNALO.hr — sva prava pridržana</span>
        <span className="rs-faint">OIB: {"{OIB}"}</span>
      </div>
    </footer>
  );
}

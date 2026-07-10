import type { Metadata } from "next";
import Link from "next/link";

const TITLE = "Dostava i plaćanje";
const DESCRIPTION = "Kako pakiramo i dostavljamo računala te koje načine plaćanja nudimo na RAČUNALO.hr.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/dostava" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/dostava" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function DostavaPage() {
  return (
    <div className="rs-root">
      <section className="legal-hero">
        <div className="rs-kicker">Podrška</div>
        <h1>Dostava i plaćanje</h1>
        <p>Sve o tome kako vaše računalo putuje od naše radionice do vas, i kako možete platiti narudžbu.</p>
      </section>

      <section className="legal-wrap">
        <div className="rs-wrap">
          <div className="legal-content">
            <h2>Kako pakiramo</h2>
            <p>
              Svako računalo prije slanja prolazi kroz sklapanje, provjeru rada i stres-test. Nakon što prođe sve
              provjere, pažljivo ga pakiramo tako da izdrži transport — komponente koje bi se mogle pomicati
              tijekom prijevoza dodatno fiksiramo unutar kućišta.
            </p>

            <h2>Dostava</h2>
            <p>
              Dostavljamo diljem Hrvatske. Nakon što je vaše računalo sastavljeno, testirano i spremno za slanje,
              predajemo ga dostavnoj službi, a vi dobivate obavijest s podacima za praćenje pošiljke čim pošiljka
              krene na put.
            </p>
            <p>
              Rok isporuke ovisi o odabranoj konfiguraciji — gotove konfiguracije u pravilu su spremnije za slanje
              od konfiguracija sastavljenih po mjeri u konfiguratoru, jer se one sklapaju tek nakon što
              zaprimimo narudžbu. Točan okvirni rok isporuke za vašu narudžbu možete provjeriti prilikom
              naplate ili nas kontaktirati prije kupnje ako vam je bitan konkretan datum.
            </p>
            <p>Osobno preuzimanje i točni troškovi dostave za vaše područje izračunavaju se i prikazuju na blagajni prilikom naplate.</p>

            <h2>Načini plaćanja</h2>
            <p>Narudžbu možete platiti na jedan od sljedećih načina:</p>
            <ul>
              <li><strong>Kartično plaćanje</strong> — Visa, Mastercard i ostale podržane kartice.</li>
              <li><strong>PayPal</strong></li>
              <li><strong>KEKS Pay</strong></li>
            </ul>
            <p>Sve cijene na stranici prikazane su u eurima (EUR) i uključuju PDV.</p>

            <h2>Praćenje narudžbe</h2>
            <p>
              Nakon predaje pošiljke dostavnoj službi javljamo vam broj za praćenje, kako biste u svakom trenutku
              znali gdje se vaše računalo nalazi.
            </p>

            <h2>Pitanja o narudžbi</h2>
            <p>
              Za pitanja o statusu narudžbe, roku isporuke ili dostupnim opcijama plaćanja slobodno nam se javite
              putem stranice <Link href="/kontakt">Kontakt</Link> ili na{" "}
              <a href="mailto:info@racunalo.hr">info@racunalo.hr</a>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

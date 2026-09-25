import type { Metadata } from "next";
import Link from "next/link";
import { SITE } from "@/lib/site-config";
import { formatEUR, FREE_SHIPPING_FROM, SHIPPING_FEE } from "@/lib/pricing";

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
              <strong>
                Izrada i testiranje {SITE.buildDaysMin}–{SITE.buildDaysMax} radnih dana + dostava{" "}
                {SITE.shipDaysMin}–{SITE.shipDaysMax} radna dana.
              </strong>{" "}
              Rok vrijedi jednako za konfiguracije složene u konfiguratoru i za gotove konfiguracije iz ponude —
              nijedno računalo ne držimo na zalihi, svako sastavljamo nakon zaprimljene narudžbe. Periferija i
              ostala roba sa zalihe kod vas su u roku od{" "}
              <strong>{SITE.stockDaysMin}–{SITE.stockDaysMax} radnih dana</strong>, uključujući dostavu.
            </p>
            <p>
              Rok je okviran, računa se u radnim danima i ne uključuje državne praznike. Ako vam je bitan
              konkretan datum, javite nam se prije kupnje. Ako se rok produži — primjerice zbog nedostupnosti
              komponente — javljamo vam se e-poštom s novim rokom.
            </p>
            <p>
              <strong>Cijena dostave.</strong> Dostavu unutar Hrvatske obavlja DPD. Za narudžbe od{" "}
              <strong>{formatEUR(FREE_SHIPPING_FROM)}</strong> dostava je <strong>besplatna</strong>; ispod toga
              iznosi <strong>{formatEUR(SHIPPING_FEE)}</strong>. Iznos vidite u košarici prije nego što krenete na
              blagajnu.
            </p>

            <h2>Načini plaćanja</h2>
            <p>
              Narudžbu plaćate <strong>karticom</strong> — Visa, Mastercard ili Maestro — putem Shopify Payments.
            </p>
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

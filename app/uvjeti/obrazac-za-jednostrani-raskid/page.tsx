import type { Metadata } from "next";
import Link from "next/link";
import PrintButton from "@/components/PrintButton";
import { COMPANY, COMPANY_ADDRESS_FULL } from "@/lib/company";

const TITLE = "Obrazac za jednostrani raskid ugovora";
const DESCRIPTION = "Preuzmite ili ispunite obrazac za jednostrani raskid ugovora sklopljenog na daljinu u roku od 14 dana.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/uvjeti/obrazac-za-jednostrani-raskid" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/uvjeti/obrazac-za-jednostrani-raskid" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

/** ruled blank line for handwriting / typing into */
function Blank({ w }: { w?: string }) {
  return <span className="ras-blank" style={w ? { width: w } : undefined} />;
}

export default function ObrazacRaskidPage() {
  return (
    <div className="rs-root">
      <section className="legal-hero rs-no-print">
        <div className="rs-kicker">Pravno</div>
        <h1>Obrazac za jednostrani raskid ugovora</h1>
        <p>
          Ovaj obrazac popunite i pošaljite samo ako želite jednostrano raskinuti ugovor — vidi{" "}
          <Link href="/raskid">Pravo na jednostrani raskid</Link> za rokove, iznimke i postupak povrata.
        </p>
      </section>

      <section className="legal-wrap">
        <div className="rs-wrap">
          <div className="legal-content">
            <div className="ras-actions rs-no-print">
              <a className="rs-btn" href="/obrazac-za-jednostrani-raskid.pdf" download>
                Preuzmi PDF ↓
              </a>
              <PrintButton className="rs-btn ghost">Ispiši →</PrintButton>
            </div>

            {/* The printed/PDF version is generated from this same markup —
                see scripts/generate-raskid-pdf.mjs — so the document and the
                page can never drift apart. */}
            <article className="ras-doc">
              <header className="ras-head">
                <div className="ras-head-company">
                  <strong>{COMPANY.name}</strong>
                  <span>{COMPANY_ADDRESS_FULL}</span>
                  <span>OIB: {COMPANY.oib}</span>
                  <span>{COMPANY.email}</span>
                </div>
                <div className="ras-head-brand">{COMPANY.brand}</div>
              </header>

              <h2 className="ras-title">Obrazac za jednostrani raskid ugovora</h2>
              <p className="ras-subtitle">
                Ovaj obrazac popunite i pošaljite samo ako želite jednostrano raskinuti ugovor sklopljen na
                daljinu.
              </p>

              <section className="ras-block">
                <div className="ras-label">Prima</div>
                <div className="ras-recipient">
                  <strong>{COMPANY.name}</strong>
                  <br />
                  {COMPANY_ADDRESS_FULL}
                  <br />
                  E-pošta: {COMPANY.email}
                </div>
              </section>

              <section className="ras-block">
                <p className="ras-decl">
                  Ja, <Blank w="46%" />, ovime izjavljujem da jednostrano raskidam ugovor
                  o kupnji sljedeće robe odnosno usluge:
                </p>
                <span className="ras-rule" />
                <span className="ras-rule" />
              </section>

              <section className="ras-block">
                <div className="ras-grid">
                  <div className="ras-field">
                    <span className="ras-field-label">Broj narudžbe</span>
                    <span className="ras-rule" />
                  </div>
                  <div className="ras-field">
                    <span className="ras-field-label">Datum narudžbe</span>
                    <span className="ras-rule" />
                  </div>
                  <div className="ras-field">
                    <span className="ras-field-label">Datum primitka robe</span>
                    <span className="ras-rule" />
                  </div>
                </div>
              </section>

              <section className="ras-block">
                <div className="ras-field">
                  <span className="ras-field-label">Ime i prezime potrošača</span>
                  <span className="ras-rule" />
                </div>
                <div className="ras-field">
                  <span className="ras-field-label">Adresa potrošača</span>
                  <span className="ras-rule" />
                </div>
                <div className="ras-grid ras-grid-2">
                  <div className="ras-field">
                    <span className="ras-field-label">Broj telefona</span>
                    <span className="ras-rule" />
                  </div>
                  <div className="ras-field">
                    <span className="ras-field-label">E-pošta</span>
                    <span className="ras-rule" />
                  </div>
                </div>
              </section>

              <section className="ras-block ras-sign">
                <div className="ras-grid ras-grid-sign">
                  <div className="ras-field">
                    <span className="ras-rule" />
                    <span className="ras-field-caption">
                      Potpis potrošača <em>(samo ako se obrazac ispunjava na papiru)</em>
                    </span>
                  </div>
                  <div className="ras-field">
                    <span className="ras-rule" />
                    <span className="ras-field-caption">Datum</span>
                  </div>
                </div>
              </section>

              <footer className="ras-foot">
                Popunjen obrazac pošaljite elektroničkom poštom na {COMPANY.email} ili poštom na adresu sjedišta
                navedenu iznad. Potvrdu o primitku dostavit ćemo vam bez odgode elektroničkom poštom.
              </footer>
            </article>

            <p className="rs-no-print ras-after">
              Popunjen obrazac pošaljite na <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> ili putem
              stranice <Link href="/kontakt">Kontakt</Link>. Prije slanja provjerite{" "}
              <Link href="/raskid">rokove i iznimke</Link> — za računala izrađena po narudžbi pravo na
              jednostrani raskid ne postoji.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

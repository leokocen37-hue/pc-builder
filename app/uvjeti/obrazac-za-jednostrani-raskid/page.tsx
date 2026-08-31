import type { Metadata } from "next";
import Link from "next/link";
import LegalTodo from "@/components/LegalTodo";
import PrintButton from "@/components/PrintButton";

const TITLE = "Obrazac za jednostrani raskid ugovora";
const DESCRIPTION = "Preuzmite ili ispunite obrazac za jednostrani raskid ugovora sklopljenog na daljinu u roku od 14 dana.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/uvjeti/obrazac-za-jednostrani-raskid" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/uvjeti/obrazac-za-jednostrani-raskid" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function ObrazacRaskidPage() {
  return (
    <div className="rs-root">
      <section className="legal-hero rs-no-print">
        <div className="rs-kicker">Pravno</div>
        <h1>Obrazac za jednostrani raskid ugovora</h1>
        <p>
          Ovaj obrazac koristite samo ako želite jednostrano raskinuti ugovor — vidi{" "}
          <Link href="/raskid">Pravo na jednostrani raskid</Link> za rokove, iznimke i postupak povrata.
        </p>
      </section>

      <section className="legal-wrap">
        <div className="rs-wrap">
          <div className="legal-content">
            <div className="raskid-form-actions rs-no-print">
              <PrintButton className="rs-btn ghost">Ispiši / spremi kao PDF →</PrintButton>
            </div>

            <div className="raskid-form">
              <p className="raskid-form-title">OBRAZAC ZA JEDNOSTRANI RASKID UGOVORA</p>

              <p>
                Prima:<br />
                <LegalTodo>upiši puni naziv tvrtke (d.o.o.) i adresu sjedišta iz sudskog registra.</LegalTodo>
                e-pošta: info@racunalo.hr
              </p>

              <p>
                Ja ______________________________ ovime izjavljujem da jednostrano raskidam ugovor o kupnji
                sljedeće robe / usluge:
              </p>

              <p className="raskid-form-line">_____________________________________________________________________</p>

              <p>
                Broj narudžbe: ______________________<br />
                Datum narudžbe: _____________________<br />
                Datum primitka robe: ________________
              </p>

              <p>
                Ime i prezime potrošača: ____________________________________<br />
                Adresa potrošača: ___________________________________________<br />
                Broj telefona: ______________&nbsp;&nbsp;E-pošta: _____________________
              </p>

              <p>Potpis potrošača (samo ako se obrazac ispunjava na papiru): __________________</p>

              <p>Datum: ______________</p>
            </div>

            <p className="rs-no-print">
              Popunjen obrazac pošaljite na <a href="mailto:info@racunalo.hr">info@racunalo.hr</a> ili putem
              stranice <Link href="/kontakt">Kontakt</Link>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY, COMPANY_ADDRESS_FULL } from "@/lib/company";
import RaskidForm from "./RaskidForm";

const TITLE = "Obrazac za jednostrani raskid ugovora";
const DESCRIPTION =
  "Ispunite i pošaljite obavijest o jednostranom raskidu ugovora izravno na stranici. Potvrdu o primitku šaljemo e-poštom bez odgode.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/uvjeti/obrazac-za-jednostrani-raskid" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/uvjeti/obrazac-za-jednostrani-raskid" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function ObrazacZaRaskidPage() {
  return (
    <div className="rs-root">
      <section className="legal-hero">
        <div className="rs-kicker">Pravno</div>
        <h1>{TITLE}</h1>
        <p>Ispunite obrazac ovdje — ništa ne morate ispisivati ni skenirati.</p>
      </section>

      <section className="legal-wrap">
        <div className="rs-wrap">
          <div className="legal-content">
            <p>
              Ovaj obrazac ispunite i pošaljite samo ako želite raskinuti ugovor. Razlog ne morate navesti.
              Čim ga pošaljete, na vašu e-poštu stiže potvrda o primitku s danom i satom prijave — ona je vaš
              dokaz da ste raskid prijavili u roku.
            </p>
            <p>
              Prije slanja provjerite <Link href="/raskid#iznimke">iznimke od prava na jednostrani raskid</Link>:
              za računala koja sastavljamo prema vašoj specifikaciji to pravo, sukladno Zakonu o zaštiti
              potrošača, ne postoji.
            </p>
            <p className="ras-recipient">
              <strong>Prima:</strong> {COMPANY.name}, {COMPANY_ADDRESS_FULL}, e-pošta{" "}
              <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>
            </p>

            <RaskidForm />

            <p>
              Obavijest možete poslati i vlastitim riječima — e-poštom na{" "}
              <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> ili poštom na gornju adresu. Obrazac
              nije obavezan, samo je brži.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

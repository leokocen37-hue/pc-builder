import type { Metadata } from "next";
import Link from "next/link";
import LegalTodo from "@/components/LegalTodo";

const TITLE = "Reklamacije i materijalni nedostaci";
const DESCRIPTION = "Kako podnijeti reklamaciju za materijalni nedostatak na proizvodu kupljenom na RAČUNALO.hr.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/reklamacije" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/reklamacije" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function ReklamacijePage() {
  return (
    <div className="rs-root">
      <section className="legal-hero">
        <div className="rs-kicker">Pravno</div>
        <h1>Reklamacije i materijalni nedostaci</h1>
        <p>Postupak prigovora ako proizvod ima materijalni nedostatak — odvojeno od jamstva proizvođača/trgovca.</p>
      </section>

      <section className="legal-wrap">
        <div className="rs-wrap">
          <p className="legal-meta">Zadnje ažurirano: {"{DATUM}"}</p>
          <div className="legal-content">
            <h2>1. Pravna osnova</h2>
            <p>
              Odgovornost za materijalne nedostatke uređena je Zakonom o obveznim odnosima i primjenjuje se
              neovisno o eventualnom dodatnom jamstvu proizvođača ili trgovca (vidi <Link href="/jamstvo">Jamstvo</Link>).
              Materijalni nedostatak postoji ako proizvod nema svojstva potrebna za njegovu redovnu uporabu ili
              svojstva izričito ili prešutno ugovorena.
            </p>
            <LegalTodo>
              potvrdi primjenjuje li se za potrošačke ugovore pravni okvir sukladnosti robe s ugovorom prema
              Zakonu o zaštiti potrošača (koji je zamijenio dio ranijih pravila o materijalnim nedostacima za B2C
              odnose) i uskladi terminologiju cijele stranice s time.
            </LegalTodo>

            <h2>2. Rok za prigovor</h2>
            <LegalTodo>
              navedi točan zakonski rok za obavještavanje trgovca o nedostatku i rok zastare prava (uobičajeno je
              da potrošač o vidljivom nedostatku mora obavijestiti u razumnom roku, a za potrošačke ugovore
              primjenjuje se poseban rok sukladnosti robe s ugovorom — uskladi s važećim propisima u trenutku
              objave stranice).
            </LegalTodo>

            <h2>3. Kako podnijeti reklamaciju</h2>
            <p>Reklamaciju možete podnijeti na jedan od sljedećih načina:</p>
            <ul>
              <li>putem e-maila na <a href="mailto:info@racunalo.hr">info@racunalo.hr</a>,</li>
              <li>putem obrasca na stranici <Link href="/kontakt">Kontakt</Link>,</li>
              <li>pisanim putem na adresu sjedišta trgovca.</li>
            </ul>
            <p>Radi bržeg rješavanja, u prijavu uključite:</p>
            <ul>
              <li>broj narudžbe i datum kupnje,</li>
              <li>opis nedostatka i, ako je moguće, fotografije/video,</li>
              <li>vaše kontakt podatke.</li>
            </ul>
            <LegalTodo>potvrdi želi li trgovac ponuditi zaseban pisani obrazac za reklamaciju (kao dodatak gornjem popisu) i adresu sjedišta za pisane prigovore.</LegalTodo>

            <h2>4. Rok za odgovor trgovca</h2>
            <p>
              Na pisani prigovor potrošača trgovac je dužan pisanim putem odgovoriti u zakonski propisanom roku
              od zaprimanja prigovora.
            </p>
            <LegalTodo>potvrdi točan zakonski rok za odgovor (prema Zakonu o zaštiti potrošača) važeći u trenutku objave.</LegalTodo>

            <h2>5. Rješavanje reklamacije</h2>
            <LegalTodo>
              opiši redoslijed pravnih sredstava dostupnih potrošaču kod materijalnog nedostatka (popravak,
              zamjena, razmjerno sniženje cijene, raskid ugovora) i rok u kojem trgovac mora postupiti po
              osnovanoj reklamaciji.
            </LegalTodo>

            <h2>6. Troškovi</h2>
            <LegalTodo>navedi tko snosi troškove dostave/povrata proizvoda u slučaju osnovane reklamacije (u pravilu trgovac, ako je nedostatak dokazano materijalni).</LegalTodo>

            <h2>7. Odnos prema jamstvu</h2>
            <p>
              Reklamacija zbog materijalnog nedostatka postoji neovisno o dodatnom jamstvu koje dajemo na
              proizvode — pogledajte uvjete na stranici <Link href="/jamstvo">Jamstvo</Link>.
            </p>

            <h2>8. Kontakt</h2>
            <p>Za sve upite o reklamacijama javite nam se na <a href="mailto:info@racunalo.hr">info@racunalo.hr</a>.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

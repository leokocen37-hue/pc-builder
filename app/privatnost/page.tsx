import type { Metadata } from "next";
import Link from "next/link";
import LegalTodo from "@/components/LegalTodo";

const TITLE = "Politika privatnosti";
const DESCRIPTION = "Koje osobne podatke prikupljamo, zašto, koliko ih čuvamo i koja prava imate prema GDPR-u.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/privatnost" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/privatnost" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function PrivatnostPage() {
  return (
    <div className="rs-root">
      <section className="legal-hero">
        <div className="rs-kicker">Pravno</div>
        <h1>Politika privatnosti</h1>
        <p>Kako prikupljamo, koristimo i štitimo vaše osobne podatke kada koristite RAČUNALO.hr.</p>
      </section>

      <section className="legal-wrap">
        <div className="rs-wrap">
          <p className="legal-meta">Zadnje ažurirano: {"{DATUM}"}</p>
          <div className="legal-content">
            <h2>1. Voditelj obrade podataka</h2>
            <LegalTodo>
              upiši puni naziv tvrtke, sjedište, OIB i kontakt podatke voditelja obrade (i podatke službenika za
              zaštitu podataka, ako je imenovan).
            </LegalTodo>

            <h2>2. Koje podatke prikupljamo</h2>
            <ul>
              <li>Podaci za narudžbu: ime i prezime, adresa dostave, e-mail, telefon.</li>
              <li>Podaci o plaćanju: obrađuju se putem naših platnih partnera (vidi odjeljak 5.) — mi ne pohranjujemo podatke o karticama.</li>
              <li>Podaci o korištenju stranice: IP adresa, vrsta uređaja/preglednika, stranice koje posjećujete (putem kolačića — vidi <Link href="/kolacici">Pravila o kolačićima</Link>).</li>
              <li>Podaci iz kontaktnog obrasca i konfiguratora: ime, e-mail, telefon, poruka, odabrana konfiguracija (kada nam ih sami pošaljete).</li>
            </ul>
            <LegalTodo>potvrdi je li popis potpun i uskladi s aktualnim tehničkim tokom podataka (npr. Shopify, analytics alati ako se dodaju).</LegalTodo>

            <h2>3. Svrha i pravna osnova obrade</h2>
            <ul>
              <li>Izvršenje narudžbe i ugovora o kupoprodaji — izvršenje ugovora (čl. 6(1)(b) GDPR-a).</li>
              <li>Komunikacija povodom upita — legitimni interes / privola (čl. 6(1)(f) / (a) GDPR-a).</li>
              <li>Ispunjenje zakonskih obveza (npr. računovodstvo, porezni propisi) — pravna obveza (čl. 6(1)(c) GDPR-a).</li>
            </ul>
            <LegalTodo>potvrdi i eventualnu obradu za marketinške svrhe (newsletter i sl.) i pripadajuću pravnu osnovu (privola), ako je primjenjivo.</LegalTodo>

            <h2>4. Razdoblje čuvanja podataka</h2>
            <LegalTodo>
              odredi konkretna razdoblja čuvanja po kategoriji podataka (npr. računovodstveni dokumenti prema
              zakonskom roku, podaci o narudžbi za vrijeme trajanja jamstva + zakonski rok, podaci iz kontaktnog
              obrasca do rješavanja upita ili kraće).
            </LegalTodo>

            <h2>5. Primatelji podataka</h2>
            <p>Vaše podatke po potrebi dijelimo s pružateljima usluga potrebnih za izvršenje narudžbe, uključujući:</p>
            <ul>
              <li>Shopify (platforma za obradu narudžbi i plaćanja)</li>
              <li>dostavne službe zadužene za isporuku pošiljke</li>
              <li>pružatelje platnih usluga (kartično plaćanje, PayPal, KEKS Pay)</li>
            </ul>
            <LegalTodo>potvrdi cjeloviti popis obrađivača i, ako je primjenjivo, informacije o prijenosu podataka izvan EGP-a (npr. Shopify infrastruktura) uz odgovarajuće zaštitne mjere.</LegalTodo>

            <h2>6. Vaša prava</h2>
            <p>U skladu s GDPR-om, imate pravo na:</p>
            <ul>
              <li>pristup svojim osobnim podacima,</li>
              <li>ispravak netočnih podataka,</li>
              <li>brisanje podataka („pravo na zaborav&#8221;),</li>
              <li>ograničenje obrade,</li>
              <li>prenosivost podataka,</li>
              <li>prigovor na obradu,</li>
              <li>podnošenje pritužbe Agenciji za zaštitu osobnih podataka (AZOP).</li>
            </ul>
            <p>Zahtjeve vezane uz svoja prava možete poslati na <a href="mailto:info@racunalo.hr">info@racunalo.hr</a>.</p>

            <h2>7. Sigurnost podataka</h2>
            <LegalTodo>opiši tehničke i organizacijske mjere zaštite podataka koje se stvarno primjenjuju (enkripcija, kontrola pristupa i sl.).</LegalTodo>

            <h2>8. Kolačići</h2>
            <p>Detalje o kolačićima koje koristimo pronađite na stranici <Link href="/kolacici">Pravila o kolačićima</Link>.</p>

            <h2>9. Izmjene ove politike</h2>
            <p>Ovu Politiku privatnosti možemo povremeno ažurirati. Datum zadnje izmjene naveden je na vrhu stranice.</p>

            <h2>10. Kontakt</h2>
            <p>Za sva pitanja o obradi osobnih podataka javite nam se na <a href="mailto:info@racunalo.hr">info@racunalo.hr</a> ili putem stranice <Link href="/kontakt">Kontakt</Link>.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

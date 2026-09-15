import type { Metadata } from "next";
import Link from "next/link";
import LegalTodo from "@/components/LegalTodo";
import { COMPANY, COMPANY_ADDRESS_FULL } from "@/lib/company";

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
          <p className="legal-meta">Zadnje ažurirano: rujan 2026.</p>
          <div className="legal-content">
            <h2>1. Voditelj obrade podataka</h2>
            <p>Voditelj obrade vaših osobnih podataka je:</p>
            <ul>
              <li><strong>{COMPANY.legalName}</strong> ({COMPANY.name})</li>
              <li>Sjedište: {COMPANY_ADDRESS_FULL}</li>
              <li>OIB: {COMPANY.oib}</li>
              <li>E-pošta: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></li>
            </ul>
            <p>
              Nismo imenovali službenika za zaštitu podataka jer naša djelatnost ne ispunjava uvjete iz članka 37.
              Opće uredbe o zaštiti podataka (nema opsežnog praćenja ni obrade posebnih kategorija podataka u
              velikom opsegu). Za sva pitanja o obradi podataka obratite se na{" "}
              <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
            </p>

            <h2>2. Koje podatke prikupljamo</h2>
            <ul>
              <li>Podaci za narudžbu: ime i prezime, adresa dostave, e-mail, telefon.</li>
              <li>Podaci o plaćanju: obrađuju se putem naših platnih partnera (vidi odjeljak 5.) — mi ne pohranjujemo podatke o karticama.</li>
              <li>Podaci o korištenju stranice: IP adresa, vrsta uređaja/preglednika, stranice koje posjećujete (putem kolačića — vidi <Link href="/kolacici">Pravila o kolačićima</Link>).</li>
              <li>Podaci iz kontaktnog obrasca i konfiguratora: ime, e-mail, telefon, poruka, odabrana konfiguracija (kada nam ih sami pošaljete).</li>
            </ul>
            <p>
              Sadržaj košarice i odabir prikaza u konfiguratoru spremaju se lokalno u vašem pregledniku i ne
              šalju nam se dok ne dovršite narudžbu ili nam sami ne pošaljete konfiguraciju.
            </p>

            <h2>3. Svrha i pravna osnova obrade</h2>
            <ul>
              <li>Izvršenje narudžbe i ugovora o kupoprodaji — izvršenje ugovora (čl. 6(1)(b) GDPR-a).</li>
              <li>Komunikacija povodom upita — legitimni interes / privola (čl. 6(1)(f) / (a) GDPR-a).</li>
              <li>Ispunjenje zakonskih obveza (npr. računovodstvo, porezni propisi) — pravna obveza (čl. 6(1)(c) GDPR-a).</li>
            </ul>
            <p>
              Trenutno ne šaljemo newsletter ni druge marketinške poruke i ne obrađujemo podatke u marketinške
              svrhe. Ako to uvedemo, slat ćemo ih isključivo na temelju vaše prethodne privole (čl. 6(1)(a)
              GDPR-a), koju ćete u svakom trenutku moći povući, a ova će stranica biti ažurirana.
            </p>

            <h2>4. Razdoblje čuvanja podataka</h2>
            <ul>
              <li>
                <strong>Računi i knjigovodstvene isprave</strong> — 11 godina od kraja poslovne godine na koju se
                odnose, sukladno propisima o računovodstvu.
              </li>
              <li>
                <strong>Podaci o narudžbi i jamstvu</strong> — za vrijeme trajanja jamstva i odgovornosti za
                nesukladnost robe, uvećano za rok zastare potraživanja.
              </li>
              <li>
                <strong>Upiti putem kontaktnog obrasca i e-pošte</strong> — do rješavanja upita, a najdulje 12
                mjeseci nakon zadnje komunikacije, osim ako je potrebno dulje čuvanje radi eventualnog spora.
              </li>
              <li>
                <strong>Zapis o prihvaćanju uvjeta uz narudžbu</strong> — zajedno s narudžbom, kao dokaz da je
                obavijest dana prije sklapanja ugovora.
              </li>
              <li>
                <strong>Kolačić pristanka</strong> — 180 dana, nakon čega se pristanak ponovno traži.
              </li>
            </ul>

            <h2>5. Primatelji podataka</h2>
            <p>Vaše podatke dijelimo samo s pružateljima usluga nužnim za izvršenje narudžbe i rad stranice:</p>
            <ul>
              <li><strong>Shopify</strong> — platforma za obradu narudžbi i naplatu (Shopify International Ltd., Irska).</li>
              <li><strong>PayPal</strong> — obrada plaćanja za kupce koji odaberu taj način (PayPal (Europe) S.à r.l. et Cie, S.C.A., Luksemburg).</li>
              <li><strong>Vercel</strong> — hosting ovih internetskih stranica.</li>
              <li><strong>Dostavne službe</strong> — isporuka pošiljke (ime, adresa, telefon i e-pošta radi obavijesti o dostavi).</li>
            </ul>
            <p>
              Podatke ne prodajemo niti ih dijelimo u svrhe koje nisu navedene. Pojedini pružatelji usluga mogu
              podatke obrađivati i izvan Europskog gospodarskog prostora; u tom se slučaju prijenos temelji na
              odluci Europske komisije o primjerenosti ili na standardnim ugovornim klauzulama.
            </p>
            <LegalTodo>
              popis obrađivača dopuni kad se doda bilo koji novi alat (analitika, e-mail marketing, chat) i
              provjeri s odvjetnikom koja se konkretna osnova za prijenos izvan EGP-a primjenjuje na svakog od
              gore navedenih pružatelja u trenutku objave.
            </LegalTodo>

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
            <p>Primjenjujemo sljedeće mjere zaštite:</p>
            <ul>
              <li>sav promet između vašeg preglednika i naših stranica te stranice za naplatu odvija se preko šifrirane HTTPS/TLS veze,</li>
              <li>podatke o platnim karticama ne primamo niti pohranjujemo — unose se izravno kod pružatelja platnih usluga,</li>
              <li>narudžbe se obrađuju unutar Shopify sustava, uz pristup ograničen na osobe kojima je nužan za obradu narudžbe,</li>
              <li>pristup administrativnim sustavima zaštićen je osobnim korisničkim računima i višefaktorskom autentifikacijom.</li>
            </ul>
            <LegalTodo>
              provjeri da gornji popis odgovara stvarnom stanju u trenutku objave — posebno je li višefaktorska
              autentifikacija doista uključena na svim administratorskim računima (Shopify, hosting, e-pošta).
            </LegalTodo>

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

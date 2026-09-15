import type { Metadata } from "next";
import Link from "next/link";
import LegalTodo from "@/components/LegalTodo";
import { COMPANY, COMPANY_ADDRESS_FULL } from "@/lib/company";

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
          <p className="legal-meta">Zadnje ažurirano: rujan 2026.</p>
          <div className="legal-content">
            <h2>1. Pravna osnova</h2>
            <p>
              Odgovornost za materijalne nedostatke uređena je Zakonom o obveznim odnosima i primjenjuje se
              neovisno o eventualnom dodatnom jamstvu proizvođača ili trgovca (vidi <Link href="/jamstvo">Jamstvo</Link>).
              Materijalni nedostatak postoji ako proizvod nema svojstva potrebna za njegovu redovnu uporabu ili
              svojstva izričito ili prešutno ugovorena.
            </p>
            <p>
              Za ugovore sklopljene s potrošačima primjenjuju se pravila o <strong>sukladnosti robe s
              ugovorom</strong>. Odgovaramo za svaku nesukladnost koja je postojala u trenutku isporuke robe.
            </p>

            <h2>2. Rokovi</h2>
            <ul>
              <li>
                Odgovaramo za nesukladnost koja se pokaže u roku od <strong>dvije godine</strong> od dana
                isporuke robe.
              </li>
              <li>
                Za nesukladnost koja se pokaže u roku od <strong>godine dana</strong> od isporuke smatra se da je
                postojala već u trenutku isporuke, osim ako dokažemo suprotno ili ako je takva pretpostavka
                nespojiva s prirodom robe ili nesukladnosti. Nakon toga roka teret dokaza je na potrošaču.
              </li>
              <li>
                Potrošač nije dužan prijaviti nesukladnost u nekom posebnom kratkom roku, ali preporučujemo da to
                učini čim je uoči kako bi se problem brže riješio.
              </li>
            </ul>
            <LegalTodo>
              provjeri s odvjetnikom točne rokove i pripadajuće članke važećih propisa u trenutku objave (rok
              odgovornosti, trajanje pretpostavke o postojanju nesukladnosti i rok zastare), te uskladi
              terminologiju ove stranice s konačnom formulacijom.
            </LegalTodo>

            <h2>3. Kako podnijeti reklamaciju</h2>
            <p>Reklamaciju možete podnijeti na jedan od sljedećih načina:</p>
            <ul>
              <li>putem e-maila na <a href="mailto:info@racunalo.hr">info@racunalo.hr</a>,</li>
              <li>putem obrasca na stranici <Link href="/kontakt">Kontakt</Link>,</li>
              <li>pisanim putem na adresu {COMPANY.name}, {COMPANY_ADDRESS_FULL}.</li>
            </ul>
            <p>Radi bržeg rješavanja, u prijavu uključite:</p>
            <ul>
              <li>broj narudžbe i datum kupnje,</li>
              <li>opis nedostatka i, ako je moguće, fotografije/video,</li>
              <li>vaše kontakt podatke.</li>
            </ul>
            <p>Poseban obrazac nije potreban — dovoljna je poruka koja sadrži gore navedene podatke.</p>

            <h2>4. Rok za odgovor trgovca</h2>
            <p>
              Na uredno zaprimljen pisani prigovor odgovaramo pisanim putem <strong>u roku od 15 dana</strong> od
              dana zaprimanja prigovora.
            </p>

            <h2>5. Rješavanje reklamacije</h2>
            <p>Ako je roba nesukladna ugovoru, potrošač ima pravo, sljedećim redoslijedom:</p>
            <ol>
              <li>
                zahtijevati <strong>popravak ili zamjenu</strong> robe — potrošač bira između ta dva sredstva,
                osim ako je odabrano sredstvo nemoguće ili bi za nas predstavljalo nerazmjeran trošak u odnosu na
                drugo;
              </li>
              <li>
                ako popravak ili zamjena nisu izvedivi, ako ih nismo izvršili u razumnom roku, ako nesukladnost
                i dalje postoji ili je toliko ozbiljna da opravdava trenutačno sniženje ili raskid — zahtijevati{" "}
                <strong>razmjerno sniženje cijene</strong> ili <strong>raskid ugovora</strong> uz povrat plaćenog
                iznosa.
              </li>
            </ol>
            <p>
              Popravak ili zamjenu izvršavamo besplatno i u razumnom roku od trenutka kada nas je potrošač
              obavijestio o nesukladnosti, bez znatnijih neugodnosti za potrošača i uzimajući u obzir prirodu
              robe i svrhu za koju je potrošač robu tražio. Zbog nesukladnosti manje važnosti potrošač nema pravo
              na raskid ugovora.
            </p>

            <h2>6. Troškovi</h2>
            <p>
              Troškove koji nastanu radi usklađivanja robe s ugovorom — posebno troškove dostave, rada i
              materijala — <strong>snosimo mi</strong>. Kod osnovane reklamacije potrošač ne snosi trošak slanja
              robe na provjeru ni trošak povrata popravljene ili zamijenjene robe. Uputu za slanje i način
              preuzimanja pošiljke dogovaramo s potrošačem prije slanja, kako trošak ne bi išao preko njega.
            </p>

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

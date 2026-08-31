import type { Metadata } from "next";
import Link from "next/link";
import LegalTodo from "@/components/LegalTodo";

const TITLE = "Opći uvjeti poslovanja";
const DESCRIPTION = "Uvjeti kupnje na RAČUNALO.hr — narudžba, cijene, isporuka, plaćanje, jamstvo i prava potrošača.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/uvjeti" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/uvjeti" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function UvjetiPage() {
  return (
    <div className="rs-root">
      <section className="legal-hero">
        <div className="rs-kicker">Pravno</div>
        <h1>Opći uvjeti poslovanja</h1>
        <p>Ovi uvjeti uređuju odnos između RAČUNALO.hr i kupca pri kupnji putem naše internetske trgovine.</p>
      </section>

      <section className="legal-wrap">
        <div className="rs-wrap">
          <p className="legal-meta">Zadnje ažurirano: kolovoz 2026.</p>
          <div className="legal-content">
            <h2>1. Opći podaci o trgovcu</h2>
            <LegalTodo>
              upiši puni naziv tvrtke, sjedište, OIB, MB, iznos temeljnog kapitala (ako d.o.o.), podatke o
              upisu u sudski registar i nadležni trgovački sud, te kontakt podatke (e-mail, telefon).
            </LegalTodo>

            <h2>2. Predmet uvjeta</h2>
            <p>
              Ovi Opći uvjeti poslovanja (u nastavku: Uvjeti) primjenjuju se na sve kupnje ostvarene putem internetske
              trgovine RAČUNALO.hr, uključujući kupnju gotovih računala, računala sastavljenih putem konfiguratora te
              periferije i ostale opreme.
            </p>

            <h2>3. Sklapanje ugovora</h2>
            <p>
              Narudžba putem web stranice predstavlja ponudu kupca za sklapanje ugovora o kupoprodaji. Ugovor se
              smatra sklopljenim kada trgovac potvrdi narudžbu kupcu.
            </p>
            <LegalTodo>
              potvrdi točan trenutak sklapanja ugovora (potvrda e-mailom / plaćanje / slanje robe) i postupak u
              slučaju nedostupnosti komponenti nakon narudžbe (posebno relevantno za konfigurator, gdje se
              konačna konfiguracija sastavlja ručno).
            </LegalTodo>

            <h2>4. Cijene i način plaćanja</h2>
            <p>
              Sve cijene istaknute na stranici izražene su u eurima (EUR) i uključuju PDV, osim ako je izričito
              drugačije navedeno. Za konfiguracije sastavljene putem konfiguratora cijena uključuje trošak sastavljanja
              i testiranja računala.
            </p>
            <LegalTodo>navedi dostupne načine plaćanja (kartično, PayPal, KEKS Pay, obročno plaćanje, virman) i uvjete svakog od njih.</LegalTodo>

            <h2>5. Isporuka</h2>
            <p>Detalji o rokovima i načinu isporuke nalaze se na stranici <Link href="/dostava">Dostava i plaćanje</Link>.</p>
            <LegalTodo>potvrdi pravni okvir prijenosa rizika slučajne propasti robe s trgovca na kupca (obično trenutak predaje robi prijevozniku ili kupcu, ovisno o tome tko organizira prijevoz).</LegalTodo>

            <h2>6. Pravo na jednostrani raskid ugovora</h2>
            <p>
              Potrošači imaju pravo na jednostrani raskid ugovora sklopljenog na daljinu, uz iznimke propisane
              zakonom — vidi <Link href="/raskid">Pravo na jednostrani raskid</Link> za detaljne uvjete, uključujući
              posebnosti koje se odnose na računala sastavljena po narudžbi u konfiguratoru.
            </p>

            <h2>7. Jamstvo i reklamacije</h2>
            <p>
              Na svako računalo prodano putem RAČUNALO.hr daje se jamstvo — vidi <Link href="/jamstvo">Jamstvo</Link>.
              Za materijalne nedostatke i postupak prigovora vidi <Link href="/reklamacije">Reklamacije</Link>.
            </p>

            <h2>8. Ograničenje odgovornosti</h2>
            <LegalTodo>
              formuliraj opseg i granice odgovornosti trgovca (npr. za neispravno korištenje, izmjene sklopa od
              strane kupca, gubitak podataka, neizravnu štetu) u skladu s prisilnim odredbama Zakona o zaštiti
              potrošača i Zakona o obveznim odnosima — ograničenja odgovornosti prema potrošačima su zakonski
              ograničena i ne smiju isključivati prava koja potrošaču pripadaju po zakonu.
            </LegalTodo>

            <h2>9. Zaštita osobnih podataka</h2>
            <p>Podaci koje prikupljamo pri narudžbi obrađuju se u skladu s našom <Link href="/privatnost">Politikom privatnosti</Link>.</p>

            <h2>10. Rješavanje sporova</h2>
            <LegalTodo>
              unesi standardnu odredbu o izvansudskom rješavanju potrošačkih sporova (nadležni sud, mogućnost
              korištenja Platforme za online rješavanje sporova Europske komisije te popisa nadležnih tijela za
              alternativno rješavanje sporova u RH).
            </LegalTodo>

            <h2>11. Izmjene uvjeta</h2>
            <p>
              RAČUNALO.hr zadržava pravo izmjene ovih Uvjeta. Izmjene stupaju na snagu objavom na ovoj stranici i
              ne utječu na već sklopljene ugovore.
            </p>

            <h2>12. Kontakt</h2>
            <p>Za sva pitanja vezana uz ove Uvjete, javite nam se na <a href="mailto:info@racunalo.hr">info@racunalo.hr</a> ili putem stranice <Link href="/kontakt">Kontakt</Link>.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

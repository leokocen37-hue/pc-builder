import type { Metadata } from "next";
import Link from "next/link";
import LegalTodo from "@/components/LegalTodo";

const TITLE = "Pravo na jednostrani raskid ugovora";
const DESCRIPTION = "Uvjeti i iznimke za jednostrani raskid ugovora sklopljenog na daljinu, uključujući posebnosti za konfiguracije po mjeri.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/raskid" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/raskid" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function RaskidPage() {
  return (
    <div className="rs-root">
      <section className="legal-hero">
        <div className="rs-kicker">Pravno</div>
        <h1>Pravo na jednostrani raskid ugovora</h1>
        <p>Kada i kako možete odustati od kupnje sklopljene na daljinu — i gdje postoji iznimka od tog prava.</p>
      </section>

      <section className="legal-wrap">
        <div className="rs-wrap">
          <p className="legal-meta">Zadnje ažurirano: {"{DATUM}"}</p>
          <div className="legal-content">
            <h2>1. Opće pravo na raskid (14 dana)</h2>
            <p>
              Sukladno Zakonu o zaštiti potrošača, potrošač ima pravo, ne navodeći razloge, jednostrano raskinuti
              ugovor sklopljen na daljinu u roku od 14 dana od dana kada je potrošaču ili trećoj osobi koju je
              potrošač odredio, a koja nije prijevoznik, roba predana u posjed.
            </p>
            <LegalTodo>
              potvrdi točan tekst zakonske odredbe, rok za slanje izjave o raskidu, način na koji potrošač može
              izjaviti raskid (obrazac, e-mail, pošta) te rok i način povrata plaćenog iznosa (uključujući
              trošak najjeftinijeg standardnog prijevoza koji trgovac nudi).
            </LegalTodo>

            <h2>2. Iznimka — roba izrađena po specifikaciji potrošača</h2>
            <p>
              Pravo na jednostrani raskid <strong>ne primjenjuje se</strong> na ugovore o robi koja je izrađena po
              specifikaciji potrošača ili koja je jasno prilagođena potrošaču. Ovo se, u pravilu, odnosi na
              računala sastavljena putem našeg konfiguratora, gdje kupac samostalno bira i kombinira pojedinačne
              komponente (procesor, matičnu ploču, grafičku karticu, memoriju, kućište i dr.) u konfiguraciju
              izrađenu isključivo za njega.
            </p>
            <LegalTodo>
              potvrdi doseg ove iznimke — obuhvaća li SVE konfiguracije sastavljene u konfiguratoru bez iznimke,
              ili samo one gdje je odabir kupca doveo do zamjetne prilagodbe u odnosu na standardnu, unaprijed
              definiranu konfiguraciju. Uskladi formulaciju s čl. 79. Zakona o zaštiti potrošača (iznimke od prava
              na jednostrani raskid) i potvrdi primjenjuje li se ista iznimka i na „gotova računala&#8221; koja se
              prodaju kao unaprijed definirane, nepromijenjene konfiguracije (za njih iznimka vjerojatno NE vrijedi).
            </LegalTodo>

            <h2>3. Umanjena vrijednost robe pri povratu</h2>
            <p>
              Za robu na koju se pravo na raskid ipak primjenjuje, potrošač odgovara za svako umanjenje vrijednosti
              robe koje je rezultat rukovanja robom, osim onog koje je bilo potrebno za utvrđivanje prirode,
              obilježja i funkcionalnosti robe.
            </p>
            <LegalTodo>
              opiši konkretno što se smatra „potrebnim rukovanjem&#8221; za računalo/perifernu opremu (npr. uključivanje
              i osnovna provjera rada) nasuprot rukovanju koje umanjuje vrijednost (npr. tragovi montaže/demontaže
              komponenti, oštećenja ambalaže bitna za daljinu preprodaju, brisanje/instalacija softvera koja
              zahtijeva ponovno licenciranje). Navedi i tko snosi trošak povrata robe.
            </LegalTodo>

            <h2>4. Obrazac za jednostrani raskid ugovora</h2>
            <p>Ukoliko se pravo na raskid primjenjuje na vašu narudžbu, izjavu o raskidu možete poslati koristeći obrazac u nastavku:</p>
            <LegalTodo>
              umetni službeni Obrazac za jednostrani raskid ugovora (prema Prilogu Zakona o zaštiti potrošača) s
              poljima: primatelj (naziv i adresa trgovca), obavijest o raskidu ugovora, datum narudžbe/primitka,
              ime i adresa potrošača, potpis (za papirnatu verziju) i datum.
            </LegalTodo>
            <p>Popunjen obrazac pošaljite na <a href="mailto:info@racunalo.hr">info@racunalo.hr</a> ili putem stranice <Link href="/kontakt">Kontakt</Link>.</p>

            <h2>5. Poveznice</h2>
            <p>
              Vidi i <Link href="/uvjeti">Opće uvjete poslovanja</Link>, <Link href="/reklamacije">Reklamacije</Link> i{" "}
              <Link href="/jamstvo">Jamstvo</Link> za povezane informacije.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

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
          <p className="legal-meta">Zadnje ažurirano: kolovoz 2026.</p>
          <div className="legal-content">
            <h2>1. Opće pravo na raskid (14 dana)</h2>
            <p>
              Potrošač ima pravo, ne navodeći razloge, jednostrano raskinuti ugovor sklopljen na daljinu u roku od
              14 dana.
            </p>
            <p>
              Rok počinje teći od dana kada je potrošaču ili trećoj osobi koju je potrošač odredio, a koja nije
              prijevoznik, roba koja je predmet ugovora predana u posjed. Ako je jednom narudžbom naručeno više
              komada robe koji se isporučuju odvojeno, rok počinje teći od dana predaje posljednjeg komada.
            </p>
            <p>
              Da bi ostvario pravo na jednostrani raskid, potrošač nas mora prije isteka roka obavijestiti o svojoj
              odluci nedvosmislenom izjavom poslanom poštom ili elektroničkom poštom, u kojoj navodi svoje ime i
              prezime, adresu, broj telefona i adresu elektroničke pošte. Potrošač se može koristiti i priloženim{" "}
              <Link href="/uvjeti/obrazac-za-jednostrani-raskid">obrascem za jednostrani raskid ugovora</Link>.
            </p>
            <div className="legal-address-block">
              <LegalTodo>upiši puni naziv tvrtke (d.o.o.) i adresu sjedišta iz sudskog registra.</LegalTodo>
              <div>E-pošta: <a href="mailto:info@racunalo.hr">info@racunalo.hr</a></div>
            </div>
            <p>
              Potvrdu o primitku obavijesti o jednostranom raskidu dostavit ćemo bez odgode elektroničkom poštom.
            </p>

            <h2>2. Iznimke od prava na jednostrani raskid</h2>
            <p>
              Sukladno Zakonu o zaštiti potrošača, potrošač nema pravo na jednostrani raskid ugovora ako je predmet
              ugovora roba koja je izrađena po specifikaciji potrošača ili koja je jasno prilagođena potrošaču.
            </p>
            <p>
              Ta se iznimka primjenjuje na računala koja sastavljamo prema konfiguraciji koju je potrošač sam
              odabrao u konfiguratoru na ovim internetskim stranicama. Takva računala ne držimo na zalihi —
              komponente nabavljamo i računalo sastavljamo isključivo nakon narudžbe i prema specifikaciji koju je
              odredio pojedini potrošač.
            </p>
            <p>
              Ista se iznimka primjenjuje i na računala predstavljena u kategoriji „Gotova računala&#8221;. Ta
              računala nisu skladišna roba i ne držimo ih na zalihi. Riječ je o preporučenim konfiguracijama —
              provjerenim kombinacijama komponenti koje smo složili u vlastitom konfiguratoru i nudimo ih potrošaču
              kao preporuku. Kada potrošač odabere jednu od tih konfiguracija, komponente naručujemo od dobavljača
              i računalo sastavljamo isključivo nakon te narudžbe i prema toj konfiguraciji, jednako kao i kod
              konfiguracije koju potrošač sam složi u konfiguratoru. Odabirom preporučene konfiguracije potrošač je
              odredio specifikaciju prema kojoj se roba izrađuje.
            </p>
            <LegalTodo>
              ova primjena iznimke na „Gotova računala&#8221; nije nesporna i treba je svjesno potvrditi prije
              objave. Iznimka traži robu izrađenu po specifikaciji potrošača — kod gotovih računala kako su
              trenutno postavljena potrošač bira samo model iz kataloga, ne određuje nijednu komponentu. Sud EU
              (Möbel Kraft, C-529/19) smatra da sam trenutak sastavljanja nije odlučujući — odlučujuća je
              specifikacija potrošača. Novija praksa ide u istom smjeru: OLG Brandenburg, 7 U 133/23 (16. srpnja
              2024.), priznao je pravo na raskid kupcu konfiguriranog prijenosnika koji je birao samo između
              unaprijed zadanih standardnih opcija. Ova se odredba može znatno ojačati bez izmjene teksta dodavanjem
              stvarnog izbora na stranice gotovih računala (npr. obavezan odabir memorije, pohrane i operativnog
              sustava prije dodavanja u košaricu) — provjeri s odvjetnikom prije objave, uz procjenu rizika s
              obzirom na navedenu europsku praksu.
            </LegalTodo>
            <p>
              Prije dovršetka narudžbe za bilo koje računalo iz prethodna dva stavka potrošača izričito upozoravamo
              da za tu robu ne postoji pravo na jednostrani raskid i tražimo njegovu potvrdu da je s time upoznat.
            </p>
            <p>
              Na svu ostalu robu koja se prodaje na ovim stranicama — periferiju, komponente, opremu i pribor —
              pravo na jednostrani raskid u roku od 14 dana primjenjuje se u cijelosti.
            </p>

            <h2>3. Umanjena vrijednost robe</h2>
            <p>
              Potrošač je odgovoran za svako umanjenje vrijednosti robe koje je rezultat rukovanja robom, osim onog
              koje je bilo potrebno za utvrđivanje prirode, obilježja i funkcionalnosti robe.
            </p>
            <p>
              Kod računalne opreme to znači da potrošač smije robu pregledati i isprobati u opsegu u kojem bi to
              bilo uobičajeno u prodavaonici. Puštanje u trajni rad, instalacija i aktivacija operativnog sustava ili
              druge licencirane programske podrške, uklanjanje ili oštećenje zaštitnih naljepnica i plombi
              proizvođača, uklanjanje serijskih oznaka te vidljivi tragovi korištenja prelaze taj opseg i
              predstavljaju umanjenje vrijednosti robe.
            </p>
            <p>
              Iznos umanjenja vrijednosti utvrđujemo za svaki slučaj pojedinačno, obrazlažemo ga pisano i odbijamo
              od iznosa koji vraćamo potrošaču. Licenca operativnog sustava koja je aktivacijom trajno vezana uz
              uređaj ne može se ponovno staviti u prodaju te se njezina vrijednost odbija od iznosa povrata.
            </p>

            <h2>4. Troškovi povrata robe</h2>
            <p>Izravne troškove povrata robe snosi potrošač.</p>

            <h2>5. Povrat plaćenog iznosa</h2>
            <p>
              Vraćamo sve što je plaćeno, uključujući troškove isporuke, bez odgode, a najkasnije u roku od 14 dana
              od dana primitka obavijesti o jednostranom raskidu ugovora.
            </p>
            <p>
              Ako je potrošač odabrao vrstu isporuke koja nije najjeftinija standardna isporuka koju nudimo,
              vraćamo mu trošak isporuke u visini najjeftinije standardne isporuke.
            </p>
            <p>
              Povrat izvršavamo istim sredstvom plaćanja kojim se potrošač koristio prilikom plaćanja, osim ako
              potrošač izričito ne pristane na drugo sredstvo plaćanja i pod uvjetom da ne snosi nikakve dodatne
              troškove.
            </p>
            <p>
              Povrat novca možemo zadržati dok nam roba ne bude vraćena ili dok nam potrošač ne dostavi dokaz da je
              robu poslao natrag, ovisno o tome što nastupi prije.
            </p>
            <p>
              Robu je potrebno vratiti bez odgode, a najkasnije u roku od 14 dana od dana kada nas je potrošač
              obavijestio o jednostranom raskidu ugovora.
            </p>

            <h2>6. Obrazac za jednostrani raskid ugovora</h2>
            <p>
              Ukoliko se pravo na raskid primjenjuje na vašu narudžbu, izjavu o raskidu možete poslati koristeći{" "}
              <Link href="/uvjeti/obrazac-za-jednostrani-raskid">obrazac za jednostrani raskid ugovora</Link>.
              Popunjen obrazac pošaljite na <a href="mailto:info@racunalo.hr">info@racunalo.hr</a> ili putem
              stranice <Link href="/kontakt">Kontakt</Link>.
            </p>

            <h2>7. Poveznice</h2>
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

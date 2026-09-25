import type { Metadata } from "next";
import Link from "next/link";

const TITLE = "Jamstvo";
const DESCRIPTION = "24 mjeseca jamstva na svako računalo kupljeno na RAČUNALO.hr — što pokriva i kako ga ostvariti.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/jamstvo" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/jamstvo" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function JamstvoPage() {
  return (
    <div className="rs-root">
      <section className="legal-hero">
        <div className="rs-kicker">Podrška</div>
        <h1>24 mjeseca jamstva</h1>
        <p>Svako računalo koje sastavimo i pošaljemo dolazi s punih 24 mjeseca jamstva.</p>
      </section>

      <section className="legal-wrap">
        <div className="rs-wrap">
          <div className="legal-content">
            <h2>Što pokriva jamstvo</h2>
            <p>
              Jamstvo pokriva ispravan rad računala i njegovih komponenti u redovnim uvjetima korištenja. Ako se
              tijekom jamstvenog roka pojavi kvar koji nije posljedica vanjskog uzroka (vidi iznimke ispod),
              popravljamo ili zamjenjujemo neispravnu komponentu bez naknade.
            </p>

            <h2>Zašto smo sigurni u ono što šaljemo</h2>
            <p>
              Prije nego što računalo napusti našu radionicu, prolazi kroz sklapanje, provjeru kompatibilnosti
              svih komponenti i stres-test pod opterećenjem. Cilj nam je uhvatiti svaki potencijalni problem prije
              slanja — ne nakon što stigne do vas.
            </p>

            <h2>Operativni sustav</h2>
            <p>
              Operativni sustav nije uključen u cijenu računala, osim ako uz njega kupite licencu. Ako ste je
              kupili, sustav instaliramo i aktiviramo prije slanja. Ako niste, računalo stiže bez operativnog
              sustava. U oba slučaja računalo prije slanja provjeravamo i testiramo — neispravno ili
              neprovjereno ne šaljemo nikada.
            </p>

            <h2>Što jamstvo ne pokriva</h2>
            <ul>
              <li>štetu nastalu nepravilnim rukovanjem, padom, udarcem ili prolijevanjem tekućine,</li>
              <li>oštećenja nastala uslijed neovlaštenih izmjena, popravaka ili rastavljanja od strane trećih osoba,</li>
              <li>štetu nastalu radom izvan tvorničkih specifikacija komponenti (npr. neodgovarajući overclock),</li>
              <li>redovno trošenje dijelova s ograničenim vijekom trajanja,</li>
              <li>probleme uzrokovane softverom koji niste dobili od nas, uključujući viruse i zlonamjerne programe.</li>
            </ul>

            <h2>Kako ostvariti jamstvo</h2>
            <p>
              Javite nam se putem stranice <Link href="/kontakt">Kontakt</Link> ili na{" "}
              <a href="mailto:info@racunalo.hr">info@racunalo.hr</a>, uz kratak opis problema i broj narudžbe.
              Zajedno ćemo utvrditi radi li se o kvaru pokrivenom jamstvom i dogovoriti sljedeće korake —
              popravak ili zamjenu komponente.
            </p>

            <h2>Jamstvo i zakonska prava</h2>
            <p>
              Ovih 24 mjeseca jamstva dajemo dodatno, uz zakonska prava koja vam kao potrošaču pripadaju u
              slučaju materijalnog nedostatka na proizvodu — više o tome na stranici{" "}
              <Link href="/reklamacije">Reklamacije</Link>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

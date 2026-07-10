import type { Metadata } from "next";
import Link from "next/link";

const TITLE = "O nama";
const DESCRIPTION = "Upoznajte RAČUNALO.hr — ručno sastavljena i testirana računala po mjeri, izrađena u Hrvatskoj.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/o-nama" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/o-nama" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function ONamaPage() {
  return (
    <div className="rs-root">
      <section className="legal-hero">
        <div className="rs-kicker">O nama</div>
        <h1>Računala kakva bismo i sami htjeli</h1>
        <p>Ne prodajemo samo komponente sastavljene u kutiju — svako računalo koje izađe iz naših ruku prošlo je kroz stvaran proces sklapanja, provjere i testiranja.</p>
      </section>

      <section className="legal-wrap">
        <div className="rs-wrap">
          <div className="legal-content">
            <h2>Zašto RAČUNALO.hr</h2>
            <p>
              Krenuli smo od jednostavne ideje: kupnja računala ne bi trebala značiti biranje između gotove
              konfiguracije koja ne odgovara točno vašim potrebama i samostalnog sastavljanja bez sigurnosti da
              će sve komponente doista raditi zajedno. Zato smo napravili konfigurator koji u stvarnom vremenu
              provjerava kompatibilnost svake komponente — socket procesora, tip memorije, dimenzije grafičke
              kartice, prostor u kućištu, snagu napajanja — kako biste bili sigurni da će konfiguracija koju
              složite doista i proraditi, bez pogađanja.
            </p>

            <h2>Kako radimo</h2>
            <ul>
              <li><strong>Sastavljanje:</strong> svako računalo — bilo iz konfiguratora ili gotova konfiguracija — ručno sastavljamo u Hrvatskoj.</li>
              <li><strong>Testiranje:</strong> prije slanja svako računalo prolazi kroz provjeru rada i stres-test, kako bismo uhvatili eventualni problem prije nego što stigne do vas, a ne poslije.</li>
              <li><strong>Podrška:</strong> ako niste sigurni koju konfiguraciju odabrati, javite nam namjenu i proračun — pomoći ćemo vam složiti pravi izbor, umjesto da vam prodamo prvo što nam padne na pamet.</li>
            </ul>

            <h2>Za koga sastavljamo</h2>
            <p>
              Radimo konfiguracije za igranje na visokim postavkama, za profesionalni rad — montažu, 3D
              modeliranje i render — te za sve koji žele pouzdano, tiho i uredno računalo za svakodnevnu upotrebu.
              Uz računala nudimo i periferiju: monitore, tipkovnice, miševe i slušalice, kako biste na jednom
              mjestu složili cijeli radni ili gaming setup.
            </p>

            <h2>Jamstvo koje stoji iza toga</h2>
            <p>
              Svako računalo dolazi s 24 mjeseca jamstva. Vjerujemo da je to jedini pošten način prodaje računala
              — ako stojimo iza kvalitete sastavljanja, treba to potvrditi i jamstvo koje dajemo. Više o uvjetima
              pročitajte na stranici <Link href="/jamstvo">Jamstvo</Link>.
            </p>

            <h2>Javite nam se</h2>
            <p>
              Imate pitanje o konfiguraciji, narudžbi ili samo želite čuti savjet prije kupnje? Tu smo —
              posjetite stranicu <Link href="/kontakt">Kontakt</Link> ili nam pišite izravno na{" "}
              <a href="mailto:info@racunalo.hr">info@racunalo.hr</a>.
            </p>
          </div>
        </div>
      </section>
    </div>
  );
}

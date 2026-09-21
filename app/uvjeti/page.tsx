import type { Metadata } from "next";
import Link from "next/link";
import { COMPANY, COMPANY_ADDRESS_FULL } from "@/lib/company";
import { SITE } from "@/lib/site-config";
import { TERMS_UPDATED_LABEL } from "@/lib/terms";

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
          <p className="legal-meta">Zadnje ažurirano: {TERMS_UPDATED_LABEL}</p>
          <div className="legal-content">
            <h2>1. Opći podaci o trgovcu</h2>
            <ul>
              <li>Naziv: <strong>{COMPANY.legalName}</strong> (skraćeno: {COMPANY.name})</li>
              <li>Sjedište: {COMPANY_ADDRESS_FULL}</li>
              <li>OIB: {COMPANY.oib}</li>
              <li>MBS: {COMPANY.mbs}</li>
              <li>Registarski sud: {COMPANY.court}</li>
              <li>Temeljni kapital: {COMPANY.shareCapital}</li>
              <li>Članovi uprave: {COMPANY.directors.join(", ")}</li>
              <li>Djelatnost: {COMPANY.activity}</li>
              <li>E-pošta: <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a></li>
            </ul>
            <p>
              Internetska trgovina {COMPANY.brand} u vlasništvu je i pod upravljanjem društva {COMPANY.name}.
            </p>
            <p>
              Sve upite, prigovore i zahtjeve rješavamo elektroničkom poštom na{" "}
              <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> ili putem obrasca na stranici{" "}
              <Link href="/kontakt">Kontakt</Link>. Tim kanalima ostaje pisani trag komunikacije, a na poruke
              odgovaramo u najkraćem mogućem roku.
            </p>

            <h2>2. Predmet uvjeta</h2>
            <p>
              Ovi Opći uvjeti poslovanja (u nastavku: Uvjeti) primjenjuju se na sve kupnje ostvarene putem internetske
              trgovine RAČUNALO.hr, uključujući kupnju gotovih računala, računala sastavljenih putem konfiguratora te
              periferije i ostale opreme.
            </p>

            <h2>3. Sklapanje ugovora</h2>
            <p>
              Robu odabirete na ovim stranicama i dodajete je u košaricu. Narudžba se dovršava i plaća na
              sigurnoj stranici za naplatu koju za nas vodi Shopify.
            </p>
            <p>
              Dovršetkom narudžbe kupac daje ponudu za sklapanje ugovora o kupoprodaji. <strong>Ugovor je
              sklopljen u trenutku kada kupcu na adresu elektroničke pošte navedenu u narudžbi pošaljemo potvrdu
              narudžbe.</strong> Potvrda narudžbe sadrži podatke o naručenoj robi, cijeni, troškovima isporuke i
              načinu plaćanja. Ako potvrdu ne zaprimite, provjerite mapu neželjene pošte i javite nam se na{" "}
              <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a>.
            </p>
            <p>
              Ugovor se sklapa na hrvatskom jeziku i pohranjuje se u našem sustavu. Tekst ovih Uvjeta dostupan je
              na ovoj stranici u svakom trenutku, a potvrdu narudžbe kupac zaprima elektroničkom poštom u obliku
              koji može pohraniti i reproducirati.
            </p>
            <p>
              Ako pojedina komponenta nakon zaprimanja narudžbe više nije dostupna, o tome ćemo kupca obavijestiti
              bez odgode i ponuditi mu zamjensku komponentu jednakih ili boljih svojstava bez doplate, izmjenu
              konfiguracije ili raskid ugovora uz povrat cjelokupnog plaćenog iznosa. Bez izričite suglasnosti
              kupca nećemo isporučiti računalo koje odstupa od naručene konfiguracije.
            </p>

            <h2>4. Cijene i način plaćanja</h2>
            <p>
              Sve cijene istaknute na stranici izražene su u eurima (EUR) i uključuju PDV, osim ako je izričito
              drugačije navedeno. Za konfiguracije sastavljene putem konfiguratora cijena uključuje trošak sastavljanja
              i testiranja računala.
            </p>
            <p>
              Narudžbu je moguće platiti <strong>kartično</strong> — Visa, Mastercard i Maestro — putem
              Shopify Paymentsa.
            </p>
            <p>
              Plaćanje se izvršava pri dovršetku narudžbe. Podatke o platnim karticama ne primamo niti
              pohranjujemo — unose se izravno kod pružatelja platnih usluga, koji ih obrađuje u skladu s
              primjenjivim sigurnosnim standardima za platne kartice.
            </p>

            <h2>5. Isporuka</h2>
            <p>
              Prijevoz robe organiziramo mi, putem dostavne službe. Detalji o cijeni isporuke nalaze se na
              stranici <Link href="/dostava">Dostava i plaćanje</Link>.
            </p>
            <p>
              <strong>Rok isporuke računala.</strong> Sva računala — i konfiguracije složene u konfiguratoru i
              gotove konfiguracije iz ponude — sastavljamo tek nakon zaprimljene narudžbe. Okvirni rok je{" "}
              <strong>
                izrada i testiranje {SITE.buildDaysMin}–{SITE.buildDaysMax} radnih dana + dostava{" "}
                {SITE.shipDaysMin}–{SITE.shipDaysMax} radna dana
              </strong>, računajući od zaprimljene uplate. Ostala roba, poput periferije, šalje se sa zalihe i
              kod vas je u roku od <strong>{SITE.stockDaysMin}–{SITE.stockDaysMax} radnih dana</strong>,
              uključujući dostavu.
            </p>
            <p>
              Rok je okviran i ne uključuje neradne dane ni državne praznike. Ako se rok iz bilo kojeg razloga
              produži — primjerice zbog nedostupnosti komponente — obavijestit ćemo vas elektroničkom poštom i
              ponuditi zamjensku komponentu, novi rok ili raskid ugovora uz povrat plaćenog iznosa. Sukladno
              Zakonu o zaštiti potrošača, robu isporučujemo najkasnije u roku od 30 dana od sklapanja ugovora,
              osim ako je s vama izričito dogovoren duži rok.
            </p>
            <p>
              Rizik slučajnog oštećenja ili propasti robe prelazi na potrošača u trenutku kada je roba predana
              potrošaču ili trećoj osobi koju je potrošač odredio, a koja nije prijevoznik. Ako je prijevoz
              ugovorio sam potrošač, i to prijevoznikom kojeg mu mi nismo ponudili, rizik prelazi na potrošača u
              trenutku predaje robe tom prijevozniku.
            </p>
            <p>
              Pri preuzimanju pošiljke preporučujemo pregledati ambalažu. Ako je pošiljka vidljivo oštećena,
              prijavite to dostavljaču pri preuzimanju i javite nam se na{" "}
              <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> u najkraćem mogućem roku, po mogućnosti uz
              fotografije — time nam olakšavate postupak prema prijevozniku.
            </p>

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
            <p>
              Odgovaramo za nesukladnost robe s ugovorom i za materijalne nedostatke sukladno Zakonu o obveznim
              odnosima i Zakonu o zaštiti potrošača. <strong>Ništa u ovim Uvjetima ne isključuje niti ograničava
              prava koja potrošaču pripadaju po prisilnim propisima</strong> — vidi{" "}
              <Link href="/reklamacije">Reklamacije</Link> i <Link href="/jamstvo">Jamstvo</Link>.
            </p>
            <p>Ne odgovaramo za štetu koja je nastala:</p>
            <ul>
              <li>korištenjem protivno uputama proizvođača, uključujući overclocking i rad izvan deklariranih specifikacija,</li>
              <li>neovlaštenim otvaranjem, izmjenama ili popravcima koje su izvršile treće osobe,</li>
              <li>mehaničkim oštećenjem, prodorom tekućine, neispravnom električnom instalacijom, udarom groma ili višom silom,</li>
              <li>instalacijom ili korištenjem programske podrške koju nismo isporučili.</li>
            </ul>
            <p>
              Ne odgovaramo za gubitak podataka. Prije predaje uređaja na servis ili povrat kupac je dužan sam
              izraditi sigurnosnu kopiju svojih podataka.
            </p>

            <h2>9. Zaštita osobnih podataka</h2>
            <p>Podaci koje prikupljamo pri narudžbi obrađuju se u skladu s našom <Link href="/privatnost">Politikom privatnosti</Link>.</p>

            <h2>10. Rješavanje sporova</h2>
            <p>
              Eventualne sporove nastojat ćemo riješiti dogovorno. Pisani prigovor možete podnijeti na{" "}
              <a href={`mailto:${COMPANY.email}`}>{COMPANY.email}</a> ili poštom na adresu sjedišta iz točke 1.;
              na uredno zaprimljen pisani prigovor odgovaramo pisanim putem u roku od 15 dana od zaprimanja —
              vidi <Link href="/reklamacije">Reklamacije</Link>.
            </p>
            <p>
              Ako spor ne bude riješen dogovorno, potrošač se može obratiti nekom od tijela za alternativno
              rješavanje potrošačkih sporova u Republici Hrvatskoj. Popis ovlaštenih tijela objavljuje
              ministarstvo nadležno za gospodarstvo. Sudjelovanje u postupku alternativnog rješavanja spora je
              dobrovoljno.
            </p>
            <p>Za sporove je nadležan stvarno i mjesno nadležan sud u Republici Hrvatskoj.</p>

            <h2>11. Izmjene uvjeta</h2>
            <p>
              RAČUNALO.hr zadržava pravo izmjene ovih Uvjeta. Izmjene stupaju na snagu objavom na ovoj stranici i
              ne utječu na već sklopljene ugovore.
            </p>

            <h2>12. Kontakt</h2>
            <p>Za sva pitanja vezana uz ove Uvjete, javite nam se na <a href="mailto:info@racunalo.hr">info@racunalo.hr</a> ili putem stranice <Link href="/kontakt">Kontakt</Link>.</p>
          </div>
          <p className="legal-updated">Zadnje ažurirano: {TERMS_UPDATED_LABEL}</p>
        </div>
      </section>
    </div>
  );
}

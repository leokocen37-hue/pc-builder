import type { Metadata } from "next";
import Link from "next/link";
import LegalTodo from "@/components/LegalTodo";

const TITLE = "Pravila o kolačićima";
const DESCRIPTION = "Koje kolačiće koristimo na RAČUNALO.hr i kako možete upravljati svojim postavkama.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/kolacici" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/kolacici" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function KolaciciPage() {
  return (
    <div className="rs-root">
      <section className="legal-hero">
        <div className="rs-kicker">Pravno</div>
        <h1>Pravila o kolačićima</h1>
        <p>Objašnjenje kolačića koje ova stranica koristi i kako njima možete upravljati.</p>
      </section>

      <section className="legal-wrap">
        <div className="rs-wrap">
          <p className="legal-meta">Zadnje ažurirano: {"{DATUM}"}</p>
          <div className="legal-content">
            <h2>1. Što su kolačići</h2>
            <p>
              Kolačići (cookies) su male tekstualne datoteke koje se pohranjuju na vašem uređaju kada posjetite
              internetsku stranicu. Koriste se kako bi stranica ispravno funkcionirala, pamtila vaše postavke i,
              uz vaš pristanak, razumjela kako se stranica koristi.
            </p>

            <h2>2. Koje kolačiće koristimo</h2>
            <h3>Nužni kolačići</h3>
            <p>
              Ovi kolačići su neophodni za rad stranice (npr. pamćenje sadržaja košarice, prijava/pristup
              zaštićenim stranicama, pamćenje vaše odluke o kolačićima) i ne mogu se isključiti jer bez njih
              stranica ne bi mogla ispravno funkcionirati. Ne zahtijevaju pristanak.
            </p>
            <LegalTodo>
              navedi točan popis nužnih kolačića koje stranica trenutno postavlja (naziv, svrha, trajanje) — npr.
              kolačić košarice, kolačić pristanka na kolačiće, i kolačić za pristup stranici (ako je stranica
              zaštićena lozinkom tijekom izrade).
            </LegalTodo>

            <h3>Analitički i marketinški kolačići</h3>
            <p>
              Ova stranica trenutno ne koristi analitičke ni marketinške kolačiće trećih strana. Ukoliko se u
              budućnosti uvedu (npr. Google Analytics, Meta Pixel), ova stranica će biti ažurirana s detaljnim
              popisom, a takvi kolačići postavljat će se tek nakon vašeg izričitog pristanka putem trake za
              pristanak na kolačiće.
            </p>
            <LegalTodo>ažuriraj ovaj odjeljak ako/kad se dodaju analitički ili marketinški alati.</LegalTodo>

            <h2>3. Upravljanje kolačićima</h2>
            <p>
              Svoj pristanak na neobavezne kolačiće možete dati ili povući putem trake za pristanak koja se
              prikazuje pri prvom posjetu stranici. Kolačiće možete u svakom trenutku obrisati ili blokirati i
              putem postavki svog internetskog preglednika, no imajte na umu da onemogućavanje nužnih kolačića
              može utjecati na ispravan rad stranice.
            </p>

            <h2>4. Kolačići trećih strana</h2>
            <LegalTodo>
              navedi kolačiće koje eventualno postavljaju ugrađene usluge trećih strana (npr. Shopify checkout,
              platni procesori) i uputi na njihove vlastite politike privatnosti/kolačića.
            </LegalTodo>

            <h2>5. Više informacija</h2>
            <p>Za informacije o obradi osobnih podataka pogledajte našu <Link href="/privatnost">Politiku privatnosti</Link>.</p>

            <h2>6. Kontakt</h2>
            <p>Pitanja o kolačićima možete poslati na <a href="mailto:info@racunalo.hr">info@racunalo.hr</a>.</p>
          </div>
        </div>
      </section>
    </div>
  );
}

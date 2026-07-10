"use client";

import { useState } from "react";
import Link from "next/link";

const FAQ_ITEMS: { q: string; a: React.ReactNode }[] = [
  {
    q: "Koliko traje sastavljanje računala iz konfiguratora?",
    a: "Konfiguracije sastavljene po mjeri sklapamo tek nakon što zaprimimo narudžbu, jer svaka kombinacija komponenti je jedinstvena. Prije slanja svako računalo prolazi kroz provjeru rada i stres-test.",
  },
  {
    q: "Mogu li birati pojedinačne komponente?",
    a: (
      <>
        Da — u <Link href="/konfigurator">konfiguratoru</Link> birate procesor, matičnu ploču, memoriju, grafičku karticu, pohranu, kućište, napajanje i hlađenje, a mi u stvarnom vremenu provjeravamo kompatibilnost svakog odabira.
      </>
    ),
  },
  {
    q: "Što ako mi ne odgovara odabrana konfiguracija?",
    a: (
      <>
        Ako niste sigurni koju konfiguraciju odabrati, javite nam namjenu i proračun putem stranice{" "}
        <Link href="/kontakt">Kontakt</Link> — pomoći ćemo vam složiti pravi izbor.
      </>
    ),
  },
  {
    q: "Koje su opcije plaćanja?",
    a: "Narudžbu možete platiti karticom, putem PayPal-a ili KEKS Pay-a. Svi detalji dostupni su na stranici Dostava i plaćanje.",
  },
  {
    q: "Koliko traje jamstvo?",
    a: (
      <>
        Svako računalo dolazi s 24 mjeseca jamstva. Detalje o tome što jamstvo pokriva pronađite na stranici{" "}
        <Link href="/jamstvo">Jamstvo</Link>.
      </>
    ),
  },
  {
    q: "Mogu li vratiti računalo ako se predomislim?",
    a: (
      <>
        Ovisi o vrsti kupnje — za gotove konfiguracije vrijedi opće pravo na jednostrani raskid u zakonskom roku,
        dok za računala sastavljena po vašoj specifikaciji u konfiguratoru postoji zakonska iznimka. Sve detalje
        pročitajte na stranici <Link href="/raskid">Pravo na jednostrani raskid</Link>.
      </>
    ),
  },
  {
    q: "Dostavljate li diljem Hrvatske?",
    a: "Da, dostavljamo na cijelom području Hrvatske. Rok isporuke ovisi o odabranoj konfiguraciji — više na stranici Dostava i plaćanje.",
  },
  {
    q: "Instalirate li operativni sustav?",
    a: "Svako računalo isporučujemo s instaliranim i testiranim sustavom Windows. Ako odaberete opciju bez operativnog sustava, Windows i dalje instaliramo radi testiranja, ali bez aktivirane licence.",
  },
  {
    q: "Što ako se pojavi kvar nakon isporuke?",
    a: (
      <>
        Javite nam se putem stranice <Link href="/kontakt">Kontakt</Link> uz opis problema i broj narudžbe — u
        sklopu jamstva rješavamo popravak ili zamjenu neispravne komponente.
      </>
    ),
  },
];

export default function FaqClient() {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  return (
    <div className="faq-list">
      {FAQ_ITEMS.map((item, i) => {
        const open = openIndex === i;
        return (
          <div key={item.q} className={`faq-item ${open ? "open" : ""}`}>
            <button
              className="faq-q"
              onClick={() => setOpenIndex(open ? null : i)}
              aria-expanded={open}
            >
              {item.q}
              <span className="faq-icon">+</span>
            </button>
            {open && <div className="faq-a">{item.a}</div>}
          </div>
        );
      })}
    </div>
  );
}

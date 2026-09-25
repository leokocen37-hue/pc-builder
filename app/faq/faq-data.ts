import { SITE } from "@/lib/site-config";
import { formatEUR, FREE_SHIPPING_FROM, SHIPPING_FEE } from "@/lib/pricing";

// Plain-text answers for the FAQPage structured data on app/faq/page.tsx.
//
// The rendered accordion in FaqClient.tsx has several answers as JSX, because
// they carry links, and JSX can't be serialised into JSON-LD. So the text lives
// here as well. The two are kept side by side deliberately: same questions, in
// the same order, saying the same thing — change one, change the other.
export const FAQ_SCHEMA_ITEMS: { q: string; a: string }[] = [
  {
    q: "Koliko traje sastavljanje računala iz konfiguratora?",
    a: `Izrada i testiranje traju ${SITE.buildDaysMin}–${SITE.buildDaysMax} radnih dana, a dostava još ${SITE.shipDaysMin}–${SITE.shipDaysMax} radna dana. Svako računalo sklapamo tek nakon što zaprimimo narudžbu — i konfiguracije po mjeri i gotove konfiguracije — jer nijedno ne držimo na zalihi. Prije slanja svako prolazi kroz provjeru rada i stres-test.`,
  },
  {
    q: "Mogu li birati pojedinačne komponente?",
    a: "Da — u konfiguratoru birate procesor, matičnu ploču, memoriju, grafičku karticu, pohranu, kućište, napajanje i hlađenje, a mi u stvarnom vremenu provjeravamo kompatibilnost svakog odabira.",
  },
  {
    q: "Što ako mi ne odgovara odabrana konfiguracija?",
    a: "Ako niste sigurni koju konfiguraciju odabrati, javite nam namjenu i proračun putem stranice Kontakt — pomoći ćemo vam složiti pravi izbor.",
  },
  {
    q: "Koje su opcije plaćanja?",
    a: "Narudžbu možete platiti karticom — Visa, Mastercard ili Maestro. Svi detalji dostupni su na stranici Dostava i plaćanje.",
  },
  {
    q: "Koliko traje jamstvo?",
    a: "Svako računalo dolazi s 24 mjeseca jamstva. Detalje o tome što jamstvo pokriva pronađite na stranici Jamstvo.",
  },
  {
    q: "Dostavljate li diljem Hrvatske?",
    a: `Da, dostavljamo na cijelom području Hrvatske. Za narudžbe od ${formatEUR(FREE_SHIPPING_FROM)} dostava je besplatna, ispod toga iznosi ${formatEUR(SHIPPING_FEE)}.`,
  },
  {
    q: "Instalirate li operativni sustav?",
    a: "Operativni sustav nije uključen u cijenu, osim ako uz računalo kupite licencu — tada ga instaliramo i aktiviramo prije slanja. Bez kupljene licence računalo stiže bez operativnog sustava. Testiramo ga u svakom slučaju.",
  },
  {
    q: "Što ako se pojavi kvar nakon isporuke?",
    a: "Javite nam se putem stranice Kontakt uz opis problema i broj narudžbe — u sklopu jamstva rješavamo popravak ili zamjenu neispravne komponente.",
  },
];

export const FAQ_JSON_LD = {
  "@context": "https://schema.org",
  "@type": "FAQPage",
  mainEntity: FAQ_SCHEMA_ITEMS.map(({ q, a }) => ({
    "@type": "Question",
    name: q,
    acceptedAnswer: { "@type": "Answer", text: a },
  })),
};

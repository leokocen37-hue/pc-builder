# Zadatak: sekcija o jednostranom raskidu u Uvjetima — racunalo.hr

## Kontekst za Claude Code

Projekt je headless Next.js (App Router) storefront na Vercelu, Shopify kao backend.
Treba dodati/ažurirati stranicu s Uvjetima i povezati je s nekoliko mjesta u toku kupnje.

Prije pisanja koda: pronađi postoji li već stranica s uvjetima (`/uvjeti`, `/uvjeti-koristenja`,
`/pravila`, `policies`, ili slično) i postojeći footer. Ako postoji — nadopuni je, ne prepisuj.

Sav tekst ispod je hrvatski i ide u aplikaciju **doslovno**. Ne prevoditi, ne parafrazirati,
ne skraćivati. Placeholdere u uglatim zagradama zamijeni stvarnim podacima tvrtke.

---

## 1. Tekst za stranicu Uvjeta

### Pravo na jednostrani raskid ugovora

Potrošač ima pravo, ne navodeći razloge, jednostrano raskinuti ugovor sklopljen na daljinu
u roku od 14 dana.

Rok počinje teći od dana kada je potrošaču ili trećoj osobi koju je potrošač odredio, a koja
nije prijevoznik, roba koja je predmet ugovora predana u posjed. Ako je jednom narudžbom
naručeno više komada robe koji se isporučuju odvojeno, rok počinje teći od dana predaje
posljednjeg komada.

Da bi ostvario pravo na jednostrani raskid, potrošač nas mora prije isteka roka obavijestiti
o svojoj odluci nedvosmislenom izjavom poslanom poštom ili elektroničkom poštom, u kojoj
navodi svoje ime i prezime, adresu, broj telefona i adresu elektroničke pošte. Potrošač se
može koristiti i priloženim obrascem za jednostrani raskid ugovora.

[NAZIV TVRTKE] d.o.o.
[ADRESA SJEDIŠTA]
E-pošta: [E-MAIL ZA REKLAMACIJE]

Potvrdu o primitku obavijesti o jednostranom raskidu dostavit ćemo bez odgode elektroničkom
poštom.

### Iznimke od prava na jednostrani raskid

Sukladno Zakonu o zaštiti potrošača, potrošač nema pravo na jednostrani raskid ugovora ako
je predmet ugovora roba koja je izrađena po specifikaciji potrošača ili koja je jasno
prilagođena potrošaču.

Ta se iznimka primjenjuje na računala koja sastavljamo prema konfiguraciji koju je potrošač
sam odabrao u konfiguratoru na ovim internetskim stranicama. Takva računala ne držimo na
zalihi — komponente nabavljamo i računalo sastavljamo isključivo nakon narudžbe i prema
specifikaciji koju je odredio pojedini potrošač.

Ista se iznimka primjenjuje i na računala predstavljena u kategoriji „Gotova računala". Ta
računala nisu skladišna roba i ne držimo ih na zalihi. Riječ je o preporučenim konfiguracijama
— provjerenim kombinacijama komponenti koje smo složili u vlastitom konfiguratoru i nudimo ih
potrošaču kao preporuku. Kada potrošač odabere jednu od tih konfiguracija, komponente
naručujemo od dobavljača i računalo sastavljamo isključivo nakon te narudžbe i prema toj
konfiguraciji, jednako kao i kod konfiguracije koju potrošač sam složi u konfiguratoru.
Odabirom preporučene konfiguracije potrošač je odredio specifikaciju prema kojoj se roba
izrađuje.

Prije dovršetka narudžbe za bilo koje računalo iz prethodna dva stavka potrošača izričito
upozoravamo da za tu robu ne postoji pravo na jednostrani raskid i tražimo njegovu potvrdu
da je s time upoznat.

Na svu ostalu robu koja se prodaje na ovim stranicama — periferiju, komponente, opremu i
pribor — pravo na jednostrani raskid u roku od 14 dana primjenjuje se u cijelosti.

### Umanjena vrijednost robe

Potrošač je odgovoran za svako umanjenje vrijednosti robe koje je rezultat rukovanja robom,
osim onog koje je bilo potrebno za utvrđivanje prirode, obilježja i funkcionalnosti robe.

Kod računalne opreme to znači da potrošač smije robu pregledati i isprobati u opsegu u kojem
bi to bilo uobičajeno u prodavaonici. Puštanje u trajni rad, instalacija i aktivacija
operativnog sustava ili druge licencirane programske podrške, uklanjanje ili oštećenje
zaštitnih naljepnica i plombi proizvođača, uklanjanje serijskih oznaka te vidljivi tragovi
korištenja prelaze taj opseg i predstavljaju umanjenje vrijednosti robe.

Iznos umanjenja vrijednosti utvrđujemo za svaki slučaj pojedinačno, obrazlažemo ga pisano i
odbijamo od iznosa koji vraćamo potrošaču. Licenca operativnog sustava koja je aktivacijom
trajno vezana uz uređaj ne može se ponovno staviti u prodaju te se njezina vrijednost odbija
od iznosa povrata.

### Troškovi povrata robe

Izravne troškove povrata robe snosi potrošač.

### Povrat plaćenog iznosa

Vraćamo sve što je plaćeno, uključujući troškove isporuke, bez odgode, a najkasnije u roku od
14 dana od dana primitka obavijesti o jednostranom raskidu ugovora.

Ako je potrošač odabrao vrstu isporuke koja nije najjeftinija standardna isporuka koju nudimo,
vraćamo mu trošak isporuke u visini najjeftinije standardne isporuke.

Povrat izvršavamo istim sredstvom plaćanja kojim se potrošač koristio prilikom plaćanja, osim
ako potrošač izričito ne pristane na drugo sredstvo plaćanja i pod uvjetom da ne snosi
nikakve dodatne troškove.

Povrat novca možemo zadržati dok nam roba ne bude vraćena ili dok nam potrošač ne dostavi
dokaz da je robu poslao natrag, ovisno o tome što nastupi prije.

Robu je potrebno vratiti bez odgode, a najkasnije u roku od 14 dana od dana kada nas je
potrošač obavijestio o jednostranom raskidu ugovora.

---

## 2. Obrazac za jednostrani raskid

Napravi kao zasebnu stranicu (`/uvjeti/obrazac-za-jednostrani-raskid`) i kao PDF za preuzimanje.
Link na obrazac mora stajati unutar sekcije o raskidu i u footeru.

Sadržaj obrasca:

    OBRAZAC ZA JEDNOSTRANI RASKID UGOVORA

    Prima: [NAZIV TVRTKE] d.o.o., [ADRESA], e-pošta: [E-MAIL]

    Ja ______________________________ ovime izjavljujem da jednostrano raskidam
    ugovor o kupnji sljedeće robe / usluge:

    _____________________________________________________________________

    Broj narudžbe: ______________________
    Datum narudžbe: _____________________
    Datum primitka robe: ________________

    Ime i prezime potrošača: ____________________________________
    Adresa potrošača: ___________________________________________
    Broj telefona: ______________  E-pošta: _____________________

    Potpis potrošača (samo ako se obrazac ispunjava na papiru): __________________

    Datum: ______________

---

## 3. Gdje se sve mora prikazati

Obavijest o pravu na raskid mora biti dana **prije** sklapanja ugovora, ne samo u Uvjetima.
Napravi ovo:

**Footer** — link "Uvjeti kupnje" i link "Jednostrani raskid i povrat", vidljivi na svakoj
stranici.

**Stranica proizvoda (periferija i sve osim računala)** — kratka linija ispod gumba za košaricu:
„Pravo na povrat u roku od 14 dana" s linkom na Uvjete.

**Gotova računala — vidljiva obavijest, bez checkboxa.** Na svakoj stranici gotovog računala
prikaži ovaj tekst neposredno uz gumb za dodavanje u košaricu. Ne u sitnom tekstu, ne ispod
fold-a, ne unutar zatvorenog accordiona:

    Ovo računalo ne držimo na zalihi. Riječ je o preporučenoj konfiguraciji koju
    sastavljamo nakon vaše narudžbe, prema odabranim komponentama. Za takvu robu,
    sukladno Zakonu o zaštiti potrošača, ne postoji pravo na jednostrani raskid
    ugovora u roku od 14 dana.  [Više u Uvjetima →]

Zadnja rečenica je obavezna i ne smije se skratiti ni ublažiti. Obavijest mora navesti
posljedicu (nema prava na raskid), ne samo razlog (preporučena konfiguracija) — sam podatak
da je riječ o preporuci kupca ne informira o tome što gubi.

Istu obavijest ponovi u košarici uz svaku takvu stavku, u jednoj liniji.

**Konfigurator — obavijest i checkbox.** Prije nego što se konfiguracija može dodati u
košaricu, prikaži obavijest i checkbox koji korisnik mora označiti:

    ☐ Suglasan/na sam da se ovo računalo sastavlja prema mojoj specifikaciji i da za
      njega, sukladno Zakonu o zaštiti potrošača, ne postoji pravo na jednostrani
      raskid ugovora u roku od 14 dana.

Checkbox mora biti neoznačen po defaultu i obavezan za nastavak. Ovdje ostaje jer kupac ionako
prolazi kroz višekoračni proces pa jedan checkbox na kraju ne utječe na konverziju, a to je
slučaj u kojem je pozivanje na iznimku najizglednije.

**Zapis obavijesti na narudžbi — obavezno za obje skupine.** Teret dokaza da je obavijest dana
je na trgovcu, ne na kupcu. Kad se artikl doda u košaricu, spremi uz stavku Shopify line item
property s oznakom verzije teksta koji je tada bio prikazan, **bez ikakve interakcije kupca**:

    _raskid_obavijest: "gotova-racunala-2026-08"      // za gotova računala
    _raskid_obavijest: "konfigurator-2026-08"          // za konfigurator
    _raskid_suglasnost: "da"                           // samo konfigurator, iz checkboxa

Property s prefiksom `_` je skriven kupcu, ali ostaje vidljiv na narudžbi u Shopify adminu.
Uz to držite datirane verzije tog teksta u gitu, tako da se oznaka verzije na narudžbi može
povezati s točnim tekstom koji je bio objavljen na dan narudžbe. Time imate dokaz bez frikcije
na checkoutu.

---

## 4. Napomene za implementaciju

- Sekcija o raskidu neka bude vlastita komponenta / MDX blok da se može ažurirati bez diranja
  ostatka Uvjeta.
- Dodaj datum zadnje izmjene na dnu Uvjeta i verzioniraj ga.
- Sav tekst mora biti selektabilan i indeksabilan — bez slika teksta, bez PDF-a kao jedinog
  izvora.
- Provjeri da stranica Uvjeta ima `lang="hr"`.
- Ne stavljaj ovu sekciju iza accordiona koji je po defaultu zatvoren; obavijest o pravu na
  raskid mora biti čitljiva bez interakcije.

---

## 5. Otvoreno pitanje — pročitati prije predaje odvjetniku

Iznimka je u tekstu primijenjena na dvije skupine: računala konfigurirana u konfiguratoru i
računala iz kategorije „Gotova računala". Prva primjena je uobičajena. **Druga je sporna i
treba je svjesno potvrditi s odvjetnikom prije objave.**

Zašto je sporna: iznimka traži robu izrađenu po specifikaciji potrošača. Kod gotovih računala
kako su trenutno postavljena na stranici potrošač bira samo model iz kataloga — ne određuje
nijednu komponentu. Argument da je roba ipak izrađena po njegovoj specifikaciji oslanja se na
to da se računalo ne drži na zalihi nego sastavlja nakon narudžbe. Sud EU je u predmetu
Möbel Kraft (C-529/19) utvrdio da je za primjenu iznimke nebitno je li proizvodnja započela,
iz čega slijedi da sam trenutak sastavljanja nije odlučujući — odlučujuća je specifikacija
potrošača. Novija praksa ide u istom smjeru: OLG Brandenburg, 7 U 133/23 od 16. srpnja 2024.,
priznao je pravo na raskid kupcu konfiguriranog prijenosnika uz obrazloženje da je birao samo
između unaprijed zadanih standardnih opcija.

**Kako tu odredbu učiniti bitno jačom, bez mijenjanja teksta Uvjeta:** dodati stvaran izbor na
stranice gotovih računala. Dovoljno je nekoliko obaveznih opcija koje kupac mora odabrati
prije dodavanja u košaricu — memorija, kapacitet pohrane, operativni sustav, po mogućnosti i
kućište. Tada kupac stvarno određuje specifikaciju, a odredba prestaje biti tvrdnja i postaje
opis onoga što se doista dogodilo. Tekst Uvjeta iznad pokriva i taj scenarij bez ijedne
izmjene.

To je ujedno i bolji proizvod: podiže prosječnu vrijednost narudžbe i skida potrebu da se
isti model duplicira u više varijanti.

**Za odvjetnika:** članke Zakona o zaštiti potrošača uz svaku odredbu treba provjeriti i
navesti, kao i procijeniti nosi li primjena iznimke na konfigurirana računala rizik s obzirom
na noviju europsku sudsku praksu o konfiguriranim računalima (OLG Brandenburg 7 U 133/23 od
16. srpnja 2024. — pravo na raskid priznato kupcu konfiguriranog prijenosnika).

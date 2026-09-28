"use client";

import { useState } from "react";
import Link from "next/link";

type State = "idle" | "sending" | "sent" | "error";

/**
 * The withdrawal declaration, filled in and sent from the page.
 *
 * It replaces a PDF that had to be downloaded, printed, filled in by hand and
 * emailed back. The reason field is optional and says so: the right is
 * exercised without giving one, and a required box would be an obstacle to it.
 */
export default function RaskidForm() {
  const [form, setForm] = useState({
    ime: "",
    adresa: "",
    email: "",
    telefon: "",
    brojNarudzbe: "",
    datumPrimitka: "",
    roba: "",
    razlog: "",
    iban: "",
    potvrda: false,
  });
  const [honeypot, setHoneypot] = useState("");
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  const set = (k: keyof typeof form, v: string | boolean) => setForm((f) => ({ ...f, [k]: v }));

  const required = form.ime && form.adresa && form.email && form.brojNarudzbe && form.datumPrimitka && form.roba;

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!required || !form.potvrda) {
      setError("Ispunite sva obavezna polja i potvrdite izjavu.");
      setState("error");
      return;
    }
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/raskid", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, tvrtka: honeypot }),
      });
      const data = await res.json().catch(() => ({}));
      if (res.ok && data.ok) setState("sent");
      else {
        setError(data.error || "Slanje nije uspjelo.");
        setState("error");
      }
    } catch {
      setError("Slanje nije uspjelo. Provjerite vezu i pokušajte ponovno.");
      setState("error");
    }
  };

  if (state === "sent") {
    return (
      <div className="ras-done">
        <h2>Obavijest je zaprimljena</h2>
        <p>
          Potvrdu o primitku poslali smo na <strong>{form.email}</strong>. U njoj su svi podaci koje ste
          poslali i adresa na koju robu vraćate — sačuvajte je, ona je dokaz o danu kad ste raskid prijavili.
        </p>
        <p>
          Robu vratite najkasnije u roku od 14 dana od danas. Povrat plaćenog iznosa izvršit ćemo u roku od
          14 dana od primitka ove obavijesti, nakon što nam robu vratite ili dostavite dokaz o slanju.
        </p>
        <Link href="/raskid" className="rs-btn ghost">← Natrag na Pravo na jednostrani raskid</Link>
      </div>
    );
  }

  return (
    <form className="ras-form" onSubmit={submit} noValidate>
      <div className="ras-grid2">
        <label>
          <span>Ime i prezime *</span>
          <input value={form.ime} onChange={(e) => set("ime", e.target.value)} autoComplete="name" required />
        </label>
        <label>
          <span>E-pošta *</span>
          <input
            type="email"
            inputMode="email"
            autoComplete="email"
            value={form.email}
            onChange={(e) => set("email", e.target.value)}
            required
          />
        </label>
      </div>

      <label>
        <span>Adresa *</span>
        <input
          value={form.adresa}
          onChange={(e) => set("adresa", e.target.value)}
          autoComplete="street-address"
          placeholder="Ulica i broj, poštanski broj, mjesto"
          required
        />
      </label>

      <div className="ras-grid2">
        <label>
          <span>Telefon (nije obavezno)</span>
          <input type="tel" inputMode="tel" autoComplete="tel" value={form.telefon} onChange={(e) => set("telefon", e.target.value)} />
        </label>
        <label>
          <span>Broj narudžbe *</span>
          <input
            value={form.brojNarudzbe}
            onChange={(e) => set("brojNarudzbe", e.target.value)}
            placeholder="npr. #1004"
            required
          />
        </label>
      </div>

      <label>
        <span>Datum primitka robe *</span>
        <input type="date" value={form.datumPrimitka} onChange={(e) => set("datumPrimitka", e.target.value)} required />
        <small>Rok od 14 dana teče od dana kad ste robu primili.</small>
      </label>

      <label>
        <span>Roba na koju se raskid odnosi *</span>
        <textarea
          value={form.roba}
          onChange={(e) => set("roba", e.target.value)}
          rows={3}
          placeholder="Npr. Office Start I — cijela narudžba, ili samo tipkovnica iz narudžbe"
          required
        />
      </label>

      <label>
        <span>Razlog — nije obavezan</span>
        <textarea
          value={form.razlog}
          onChange={(e) => set("razlog", e.target.value)}
          rows={3}
          placeholder="Razlog ne morate navesti. Ako ga napišete, pomaže nam da budemo bolji."
        />
        <small>Zakon vam daje pravo na raskid bez navođenja razloga. Ovo polje slobodno ostavite prazno.</small>
      </label>

      <label>
        <span>IBAN za povrat (nije obavezno)</span>
        <input value={form.iban} onChange={(e) => set("iban", e.target.value)} placeholder="HR.." />
        <small>Povrat u pravilu vraćamo istim sredstvom kojim ste platili; IBAN nam treba samo ako to nije moguće.</small>
      </label>

      <label className="ras-check">
        <input type="checkbox" checked={form.potvrda} onChange={(e) => set("potvrda", e.target.checked)} required />
        <span>
          Izjavljujem da jednostrano raskidam ugovor o kupnji gore navedene robe i potvrđujem da su podaci
          točni. Upoznat/a sam s{" "}
          <Link href="/raskid#iznimke" target="_blank" rel="noopener">
            iznimkama od prava na jednostrani raskid
          </Link>
          .
        </span>
      </label>

      {/* bot bait — off-screen, out of the tab order and the a11y tree */}
      <input
        type="text"
        name="tvrtka"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        value={honeypot}
        onChange={(e) => setHoneypot(e.target.value)}
        style={{ position: "absolute", left: "-9999px", width: 1, height: 1, opacity: 0 }}
      />

      {state === "error" && <p className="ras-error">{error}</p>}

      <button type="submit" className="rs-btn" disabled={state === "sending"}>
        {state === "sending" ? "Šaljem…" : "Pošalji obavijest o raskidu"}
      </button>

      <p className="ras-legal">
        Vaše podatke koristimo isključivo za obradu ovog raskida i povrat plaćenog iznosa. Više u{" "}
        <Link href="/privatnost" target="_blank" rel="noopener">
          Politici privatnosti
        </Link>
        .
      </p>
    </form>
  );
}

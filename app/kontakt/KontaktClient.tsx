"use client";

import { useState } from "react";

type State = "idle" | "sending" | "sent" | "error";

export default function KontaktClient() {
  const [form, setForm] = useState({ name: "", email: "", phone: "", message: "" });
  const [state, setState] = useState<State>("idle");
  const [error, setError] = useState("");

  const set = (k: keyof typeof form) => (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
    setForm((f) => ({ ...f, [k]: e.target.value }));

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name || !form.email || !form.message) {
      setError("Molimo ispunite ime, e-mail i poruku.");
      setState("error");
      return;
    }
    setState("sending");
    setError("");
    try {
      const res = await fetch("/api/contact", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, pageUrl: "/kontakt" }),
      });
      if (!res.ok) {
        const d = await res.json().catch(() => ({}));
        throw new Error(d.error || "Slanje nije uspjelo.");
      }
      setState("sent");
      setForm({ name: "", email: "", phone: "", message: "" });
    } catch (err: any) {
      setError(err.message || "Došlo je do greške. Pokušajte ponovno.");
      setState("error");
    }
  };

  return (
    <div className="rs-root">
      <section className="kontakt-hero">
        <div className="rs-kicker">Kontakt</div>
        <h1>Javite nam se</h1>
        <p>Pitanje o konfiguraciji, narudžbi ili savjet pri odabiru? Tu smo — odgovaramo u najkraćem roku.</p>
      </section>

      <section className="kontakt-wrap">
        <div className="rs-wrap kontakt-grid">
          {/* form */}
          <div className="kontakt-card">
            {state === "sent" ? (
              <div className="kontakt-success">
                <div className="kontakt-check">✓</div>
                <h3>Poruka poslana!</h3>
                <p>Hvala na upitu. Javit ćemo vam se na e-mail u najkraćem mogućem roku.</p>
                <button className="rs-btn ghost" onClick={() => setState("idle")}>Pošalji novu poruku</button>
              </div>
            ) : (
              <form onSubmit={submit} noValidate>
                <div className="kontakt-field">
                  <label>Ime i prezime *</label>
                  <input value={form.name} onChange={set("name")} placeholder="Vaše ime" />
                </div>
                <div className="kontakt-row">
                  <div className="kontakt-field">
                    <label>E-mail *</label>
                    <input type="email" value={form.email} onChange={set("email")} placeholder="vas@email.com" />
                  </div>
                  <div className="kontakt-field">
                    <label>Telefon</label>
                    <input value={form.phone} onChange={set("phone")} placeholder="Nije obavezno" />
                  </div>
                </div>
                <div className="kontakt-field">
                  <label>Poruka *</label>
                  <textarea value={form.message} onChange={set("message")} rows={6} placeholder="Kako vam možemo pomoći?" />
                </div>

                {state === "error" && <div className="kontakt-error">{error}</div>}

                <button type="submit" className="rs-btn" disabled={state === "sending"} style={{ width: "100%", justifyContent: "center" }}>
                  {state === "sending" ? "Šaljem…" : "Pošalji poruku →"}
                </button>
              </form>
            )}
          </div>

          {/* info */}
          <aside className="kontakt-info">
            <div className="kontakt-info-block">
              <div className="kontakt-info-ic">✉</div>
              <div>
                <h4>E-mail</h4>
                <a href="mailto:info@racunalo.hr">info@racunalo.hr</a>
              </div>
            </div>
            <div className="kontakt-info-block">
              <div className="kontakt-info-ic">◷</div>
              <div>
                <h4>Radno vrijeme</h4>
                <p>Ponedjeljak – Petak<br />09:00 – 17:00</p>
              </div>
            </div>
            <div className="kontakt-info-block">
              <div className="kontakt-info-ic">⚙</div>
              <div>
                <h4>Trebate savjet?</h4>
                <p>Recite nam namjenu i proračun — složimo idealnu konfiguraciju za vas.</p>
              </div>
            </div>
            <div className="kontakt-note">
              Svako računalo sastavljamo i testiramo ručno u Hrvatskoj, uz 24 mjeseca jamstva.
            </div>
          </aside>
        </div>
      </section>
    </div>
  );
}

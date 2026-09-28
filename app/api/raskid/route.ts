import { NextResponse } from "next/server";
import { Resend } from "resend";
import { COMPANY, COMPANY_ADDRESS_FULL } from "@/lib/company";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

/**
 * The online withdrawal form.
 *
 * Art. 11(3) of the Consumer Rights Directive: a trader who offers the form on
 * its website must acknowledge receipt on a durable medium without delay. So
 * this sends two emails — one to us, one back to the buyer — and the buyer's
 * copy repeats everything they submitted, because that copy is their proof of
 * when they declared it.
 *
 * The reason is optional on purpose. The right is exercised "ne navodeći
 * razloge"; a required reason field would be an obstacle to it.
 */

const HONEYPOT_FIELD = "tvrtka";
const MAX_PER_WINDOW = 5;
const WINDOW_MS = 10 * 60 * 1000;

type Body = Record<string, unknown>;

const str = (v: unknown, max = 200) => (typeof v === "string" ? v.trim().slice(0, max) : "");

const escapeHtml = (s: string) =>
  s.replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" })[c]!);

const row = (label: string, value: string) =>
  value ? `<p style="margin:6px 0"><strong>${label}:</strong> ${escapeHtml(value).replace(/\n/g, "<br/>")}</p>` : "";

export async function POST(req: Request) {
  try {
    const data = (await req.json()) as Body;

    // a filled honeypot is a bot; answer 200 so it doesn't learn to clear it
    if (typeof data[HONEYPOT_FIELD] === "string" && (data[HONEYPOT_FIELD] as string).trim() !== "") {
      return NextResponse.json({ ok: true });
    }

    const limited = rateLimit(`raskid:${clientIp(req)}`, MAX_PER_WINDOW, WINDOW_MS);
    if (!limited.ok) {
      return tooManyRequests(limited.retryAfter, "Previše pokušaja. Pokušajte ponovno za nekoliko minuta.");
    }

    const ime = str(data.ime, 120);
    const adresa = str(data.adresa, 300);
    const email = str(data.email, 160);
    const telefon = str(data.telefon, 60);
    const brojNarudzbe = str(data.brojNarudzbe, 60);
    const datumPrimitka = str(data.datumPrimitka, 30);
    const roba = str(data.roba, 1000);
    const razlog = str(data.razlog, 2000); // optional, by law
    const iban = str(data.iban, 40);
    const potvrda = data.potvrda === true;

    if (!ime || !adresa || !email || !brojNarudzbe || !datumPrimitka || !roba || !potvrda) {
      return NextResponse.json({ ok: false, error: "Nedostaju obavezna polja." }, { status: 400 });
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(email)) {
      return NextResponse.json({ ok: false, error: "Neispravna e-mail adresa." }, { status: 400 });
    }

    // The moment of declaration is what the deadline is measured against, so it
    // is recorded here rather than taken from the browser's clock.
    const zaprimljeno = new Date();
    const stamp = zaprimljeno.toLocaleString("hr-HR", { timeZone: "Europe/Zagreb" });

    const details =
      row("Ime i prezime", ime) +
      row("Adresa", adresa) +
      row("E-pošta", email) +
      row("Telefon", telefon) +
      row("Broj narudžbe", brojNarudzbe) +
      row("Datum primitka robe", datumPrimitka) +
      row("Roba na koju se raskid odnosi", roba) +
      row("Razlog (nije obavezan)", razlog) +
      row("IBAN za povrat", iban) +
      row("Zaprimljeno", stamp);

    const resend = new Resend(process.env.RESEND_API_KEY);
    const from = "RAČUNALO.hr <info@racunalo.hr>";

    await resend.emails.send({
      from,
      to: process.env.CONTACT_TO || COMPANY.email,
      replyTo: email,
      subject: `Jednostrani raskid — narudžba ${brojNarudzbe} — ${ime}`,
      html: `<h2>Obavijest o jednostranom raskidu ugovora</h2>${details}`,
    });

    // the acknowledgement the law requires, on a durable medium
    await resend.emails.send({
      from,
      to: email,
      subject: `Potvrda o primitku obavijesti o raskidu — narudžba ${brojNarudzbe}`,
      html: `
        <h2>Zaprimili smo vašu obavijest o jednostranom raskidu</h2>
        <p>Poštovani/a ${escapeHtml(ime)}, potvrđujemo da smo ${escapeHtml(stamp)} zaprimili vašu obavijest
        o jednostranom raskidu ugovora. Ovo je potvrda o primitku.</p>
        <p>Robu vratite bez odgađanja, a najkasnije u roku od 14 dana od dana kad ste nam uputili ovu
        obavijest, na adresu:<br/><strong>${escapeHtml(COMPANY.name)}, ${escapeHtml(COMPANY_ADDRESS_FULL)}</strong></p>
        <p>Povrat plaćenog iznosa izvršit ćemo bez odgađanja, a najkasnije u roku od 14 dana od primitka
        obavijesti, nakon što nam roba bude vraćena ili nakon što nam dostavite dokaz o slanju.</p>
        <hr/>
        <h3>Podaci koje ste poslali</h3>
        ${details}
        <p style="color:#666;font-size:12px">Sačuvajte ovu poruku — ona je dokaz o danu kad ste raskid prijavili.</p>
      `,
    });

    return NextResponse.json({ ok: true, zaprimljeno: zaprimljeno.toISOString() });
  } catch (error) {
    console.error("raskid form failed", error);
    return NextResponse.json({ ok: false, error: "Slanje nije uspjelo." }, { status: 500 });
  }
}

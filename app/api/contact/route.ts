// Place this at:  app/api/contact/route.ts
//
// It receives the configurator contact form and emails it to you.
// Two ways to actually send the mail — pick ONE (Resend shown, SMTP commented).
//
// 1) Add an env var in .env.local:
//      CONTACT_TO=tvoj-email@racunalo.hr
//      RESEND_API_KEY=...           (if using Resend — https://resend.com, free tier)
// 2) npm install resend            (if using Resend)

import { NextResponse } from "next/server";
import { Resend } from "resend";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";

// A field no person sees and every naive bot fills in. Kept deliberately
// boring-looking ("tvrtka") so a scraper has no reason to skip it.
const HONEYPOT_FIELD = "tvrtka";
// Three messages in ten minutes is more than any real enquiry needs.
const MAX_PER_WINDOW = 3;
const WINDOW_MS = 10 * 60 * 1000;

export async function POST(req: Request) {
  try {
    const data = await req.json();
    const { name, email, phone, budget, message, currentBuild, buildTotal, pageUrl } = data || {};

    // A filled honeypot is a bot. Answer 200 rather than 400: a bot that is
    // told it failed will try again with the field cleared.
    if (typeof data?.[HONEYPOT_FIELD] === "string" && data[HONEYPOT_FIELD].trim() !== "") {
      return NextResponse.json({ ok: true });
    }

    const limited = rateLimit(`contact:${clientIp(req)}`, MAX_PER_WINDOW, WINDOW_MS);
    if (!limited.ok) {
      return tooManyRequests(
        limited.retryAfter,
        "Previše poruka u kratkom roku. Pokušajte ponovno za nekoliko minuta."
      );
    }

    // basic validation
    if (!name || !email || !message) {
      return NextResponse.json({ ok: false, error: "Nedostaju obavezna polja." }, { status: 400 });
    }

    const to = process.env.CONTACT_TO || "info@racunalo.hr";

    const html = `
      <h2>Novi upit iz konfiguratora</h2>
      <p><strong>Ime:</strong> ${escapeHtml(name)}</p>
      <p><strong>E-mail:</strong> ${escapeHtml(email)}</p>
      <p><strong>Telefon:</strong> ${escapeHtml(phone || "-")}</p>
      <p><strong>Proračun:</strong> ${escapeHtml(budget || "-")} €</p>
      <p><strong>Poruka:</strong><br/>${escapeHtml(message).replace(/\n/g, "<br/>")}</p>
      <hr/>
      <p><strong>Trenutna konfiguracija:</strong> ${escapeHtml(currentBuild || "-")}</p>
      <p><strong>Iznos:</strong> ${escapeHtml(buildTotal || "-")} €</p>
      <p><strong>Stranica:</strong> ${escapeHtml(pageUrl || "-")}</p>
    `;

    // --- Option A: Resend ---
    const resend = new Resend(process.env.RESEND_API_KEY);
    await resend.emails.send({
      from: "Računalo.hr <info@racunalo.hr>", // must be a verified sender/domain in Resend
      to,
      replyTo: email, // so you can reply straight to the customer
      subject: `Upit iz konfiguratora — ${name}`,
      html,
    });

    // --- Option B: SMTP via nodemailer (alternative) ---
    // import nodemailer from "nodemailer";
    // const transporter = nodemailer.createTransport({
    //   host: process.env.SMTP_HOST, port: 587, secure: false,
    //   auth: { user: process.env.SMTP_USER, pass: process.env.SMTP_PASS },
    // });
    // await transporter.sendMail({ from: process.env.SMTP_USER, to, replyTo: email,
    //   subject: `Upit iz konfiguratora — ${name}`, html });

    return NextResponse.json({ ok: true });
  } catch (err: any) {
    console.error("contact error", err);
    return NextResponse.json({ ok: false, error: "Server error" }, { status: 500 });
  }
}

function escapeHtml(s: string) {
  return String(s)
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;");
}
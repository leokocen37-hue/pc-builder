import type { Metadata } from "next";
import FaqClient from "./FaqClient";
import JsonLd from "@/components/JsonLd";
import { FAQ_JSON_LD } from "./faq-data";

const TITLE = "Često postavljana pitanja";
const DESCRIPTION = "Odgovori na najčešća pitanja o konfiguratoru, dostavi, plaćanju i jamstvu na RAČUNALO.hr.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/faq" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/faq" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function FaqPage() {
  return (
    <div className="rs-root">
      <section className="legal-hero">
        <div className="rs-kicker">Podrška</div>
        <h1>Često postavljana pitanja</h1>
        <p>Brzi odgovori na ono što nas kupci najčešće pitaju prije i poslije kupnje.</p>
      </section>

      <section className="legal-wrap">
        <div className="rs-wrap">
          {/* the questions and answers Google reads; the accordion below is
              the same content for people */}
          <JsonLd data={FAQ_JSON_LD} />
          <FaqClient />
        </div>
      </section>
    </div>
  );
}

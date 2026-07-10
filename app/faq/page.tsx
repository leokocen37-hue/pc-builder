import type { Metadata } from "next";
import FaqClient from "./FaqClient";

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
          <FaqClient />
        </div>
      </section>
    </div>
  );
}

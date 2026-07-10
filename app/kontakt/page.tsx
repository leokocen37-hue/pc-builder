import type { Metadata } from "next";
import KontaktClient from "./KontaktClient";

const TITLE = "Kontakt — Javite nam se";
const DESCRIPTION =
  "Imate pitanje o konfiguraciji, narudžbi ili trebate savjet pri odabiru komponenti? Kontaktirajte RAČUNALO.hr — odgovaramo u najkraćem roku.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/kontakt" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/kontakt" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function Page() {
  return <KontaktClient />;
}

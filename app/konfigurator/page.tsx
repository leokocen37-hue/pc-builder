// (this is exactly your current app/page.tsx — the configurator now lives at /konfigurator)
import type { Metadata } from "next";
import Builder from "@/components/Builder";

const TITLE = "Konfigurator računala — Sastavi PC po mjeri";
const DESCRIPTION =
  "Odaberi procesor, grafičku karticu, memoriju i sve ostale komponente uz automatsku provjeru kompatibilnosti, snage napajanja i pristajanja. Mi sklapamo, testiramo i šaljemo.";

export const metadata: Metadata = {
  title: TITLE,
  description: DESCRIPTION,
  alternates: { canonical: "/konfigurator" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/konfigurator" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default function ConfiguratorPage() {
  return <Builder />;
}

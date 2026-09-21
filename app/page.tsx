import type { Metadata } from "next";
import HomeClient from "./HomeClient";
import { getCollectionMinPrice, getCollectionProducts } from "@/lib/collections";

// no `title` here on purpose — the root layout's `default` title (which already
// includes the brand name) is used verbatim for "/", since Next's title template
// only applies to descendant routes, not the page that shares the layout's segment.
const TITLE = "RAČUNALO.hr — Custom PC po mjeri, konfigurator i gotova računala";
const DESCRIPTION =
  "Sastavi svoje računalo u online konfiguratoru uz provjeru kompatibilnosti u stvarnom vremenu, ili odaberi gotovu, ručno sastavljenu i testiranu konfiguraciju. Dostava diljem Hrvatske, 24 mjeseca jamstva.";

export const metadata: Metadata = {
  description: DESCRIPTION,
  alternates: { canonical: "/" },
  openGraph: { title: TITLE, description: DESCRIPTION, url: "/" },
  twitter: { title: TITLE, description: DESCRIPTION },
};

export default async function Page() {
  const [gaming, office, stanice, gamingFrom, officeFrom, staniceFrom] = await Promise.all([
    getCollectionProducts(["gaming"], 6),
    getCollectionProducts(["office"], 6),
    getCollectionProducts(["radne-stanice"], 6),
    getCollectionMinPrice("gaming"),
    getCollectionMinPrice("office"),
    getCollectionMinPrice("radne-stanice"),
  ]);
  return (
    <HomeClient
      gaming={gaming}
      office={office}
      stanice={stanice}
      gamingFrom={gamingFrom}
      officeFrom={officeFrom}
      staniceFrom={staniceFrom}
    />
  );
}

// (this is exactly your current app/page.tsx — the configurator now lives at /konfigurator)
import type { Metadata } from "next";
import Builder from "@/components/Builder";
import { getBuilderProducts } from "@/lib/builder-products";

const TITLE = "Konfigurator računala — Sastavi PC po mjeri";
const DESCRIPTION =
  "Odaberi procesor, grafičku karticu, memoriju i sve ostale komponente uz automatsku provjeru kompatibilnosti, snage napajanja i pristajanja. Mi sklapamo, testiramo i šaljemo.";

type Props = { searchParams: Promise<{ b?: string }> };

// a shared build link (?b=<encoded>) gets its own OG image (CPU/GPU/RAM +
// total) generated at /api/og, so it previews as a card instead of the
// generic configurator screenshot — see app/api/og/route.tsx
export async function generateMetadata({ searchParams }: Props): Promise<Metadata> {
  const { b } = await searchParams;
  const base: Metadata = {
    title: TITLE,
    description: DESCRIPTION,
    alternates: { canonical: "/konfigurator" },
    openGraph: { title: TITLE, description: DESCRIPTION, url: "/konfigurator" },
    twitter: { title: TITLE, description: DESCRIPTION },
  };
  if (!b) return base;

  const ogUrl = `/api/og?b=${encodeURIComponent(b)}`;
  return {
    ...base,
    openGraph: { ...base.openGraph, images: [{ url: ogUrl, width: 1200, height: 630 }] },
    twitter: { ...base.twitter, card: "summary_large_image", images: [ogUrl] },
  };
}

export default async function ConfiguratorPage() {
  const products = await getBuilderProducts();
  return <Builder products={products} />;
}

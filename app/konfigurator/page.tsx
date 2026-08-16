// (this is exactly your current app/page.tsx — the configurator now lives at /konfigurator)
import type { Metadata } from "next";
import Builder, { ProductNode } from "@/components/Builder";
import { shopifyFetch } from "@/lib/shopify";

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

// identical to Builder.tsx's old client-side query — moved here so the
// component catalog is fetched once, server-side, instead of on every visit.
const PRODUCTS_QUERY = `
  query {
    products(first: 250) {
      edges {
        node {
          id
          title
          tags
          featuredImage { url altText }
          variants(first: 50) {
            edges {
              node {
                id
                title
                price { amount }
                image { url altText }
              }
            }
          }
          pcfType: metafield(namespace: "pcf", key: "type") { value }
          pcfBrand: metafield(namespace: "pcf", key: "brand") { value }
          pcfSocket: metafield(namespace: "pcf", key: "socket") { value }
          pcfTdp: metafield(namespace: "pcf", key: "tdp") { value }
          pcfRamType: metafield(namespace: "pcf", key: "ram_type") { value }
          pcfFormFactor: metafield(namespace: "pcf", key: "form_factor") { value }
          pcfSupportedFormFactors: metafield(namespace: "pcf", key: "supported_form_factors") { value }
          pcfGpuLength: metafield(namespace: "pcf", key: "gpu_length") { value }
          pcfMaxGpuLength: metafield(namespace: "pcf", key: "max_gpu_length") { value }
          pcfCoolerHeight: metafield(namespace: "pcf", key: "cooler_height") { value }
          pcfMaxCoolerHeight: metafield(namespace: "pcf", key: "max_cooler_height") { value }
          pcfRadiatorSize: metafield(namespace: "pcf", key: "radiator_size") { value }
          pcfSupportedRadiators: metafield(namespace: "pcf", key: "supported_radiators") { value }
          pcfWattage: metafield(namespace: "pcf", key: "wattage") { value }
          pcfQuality: metafield(namespace: "pcf", key: "quality") { value }
          pcfBadge: metafield(namespace: "pcf", key: "badge") { value }
          pcfBadgeColor: metafield(namespace: "pcf", key: "badge_color") { value }
          pcfRecommended: metafield(namespace: "pcf", key: "recommended") { value }
          pcfSpecs: metafield(namespace: "pcf", key: "specs") { value }
        }
      }
    }
  }
`;
type ProductsResp = { products: { edges: { node: ProductNode }[] } };

async function getComponents(): Promise<ProductNode[]> {
  const data = await shopifyFetch<ProductsResp>(PRODUCTS_QUERY, {});
  return data?.products?.edges.map((e) => e.node) ?? [];
}

export default async function ConfiguratorPage() {
  const products = await getComponents();
  return <Builder products={products} />;
}

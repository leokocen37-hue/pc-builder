// Shared component catalog fetch for the configurator — used by the
// /konfigurator page itself and by the shared-build OG image route, so both
// see the same products without duplicating the query.
import { shopifyFetch } from "@/lib/shopify";
import type { ProductNode } from "@/components/Builder";

const PRODUCTS_QUERY = `
  query {
    products(first: 250) {
      edges {
        node {
          id
          handle
          title
          tags
          availableForSale
          featuredImage { url altText }
          variants(first: 50) {
            edges {
              node {
                id
                title
                availableForSale
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
          pcfRecommended: metafield(namespace: "pcf", key: "recommended") { value }
          pcfPick: metafield(namespace: "pcf", key: "pick") { value }
          pcfSpecs: metafield(namespace: "pcf", key: "specs") { value }
        }
      }
    }
  }
`;
type ProductsResp = { products: { edges: { node: ProductNode }[] } };

export async function getBuilderProducts(): Promise<ProductNode[]> {
  const data = await shopifyFetch<ProductsResp>(PRODUCTS_QUERY, {});
  return data?.products?.edges.map((e) => e.node) ?? [];
}

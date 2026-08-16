// Legacy compatibility shim for the old flat product URLs (every product used
// to live at /[handle], before the /racunala and /periferija nesting). Looks
// the handle up in Shopify at request time and 301s to wherever it lives now
// — no static list to keep in sync, so it can't drift as products are added,
// removed, or recategorized in Shopify.
import { notFound, permanentRedirect } from "next/navigation";
import { getProductByHandle, SECTIONS } from "@/lib/product-page";

export default async function LegacyProductHandle({ params }: { params: Promise<{ handle: string }> }) {
  const { handle } = await params;
  const product = await getProductByHandle(handle);
  if (!product) notFound();

  const productCollections = product.collections.edges.map((e) => e.node.handle);
  for (const section of Object.values(SECTIONS)) {
    for (const kategorija of Object.keys(section.categories)) {
      if (productCollections.includes(kategorija)) {
        permanentRedirect(`${section.base}/${kategorija}/${handle}`);
      }
    }
  }

  // a real Shopify product, but not one that ever had its own listing page
  // (a bare configurator component, e.g. a CPU or GPU sold as a build part)
  // — send it to the tool it's actually used in instead of a dead end.
  permanentRedirect("/konfigurator");
}

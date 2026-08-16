// Dynamic OG image for shared configurator links (/konfigurator?b=<encoded>),
// referenced from generateMetadata in app/konfigurator/page.tsx. A plain
// app/konfigurator/opengraph-image.tsx can't read the ?b= search param, so
// this lives as its own route instead, taking ?b= directly.
import { ImageResponse } from "next/og";
import { getBuilderProducts } from "@/lib/builder-products";
import { decodeBuild, BUILD_PART_KEYS, type BuildPartKey, type EncodedBuild } from "@/lib/build-share";
import { ASSEMBLY_FEE } from "@/lib/pricing";
import type { ProductNode } from "@/components/Builder";

export const runtime = "nodejs";

function resolvePart(products: ProductNode[], key: BuildPartKey, decodedParts: EncodedBuild["parts"]) {
  const enc = decodedParts[key];
  if (!enc) return null;
  const [handle, variantTitle] = enc;
  const found = products.find((p) => p.handle === handle);
  if (!found) return null;
  const varNode =
    (variantTitle && found.variants.edges.find((v) => v.node.title === variantTitle)?.node) ||
    found.variants.edges[0]?.node;
  return { product: found, price: Number(varNode?.price.amount || 0) };
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const encoded = searchParams.get("b");
  const decoded = encoded ? decodeBuild(encoded) : null;

  let cpuTitle = "Procesor po izboru";
  let gpuTitle = "Grafička po izboru";
  let ramTitle = "Memorija po izboru";
  let total = 0;

  if (decoded) {
    const products = await getBuilderProducts();
    let sum = 0;
    for (const key of BUILD_PART_KEYS) {
      const resolved = resolvePart(products, key, decoded.parts);
      if (!resolved) continue;
      sum += resolved.price;
      if (key === "cpu") cpuTitle = resolved.product.title;
      if (key === "gpu") gpuTitle = resolved.product.title;
      if (key === "ram") ramTitle = resolved.product.title;
    }
    total = sum > 0 ? sum + ASSEMBLY_FEE : 0;
  }

  const priceLabel = total > 0 ? `€${total.toFixed(2)}` : "Konfiguracija u tijeku";

  return new ImageResponse(
    (
      <div
        style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          justifyContent: "space-between",
          padding: "64px",
          backgroundColor: "#07080c",
          backgroundImage: "radial-gradient(1100px 560px at 78% -10%, rgba(216,31,216,.28), transparent 60%)",
          color: "#f3f4f8",
          fontFamily: "sans-serif",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div style={{ width: "14px", height: "14px", borderRadius: "4px", background: "#d81fd8" }} />
          <div style={{ fontSize: "26px", fontWeight: 700, letterSpacing: "1px" }}>RAČUNALO.hr</div>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: "22px" }}>
          <div style={{ fontSize: "22px", color: "#888da3", letterSpacing: "2px" }}>MOJA KONFIGURACIJA</div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            <div style={{ display: "flex", fontSize: "34px", fontWeight: 600 }}>
              <span style={{ color: "#888da3", width: "180px" }}>CPU</span>
              <span>{cpuTitle}</span>
            </div>
            <div style={{ display: "flex", fontSize: "34px", fontWeight: 600 }}>
              <span style={{ color: "#888da3", width: "180px" }}>GPU</span>
              <span>{gpuTitle}</span>
            </div>
            <div style={{ display: "flex", fontSize: "34px", fontWeight: 600 }}>
              <span style={{ color: "#888da3", width: "180px" }}>RAM</span>
              <span>{ramTitle}</span>
            </div>
          </div>
        </div>

        <div style={{ display: "flex", alignItems: "baseline", gap: "16px" }}>
          <div style={{ fontSize: "56px", fontWeight: 700, letterSpacing: "-1px" }}>{priceLabel}</div>
          <div style={{ fontSize: "22px", color: "#888da3" }}>racunalo.hr/konfigurator</div>
        </div>
      </div>
    ),
    { width: 1200, height: 630 }
  );
}

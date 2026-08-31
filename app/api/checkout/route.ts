// → replace app/api/checkout/route.ts with this
import { NextResponse } from "next/server";
import { shopifyFetch } from "@/lib/shopify";
import { ASSEMBLY_FEE } from "@/lib/pricing";

type InItem =
  | { kind: "custom"; title?: string; summary?: string; quantity?: number; variantIds?: string[]; raskidObavijest?: string; raskidSuglasnost?: "da" }
  | { kind: "product"; variantId: string; quantity?: number; raskidObavijest?: string };

type VariantPriceNode = { id: string; price: { amount: string } } | null;

type DraftOrderLineItem =
  | { title: string; originalUnitPrice: string; quantity: number; customAttributes: { key: string; value: string }[]; requiresShipping: boolean }
  | { variantId: string; quantity: number; customAttributes?: { key: string; value: string }[] };

// uvjeti-jednostrani-raskid-spec.md section 3: the burden of proof that the
// withdrawal-right notice was shown is on the seller, not the buyer. Record
// which dated version of the notice text was displayed (and, for configurator
// items, the buyer's checkbox consent) as a `_`-prefixed line item property —
// hidden from the buyer, visible on the order in the Shopify admin.
function raskidAttributes(raskidObavijest?: string, raskidSuglasnost?: "da"): { key: string; value: string }[] {
  const attrs: { key: string; value: string }[] = [];
  if (raskidObavijest) attrs.push({ key: "_raskid_obavijest", value: raskidObavijest });
  if (raskidSuglasnost) attrs.push({ key: "_raskid_suglasnost", value: raskidSuglasnost });
  return attrs;
}

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Unknown error");

// Re-derive the price of a custom build from real, current Shopify variant prices
// + the fixed assembly fee — NEVER from client input. Without this, a POST with a
// hand-picked price could buy a full build for whatever the caller chose to send.
async function priceCustomBuild(variantIds: string[]): Promise<number> {
  if (!variantIds.length) {
    throw new Error("Konfiguracija nema odabranih komponenti.");
  }

  // must be live — this is the source of truth for what the customer gets charged
  const data = await shopifyFetch<{ nodes: VariantPriceNode[] }>(
    `query VariantPrices($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on ProductVariant { id price { amount } }
      }
    }`,
    { ids: variantIds },
    { cache: "no-store" }
  );

  const priceById = new Map<string, number>();
  for (const node of data.nodes) {
    if (node) priceById.set(node.id, Number(node.price.amount));
  }

  let total = ASSEMBLY_FEE;
  for (const id of variantIds) {
    const price = priceById.get(id);
    if (price === undefined) {
      throw new Error("Jedna od komponenti u konfiguraciji više nije dostupna.");
    }
    total += price;
  }
  return total;
}

export async function POST(request: Request) {
  try {
    const body = await request.json();

    if (!Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json({ error: "Košarica je prazna" }, { status: 400 });
    }

    // Build the draft-order line items.
    // - custom  → price re-derived server-side from real component prices + assembly fee
    // - product → real Shopify variant, priced by Shopify (keyboard, monitor, prebuilt…)
    const lineItems: DraftOrderLineItem[] = [];
    for (const it of body.items as InItem[]) {
      if (it.kind === "custom") {
        let price: number;
        try {
          price = await priceCustomBuild(it.variantIds || []);
        } catch (e) {
          return NextResponse.json({ error: errorMessage(e) || "Neispravna konfiguracija" }, { status: 400 });
        }
        lineItems.push({
          title: it.title || "Custom PC Konfiguracija",
          originalUnitPrice: price.toFixed(2),
          quantity: it.quantity || 1,
          customAttributes: [
            { key: "Komponente", value: it.summary || "" },
            ...raskidAttributes(it.raskidObavijest, it.raskidSuglasnost),
          ],
          // custom (non-variant) draft order lines default to non-shippable —
          // without this, a cart with ONLY a custom build skips the shipping
          // step entirely at checkout (a real product line masks this, since
          // those default to shippable, which is why it "worked" alongside one).
          requiresShipping: true,
        });
      } else {
        const attrs = raskidAttributes(it.raskidObavijest);
        lineItems.push({ variantId: it.variantId, quantity: it.quantity || 1, ...(attrs.length ? { customAttributes: attrs } : {}) });
      }
    }

    // this route is server-only, so it can use the non-public domain var directly —
    // falls back to the NEXT_PUBLIC_ one only until that's set in Vercel
    const shopifyDomain = process.env.SHOPIFY_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN;

    // 1. temporary Admin access token (client credentials)
    const authResponse = await fetch(
      `https://${shopifyDomain}/admin/oauth/access_token`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client_id: process.env.SHOPIFY_CLIENT_ID,
          client_secret: process.env.SHOPIFY_CLIENT_SECRET,
          grant_type: "client_credentials",
        }),
      }
    );
    const authData = await authResponse.json();
    const accessToken = authData.access_token;
    if (!accessToken) {
      return NextResponse.json({ error: "Auth failed: Check Client ID/Secret" }, { status: 401 });
    }

    // 2. create the draft order with ALL lines
    const query = `
      mutation draftOrderCreate($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder { invoiceUrl }
          userErrors { message }
        }
      }
    `;
    const response = await fetch(
      `https://${shopifyDomain}/admin/api/2024-10/graphql.json`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": accessToken },
        body: JSON.stringify({
          query,
          variables: { input: { note: "Web narudžba (konfigurator + trgovina)", lineItems } },
        }),
      }
    );
    const result = await response.json();
    const out = result.data?.draftOrderCreate;
    if (out?.userErrors?.length) {
      return NextResponse.json({ error: out.userErrors[0].message, userErrors: out.userErrors }, { status: 400 });
    }
    return NextResponse.json(out || { error: "Draft order failed" });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

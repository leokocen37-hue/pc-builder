// → replace app/api/checkout/route.ts with this
import { NextResponse } from "next/server";
import { shopifyFetch } from "@/lib/shopify";
import { adminAccessToken, adminGraphql } from "@/lib/shopify-admin";
import { ASSEMBLY_FEE } from "@/lib/pricing";

type InItem =
  | { kind: "custom"; title?: string; summary?: string; quantity?: number; variantIds?: string[] }
  | { kind: "product"; variantId: string; quantity?: number };

// What the cart reports about the acceptance the buyer gave before checkout
// could be started. Acceptance is per order, not per line, so it is recorded
// once at order level.
type InTerms = { prihvat?: string; verzija?: string; vrijeme?: string };

// A random token the cart makes up per checkout and keeps alongside the draft
// order id. It rides along as a hidden attribute so /api/checkout/status can
// tell "the buyer who started this order" from "someone guessing ids".
const CART_TOKEN_RE = /^[a-z0-9]{16,64}$/i;

type VariantPriceNode = { id: string; price: { amount: string } } | null;

type DraftOrderLineItem =
  | { title: string; originalUnitPrice: string; quantity: number; customAttributes: { key: string; value: string }[]; requiresShipping: boolean }
  | { variantId: string; quantity: number; customAttributes?: { key: string; value: string }[] };

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

    // The checkbox is the only way to reach this endpoint from the UI, but the
    // endpoint itself is public — refuse an order that arrives without the
    // acceptance that is supposed to be recorded on it, rather than booking one
    // with no evidence the terms were ever shown.
    const cartToken: string | null =
      typeof body.kosaricaToken === "string" && CART_TOKEN_RE.test(body.kosaricaToken) ? body.kosaricaToken : null;

    const uvjeti: InTerms = body.uvjeti ?? {};
    if (uvjeti.prihvat !== "da") {
      return NextResponse.json({ error: "Uvjeti poslovanja nisu prihvaćeni." }, { status: 400 });
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
          customAttributes: [{ key: "Komponente", value: it.summary || "" }],
          // custom (non-variant) draft order lines default to non-shippable —
          // without this, a cart with ONLY a custom build skips the shipping
          // step entirely at checkout (a real product line masks this, since
          // those default to shippable, which is why it "worked" alongside one).
          requiresShipping: true,
        });
      } else {
        lineItems.push({ variantId: it.variantId, quantity: it.quantity || 1 });
      }
    }

    // 1. temporary Admin access token (client credentials)
    const accessToken = await adminAccessToken();
    if (!accessToken) {
      return NextResponse.json({ error: "Auth failed: Check Client ID/Secret" }, { status: 401 });
    }

    // 2. create the draft order with ALL lines
    const query = `
      mutation draftOrderCreate($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder { id invoiceUrl }
          userErrors { message }
        }
      }
    `;
    const result = await adminGraphql<{
      data?: { draftOrderCreate?: { draftOrder?: { id: string; invoiceUrl: string }; userErrors?: { message: string }[] } };
    }>(accessToken, query, {
      input: {
        note: "Web narudžba (konfigurator + trgovina)",
        lineItems,
        // What the buyer accepted, recorded on the order itself: the acceptance,
        // which dated version of the three documents was in force, and when the
        // box was ticked. `_`-prefixed, so it shows on the order in the admin
        // but not to the buyer. The cart token rides along the same way — see
        // /api/checkout/status.
        customAttributes: [
          { key: "_uvjeti_prihvat", value: "da" },
          { key: "_uvjeti_verzija", value: uvjeti.verzija || "" },
          { key: "_uvjeti_vrijeme", value: uvjeti.vrijeme || "" },
          ...(cartToken ? [{ key: "_kosarica_token", value: cartToken }] : []),
        ],
      },
    });
    const out = result.data?.draftOrderCreate;
    if (out?.userErrors?.length) {
      return NextResponse.json({ error: out.userErrors[0].message, userErrors: out.userErrors }, { status: 400 });
    }
    return NextResponse.json(out || { error: "Draft order failed" });
  } catch (error) {
    return NextResponse.json({ error: errorMessage(error) }, { status: 500 });
  }
}

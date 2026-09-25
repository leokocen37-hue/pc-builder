// → replace app/api/checkout/route.ts with this
import { NextResponse } from "next/server";
import { shopifyFetch } from "@/lib/shopify";
import { SUMMARY_SEP } from "@/lib/cart-summary";
import { clientIp, rateLimit, tooManyRequests } from "@/lib/rate-limit";
import { adminAccessToken, adminGraphql } from "@/lib/shopify-admin";
import { ASSEMBLY_FEE, ASSEMBLY_FEE_LABEL, ASSEMBLY_FEE_NOTE } from "@/lib/pricing";

type InItem =
  // no summary: the component list on the order is rebuilt here from the
  // variant ids, so the browser has nothing to say about it
  | { kind: "custom"; title?: string; quantity?: number; variantIds?: string[] }
  | { kind: "product"; variantId: string; quantity?: number };

// What the cart reports about the acceptance the buyer gave before checkout
// could be started. Acceptance is per order, not per line, so it is recorded
// once at order level.
type InTerms = { prihvat?: string; verzija?: string; vrijeme?: string };

// A random token the cart makes up per checkout and keeps alongside the draft
// order id. It rides along as a hidden attribute so /api/checkout/status can
// tell "the buyer who started this order" from "someone guessing ids".
const CART_TOKEN_RE = /^[a-z0-9]{16,64}$/i;

// Creating a draft order costs an Admin call plus a round trip for pricing, so
// a loop hitting this would burn the API budget and fill the admin with junk.
// Ten a minute is far more than any real checkout needs.
const MAX_CHECKOUTS_PER_WINDOW = 10;
const CHECKOUT_WINDOW_MS = 60 * 1000;

// A Shopify variant GID and nothing else. These go straight into a GraphQL
// query, so anything that isn't one is refused before it gets there.
const VARIANT_GID_RE = /^gid:\/\/shopify\/ProductVariant\/\d+$/;
// One machine's worth of parts, with room to spare — a list of thousands would
// otherwise be priced one request at a time, happily.
const MAX_VARIANTS_PER_BUILD = 24;
const MAX_ITEMS = 20;

/**
 * Text the browser sends that Shopify then stores on the order.
 *
 * The component list is rebuilt server-side from the variant ids, so the only
 * thing taken from the client is the build's name: trimmed, length-capped and
 * stripped of anything that could be read as markup by whatever renders the
 * order later (the admin, a packing slip, an email).
 */
function cleanTitle(value: unknown, fallback: string, maxLength = 80): string {
  if (typeof value !== "string") return fallback;
  const cleaned = value
    .replace(/[<>]/g, "")
    .replace(/[\u0000-\u001f\u007f]/g, " ")
    .replace(/\s+/g, " ")
    .trim();
  return cleaned.slice(0, maxLength) || fallback;
}

type VariantPriceNode = {
  id: string;
  title: string;
  price: { amount: string };
  product?: { title: string } | null;
} | null;

type DraftOrderLineItem =
  | { title: string; originalUnitPrice: string; quantity: number; customAttributes: { key: string; value: string }[]; requiresShipping: boolean; taxable: boolean }
  | { variantId: string; quantity: number; customAttributes?: { key: string; value: string }[] };

const errorMessage = (e: unknown) => (e instanceof Error ? e.message : "Unknown error");

// Re-derive the price of a custom build from real, current Shopify variant
// prices — NEVER from client input. Without this, a POST with a hand-picked
// price could buy a full build for whatever the caller chose to send.
//
// Components only: the assembly fee rides on its own order line, so the buyer
// can see what it is instead of finding it folded into one opaque number.
async function priceCustomBuild(variantIds: string[]): Promise<{ total: number; summary: string }> {
  if (!variantIds.length) {
    throw new Error("Konfiguracija nema odabranih komponenti.");
  }
  if (variantIds.length > MAX_VARIANTS_PER_BUILD) {
    throw new Error("Konfiguracija ima previše komponenti.");
  }
  if (!variantIds.every((id) => typeof id === "string" && VARIANT_GID_RE.test(id))) {
    throw new Error("Neispravan identifikator komponente.");
  }

  // Must be live: this is the source of truth both for what the customer is
  // charged and for what the order says they bought. The titles come from here
  // too rather than from the request — the browser's copy is a display string,
  // and an order is not the place to discover the two disagree.
  const data = await shopifyFetch<{ nodes: VariantPriceNode[] }>(
    `query VariantPrices($ids: [ID!]!) {
      nodes(ids: $ids) {
        ... on ProductVariant {
          id
          title
          price { amount }
          product { title }
        }
      }
    }`,
    { ids: variantIds },
    { cache: "no-store" }
  );

  const byId = new Map<string, { price: number; label: string }>();
  for (const node of data.nodes) {
    if (!node) continue;
    const variantSuffix = node.title && node.title !== "Default Title" ? ` (${node.title})` : "";
    byId.set(node.id, {
      price: Number(node.price.amount),
      label: `${node.product?.title ?? "Komponenta"}${variantSuffix}`,
    });
  }

  let total = 0;
  const labels: string[] = [];
  for (const id of variantIds) {
    const node = byId.get(id);
    if (node === undefined) {
      throw new Error("Jedna od komponenti u konfiguraciji više nije dostupna.");
    }
    total += node.price;
    labels.push(node.label);
  }
  return { total, summary: labels.join(SUMMARY_SEP) };
}

export async function POST(request: Request) {
  try {
    const limited = rateLimit(`checkout:${clientIp(request)}`, MAX_CHECKOUTS_PER_WINDOW, CHECKOUT_WINDOW_MS);
    if (!limited.ok) {
      return tooManyRequests(limited.retryAfter, "Previše pokušaja. Pokušajte ponovno za koji trenutak.");
    }

    const body = await request.json();

    if (Array.isArray(body.items) && body.items.length > MAX_ITEMS) {
      return NextResponse.json({ error: "Košarica ima previše stavki." }, { status: 400 });
    }
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
        let built: { total: number; summary: string };
        try {
          built = await priceCustomBuild(it.variantIds || []);
        } catch (e) {
          return NextResponse.json({ error: errorMessage(e) || "Neispravna konfiguracija" }, { status: 400 });
        }
        const quantity = Math.min(Math.max(1, Math.floor(Number(it.quantity) || 1)), 10);
        lineItems.push({
          title: cleanTitle(it.title, "Custom PC Konfiguracija"),
          originalUnitPrice: built.total.toFixed(2),
          quantity,
          // rebuilt from the variant ids above, not copied from the request
          customAttributes: [{ key: "Komponente", value: built.summary }],
          // custom (non-variant) draft order lines inherit none of a real
          // product's defaults, so every flag has to be stated outright.
          //
          // Without requiresShipping, a cart holding ONLY a custom build skips
          // the shipping step entirely at checkout (a real product line masks
          // this, since those default to shippable — which is why it "worked"
          // alongside one).
          //
          // Without taxable, the line carries no VAT, and a configurator order
          // is a single custom line: the whole order comes out at 0,00 EUR tax
          // however the store's tax settings are configured.
          requiresShipping: true,
          taxable: true,
        });
        // One fee per build, on its own line and at the same quantity — an
        // order for two machines is two assemblies. Non-shippable: it is
        // labour on the machine already being shipped, and a second shippable
        // line would offer to send it separately.
        lineItems.push({
          title: ASSEMBLY_FEE_LABEL,
          originalUnitPrice: ASSEMBLY_FEE.toFixed(2),
          quantity,
          customAttributes: [{ key: "Uključuje", value: ASSEMBLY_FEE_NOTE }],
          requiresShipping: false,
          taxable: true,
        });
      } else {
        if (typeof it.variantId !== "string" || !VARIANT_GID_RE.test(it.variantId)) {
          return NextResponse.json({ error: "Neispravan identifikator proizvoda." }, { status: 400 });
        }
        lineItems.push({
          variantId: it.variantId,
          quantity: Math.min(Math.max(1, Math.floor(Number(it.quantity) || 1)), 20),
        });
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

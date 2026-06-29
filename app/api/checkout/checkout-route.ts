// → replace app/api/checkout/route.ts with this
import { NextResponse } from "next/server";

type InItem =
  | { kind: "custom"; title?: string; price: number; summary?: string; quantity?: number }
  | { kind: "product"; variantId: string; quantity?: number };

export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Build the draft-order line items.
    // - custom  → arbitrary title + price (the configurator build, assembly already included)
    // - product → real Shopify variant, priced by Shopify (keyboard, monitor, prebuilt…)
    let lineItems: any[];

    if (Array.isArray(body.items)) {
      lineItems = (body.items as InItem[]).map((it) =>
        it.kind === "custom"
          ? {
              title: it.title || "Custom PC Konfiguracija",
              originalUnitPrice: Number(it.price).toFixed(2),
              quantity: it.quantity || 1,
              customAttributes: [{ key: "Komponente", value: (it as any).summary || "" }],
            }
          : { variantId: it.variantId, quantity: it.quantity || 1 }
      );
    } else {
      // backward-compatible single custom build ({ totalPrice, summary })
      lineItems = [
        {
          title: "Custom PC Konfiguracija",
          originalUnitPrice: Number(body.totalPrice || 0).toFixed(2),
          quantity: 1,
          customAttributes: [{ key: "Komponente", value: body.summary || "" }],
        },
      ];
    }

    if (!lineItems.length) {
      return NextResponse.json({ error: "Košarica je prazna" }, { status: 400 });
    }

    // 1. temporary Admin access token (client credentials)
    const authResponse = await fetch(
      `https://${process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN}/admin/oauth/access_token`,
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
      `https://${process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN}/admin/api/2024-10/graphql.json`,
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
  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
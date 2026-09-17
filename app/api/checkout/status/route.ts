import { NextResponse } from "next/server";
import { adminAccessToken, adminGraphql } from "@/lib/shopify-admin";

// Answers one question for the cart: has the draft order the buyer was last
// sent to actually been paid?
//
// The cart is kept in localStorage, and leaving for Shopify's invoice page is
// a plain redirect — nothing on the way back tells the site an order went
// through, so without this the buyer returns to a cart still holding
// everything they just bought.
//
// The draft order id alone is not enough to ask with: ids are sequential, so
// anyone could walk them and learn which orders had been paid. The cart
// generates a random token at checkout, the draft order carries it as a
// hidden attribute, and only a caller holding that token gets an answer.

type StatusQuery = {
  data?: {
    draftOrder: {
      status: string;
      order: { id: string } | null;
      customAttributes: { key: string; value: string }[];
    } | null;
  };
};

export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const id = searchParams.get("id");
    const token = searchParams.get("token");
    if (!id || !token) {
      return NextResponse.json({ error: "Nedostaju parametri." }, { status: 400 });
    }

    const accessToken = await adminAccessToken();
    if (!accessToken) {
      return NextResponse.json({ error: "Auth failed: Check Client ID/Secret" }, { status: 401 });
    }

    const result = await adminGraphql<StatusQuery>(
      accessToken,
      `query draftOrderStatus($id: ID!) {
        draftOrder(id: $id) {
          status
          order { id }
          customAttributes { key value }
        }
      }`,
      { id }
    );

    const draft = result.data?.draftOrder;
    // deleted, or never existed — say nothing either way, and let the cart
    // fall back on its own expiry rather than guessing
    if (!draft) return NextResponse.json({ completed: false, unknown: true });

    const stored = draft.customAttributes?.find((a) => a.key === "_kosarica_token")?.value;
    if (!stored || stored !== token) {
      return NextResponse.json({ error: "Nepoznata narudžba." }, { status: 404 });
    }

    // a completed draft order has an order attached to it; status is checked
    // too so a completion Shopify reports before linking the order still counts
    return NextResponse.json({ completed: draft.status === "COMPLETED" || !!draft.order });
  } catch {
    return NextResponse.json({ error: "Greška pri provjeri narudžbe." }, { status: 500 });
  }
}

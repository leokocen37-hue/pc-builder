import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const { totalPrice, summary } = await request.json();

    // 1. GET A TEMPORARY ACCESS TOKEN
    const authResponse = await fetch(`https://${process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN}/admin/oauth/access_token`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        client_id: process.env.SHOPIFY_CLIENT_ID,
        client_secret: process.env.SHOPIFY_CLIENT_SECRET,
        grant_type: 'client_credentials',
      }),
    });

    const authData = await authResponse.json();
    const accessToken = authData.access_token;

    if (!accessToken) {
      return NextResponse.json({ error: "Auth failed: Check Client ID/Secret" }, { status: 401 });
    }

    // 2. CREATE THE DRAFT ORDER
    const query = `
      mutation draftOrderCreate($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder { invoiceUrl }
          userErrors { message }
        }
      }
    `;

    const response = await fetch(`https://${process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN}/admin/api/2024-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': accessToken,
      },
      body: JSON.stringify({
        query,
        variables: {
          input: {
            note: "Custom PC Build",
            lineItems: [{
              title: "Custom PC Konfiguracija",
              originalUnitPrice: totalPrice.toString(),
              quantity: 1,
              customAttributes: [{ key: "Komponente", value: summary }]
            }]
          }
        }
      }),
    });

    const result = await response.json();
    return NextResponse.json(result.data?.draftOrderCreate || { error: "Draft order failed" });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}
import { NextResponse } from 'next/server';

export async function POST(request: Request) {
  try {
    const body = await request.json();
    const { totalPrice, summary } = body;

    const query = `
      mutation draftOrderCreate($input: DraftOrderInput!) {
        draftOrderCreate(input: $input) {
          draftOrder {
            invoiceUrl
          }
          userErrors {
            field
            message
          }
        }
      }
    `;

    const response = await fetch(`https://${process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN}/admin/api/2024-10/graphql.json`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'X-Shopify-Access-Token': process.env.SHOPIFY_ADMIN_API_ACCESS_TOKEN!,
      },
      body: JSON.stringify({
        query,
        variables: {
          input: {
            note: "Custom PC Build from Configurator",
            lineItems: [
              {
                title: "Custom PC Konfiguracija",
                originalUnitPrice: totalPrice.toString(),
                quantity: 1,
                customAttributes: [
                  { key: "Komponente", value: summary }
                ]
              }
            ]
          }
        }
      }),
    });

    const result = await response.json();

    if (result.errors) {
      return NextResponse.json({ error: result.errors[0].message }, { status: 500 });
    }

    return NextResponse.json(result.data.draftOrderCreate);
  } catch (error) {
    console.error("Checkout API Error:", error);
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}
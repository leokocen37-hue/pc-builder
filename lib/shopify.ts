"use client";

export async function shopifyFetch<T>(
  query: string, 
  variables: Record<string, any> = {}
): Promise<T> {
  
  // Mora biti unutar funkcije da bi Vercel ovo ispravno pročitao pri pokretanju
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN;
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

  if (!domain || !token) {
    console.error("🚨 Missing Shopify Environment Variables!", { domain, token });
    throw new Error("Shopify domain or token is missing. Check Vercel Environment Variables.");
  }

  const cleanDomain = domain.trim();
  const cleanToken = token.trim();

  const endpoint = `https://${cleanDomain}/api/2024-10/graphql.json`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": cleanToken,
        // Force English/Default language so Shopify doesn't hide the metafields!
        "Accept-Language": "en-US, en;q=0.9", 
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      cache: "no-store", 
    });

    const responseBody = await res.json();

    if (responseBody.errors) {
      console.error("❌ Shopify GraphQL Errors:", responseBody.errors);
      throw new Error(`[GraphQL Error]: ${responseBody.errors[0].message}`);
    }

    return responseBody.data as T;
  } catch (error) {
    console.error("❌ Shopify Fetch Network Error:", error);
    throw error;
  }
}
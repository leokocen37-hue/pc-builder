"use client";

export async function shopifyFetch<T>(
  query: string, 
  variables: Record<string, any> = {}
): Promise<T> {
  
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN;
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

  if (!domain || !token) {
    throw new Error("Shopify domain or token is missing.");
  }

  const endpoint = `https://${domain.trim()}/api/2024-10/graphql.json`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token.trim(),
        // FORCES English data to avoid the Language Ghost bug
        "Accept-Language": "en-US, en;q=0.9", 
      },
      body: JSON.stringify({ query, variables }),
      cache: "no-store", 
    });

    const responseBody = await res.json();

    if (responseBody.errors) {
      throw new Error(`[GraphQL Error]: ${responseBody.errors[0].message}`);
    }

    return responseBody.data as T;
  } catch (error) {
    console.error("Shopify Network Error:", error);
    throw error;
  }
}
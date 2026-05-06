"use client"; // Optional, but good practice since you are calling this from a client component

export async function shopifyFetch<T>(
  query: string, 
  variables: Record<string, any> = {}
): Promise<T> {
  
  // 1. MUST BE INSIDE THE FUNCTION:
  // This guarantees Next.js explicitly injects the variables when the function runs
  const domain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN;
  const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

  if (!domain || !token) {
    console.error("🚨 Missing Shopify Environment Variables!", { domain, token });
    throw new Error("Shopify domain or token is missing. Check Vercel Environment Variables.");
  }

  // Clean up any accidental spaces from Vercel copy-pasting
  const cleanDomain = domain.trim();
  const cleanToken = token.trim();

  const endpoint = `https://${cleanDomain}/api/2024-10/graphql.json`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": cleanToken,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      // 'no-store' ensures we always get the latest inventory/prices and bypasses aggressive Vercel caching
      cache: "no-store", 
    });

    const responseBody = await res.json();

    // Handle GraphQL-level errors
    if (responseBody.errors) {
      console.error("❌ Shopify GraphQL Errors:", responseBody.errors);
      throw new Error(`[GraphQL Error]: ${responseBody.errors[0].message}`);
    }

    return responseBody.data as T;
  } catch (error) {
    // Handle Network-level errors
    console.error("❌ Shopify Fetch Network Error:", error);
    throw error;
  }
}
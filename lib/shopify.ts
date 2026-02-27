const domain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN;
const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

/**
 * Validates that environment variables are present.
 * This prevents the app from failing silently.
 */
if (!domain || !token) {
  console.warn(
    "⚠️ Shopify domain or token is missing in environment variables. Check your .env file."
  );
}

export async function shopifyFetch<T>(
  query: string, 
  variables: Record<string, any> = {}
): Promise<T> {
  const endpoint = `https://${domain}/api/2024-10/graphql.json`;

  try {
    const res = await fetch(endpoint, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Shopify-Storefront-Access-Token": token!,
      },
      body: JSON.stringify({
        query,
        variables,
      }),
      // 'no-store' ensures we always get the latest inventory/prices
      cache: "no-store", 
    });

    const responseBody = await res.json();

    // Handle GraphQL-level errors (e.g., syntax errors, missing fields)
    if (responseBody.errors) {
      console.error("Shopify GraphQL Errors:", responseBody.errors);
      throw new Error(`[GraphQL Error]: ${responseBody.errors[0].message}`);
    }

    return responseBody.data as T;
  } catch (error) {
    // Handle Network-level errors (e.g., DNS failure, timeout)
    console.error("Shopify Fetch Network Error:", error);
    throw error;
  }
}
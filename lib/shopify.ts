// Plain fetch wrapper — safe to import from both client components and
// server code (API routes), since it has no client-only dependencies.

// Next 15+ doesn't cache fetch by default, so this has to be explicit. Default
// is ISR-style revalidation so server components/pages don't hit the Storefront
// API on every single request. Pass `{ cache: "no-store" }` only where the data
// must be live (checkout price re-validation, stock/cart checks) — everything
// else should keep the default.
type CachePolicy = { cache: "no-store" } | { next: { revalidate: number } };
const DEFAULT_CACHE: CachePolicy = { next: { revalidate: 300 } };

export async function shopifyFetch<T>(
  query: string,
  variables: Record<string, unknown> = {},
  cachePolicy: CachePolicy = DEFAULT_CACHE
): Promise<T> {

  // prefer the server-only names — after Phase 1 almost everything fetches
  // server-side, so the token no longer needs to ship in the client bundle.
  // Falls back to the NEXT_PUBLIC_ vars for the couple of components still
  // fetching client-side (BrandMarquee, CrossSell) until those are converted too.
  const domain = process.env.SHOPIFY_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN;
  const token = process.env.SHOPIFY_STOREFRONT_TOKEN || process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN;

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
      ...cachePolicy,
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

const domain = process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN!;
const token = process.env.NEXT_PUBLIC_SHOPIFY_STOREFRONT_TOKEN!;

export async function shopifyFetch<T>(query: string, variables?: Record<string, any>): Promise<T> {
  const res = await fetch(`https://${domain}/api/2024-10/graphql.json`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "X-Shopify-Storefront-Access-Token": token,
    },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });

  const json = await res.json();

  if (json.errors) {
    throw new Error(JSON.stringify(json.errors));
  }
  return json.data as T;
}
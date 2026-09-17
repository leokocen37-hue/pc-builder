// Shopify Admin API access. Server-only — it exchanges the app's client
// credentials for an access token, so it must never be imported from a client
// component.
//
// Split out of app/api/checkout/route.ts once a second route (the draft-order
// status check that clears a paid cart) needed the same handshake.

const API_VERSION = "2024-10";

const shopifyDomain = () =>
  process.env.SHOPIFY_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN;

/** A short-lived Admin token, or null when the credentials are missing/rejected. */
export async function adminAccessToken(): Promise<string | null> {
  const res = await fetch(`https://${shopifyDomain()}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });
  const data = await res.json();
  return data.access_token || null;
}

/** One Admin GraphQL call. Never cached: everything it is used for is live state. */
export async function adminGraphql<T>(
  accessToken: string,
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(`https://${shopifyDomain()}/admin/api/${API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": accessToken },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  return res.json() as Promise<T>;
}

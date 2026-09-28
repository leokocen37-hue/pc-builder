// Shopify Admin API access. Server-only — it exchanges the app's client
// credentials for an access token, so it must never be imported from a client
// component.
//
// Split out of app/api/checkout/route.ts once a second route (the draft-order
// status check that clears a paid cart) needed the same handshake.

import { SHOPIFY_API_VERSION } from "./shopify-version";

const shopifyDomain = () =>
  process.env.SHOPIFY_DOMAIN || process.env.NEXT_PUBLIC_SHOPIFY_DOMAIN;

/** A short-lived Admin token, or null when the credentials are missing/rejected. */
export async function adminAccessToken(): Promise<string | null> {
  if (!process.env.SHOPIFY_CLIENT_ID || !process.env.SHOPIFY_CLIENT_SECRET) return null;

  const res = await fetch(`https://${shopifyDomain()}/admin/oauth/access_token`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      client_id: process.env.SHOPIFY_CLIENT_ID,
      client_secret: process.env.SHOPIFY_CLIENT_SECRET,
      grant_type: "client_credentials",
    }),
  });

  // Shopify answers a bad or missing credential with an HTML page, not JSON.
  // Parsing that threw, and the parser's own message ("Unexpected token '<'")
  // came back to the buyer as a 500 — no use to them, and a small window into
  // how the server is wired. A null here is turned into a clean 401 by the
  // caller instead.
  try {
    const data = await res.json();
    return data.access_token || null;
  } catch {
    return null;
  }
}

/** One Admin GraphQL call. Never cached: everything it is used for is live state. */
export async function adminGraphql<T>(
  accessToken: string,
  query: string,
  variables: Record<string, unknown> = {}
): Promise<T> {
  const res = await fetch(`https://${shopifyDomain()}/admin/api/${SHOPIFY_API_VERSION}/graphql.json`, {
    method: "POST",
    headers: { "Content-Type": "application/json", "X-Shopify-Access-Token": accessToken },
    body: JSON.stringify({ query, variables }),
    cache: "no-store",
  });
  return res.json() as Promise<T>;
}

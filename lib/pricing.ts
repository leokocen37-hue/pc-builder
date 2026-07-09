// Shared between the configurator UI (components/Builder.tsx) and the checkout
// API (app/api/checkout/route.ts) — the server re-derives the price of every
// custom build from this fee + real Shopify variant prices, never from the client.
export const ASSEMBLY_FEE = 200;

// One Shopify API version for the whole app. The Storefront calls in
// lib/shopify.ts and the Admin calls in lib/shopify-admin.ts each carried
// their own copy, so one could be bumped and the other quietly left behind.
//
// Shopify supports a version for a year from release, then silently serves a
// newer one and sets x-shopify-api-version-warning. That is how 2025-07 was
// found to be past it — the store was answering on 2025-10 and saying so in a
// header nobody read.
//
// 2026-10 exists as well; this stays one release behind it on purpose, so the
// store is never on a version that shipped days ago. Bump and run the suite
// each quarter.
export const SHOPIFY_API_VERSION = "2026-07";

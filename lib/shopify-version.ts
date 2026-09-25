// One Shopify API version for the whole app. The Storefront calls in
// lib/shopify.ts and the Admin calls in lib/shopify-admin.ts each carried
// their own copy, so one could be bumped and the other quietly left behind.
//
// Shopify supports a version for a year from release; bump this and run the
// suite when the current one nears the end of that window.
export const SHOPIFY_API_VERSION = "2025-07";

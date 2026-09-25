// Every euro figure the shop quotes, in one place: the configurator UI
// (components/Builder.tsx), the cart, the checkout API and the copy on
// /dostava all read from here, so a price can't be right in one place and
// stale in another.

/** hr-HR: "1.234,99 €" — symbol last, comma decimal, dot thousands.
 *  Defined here rather than in lib/cart.tsx because that module is
 *  "use client", and a server component calling one of its exports fails. */
export const formatEUR = (n: number) =>
  new Intl.NumberFormat("hr-HR", { style: "currency", currency: "EUR" }).format(n || 0);

/** Charged once per configured build, on its own order line. */
export const ASSEMBLY_FEE = 200;

/** The name on the order line. */
export const ASSEMBLY_FEE_LABEL = "Sklapanje, instalacija i testiranje";
/** The same thing without a comma, for the cart's comma-separated component
 *  list — the full label would be split across two rows there. */
export const ASSEMBLY_FEE_SHORT = "Sklapanje i testiranje";
export const ASSEMBLY_FEE_NOTE =
  "Sklapanje, ugradnja komponenti, upravljanje kabelima, BIOS i ažuriranja, testiranje pod opterećenjem i pakiranje.";

/** Orders from this up ship free; below it the flat fee applies. */
export const FREE_SHIPPING_FROM = 500;
/** DPD, Hrvatska. */
export const SHIPPING_FEE = 5.99;

/** What the courier will charge for a cart of this size. */
export const shippingFor = (subtotal: number) => (subtotal >= FREE_SHIPPING_FROM ? 0 : SHIPPING_FEE);

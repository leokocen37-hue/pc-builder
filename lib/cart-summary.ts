// Joins a build's component list into the single-line "Komponente" attribute
// Shopify stores on the order. Nothing splits it again — the cart keeps its own
// list — so this only has to read cleanly to whoever opens the order.
//
// Neither a comma nor " · ": a Croatian price carries a comma ("200,00 €") and
// variant titles carry the middle dot ("Crni · 3200 MHz CL22"), so both made
// the line ambiguous about where one component ended and the next began.
export const SUMMARY_SEP = " | ";

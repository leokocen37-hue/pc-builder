// The separator that joins a custom build's component list and splits it again
// in the cart. It lives in its own module because both a client component
// (lib/cart.tsx) and a server route (app/api/checkout) need it, and lib/cart.tsx
// is "use client" — importing from there on the server fails at render time.
//
// Not a comma: a Croatian price carries one ("200,00 €"), so a comma-split list
// tore every amount in half.
export const SUMMARY_SEP = " · ";

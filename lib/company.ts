// Registered company data — single source of truth for the impressum, the
// legal pages and the withdrawal-form address block. Values come from the
// Croatian court register (sudski registar) entry for the company.
// Update here, not in the individual pages.
export const COMPANY = {
  /** short trading form, used in running text */
  name: "BELVIOR d.o.o.",
  /** full registered name as it appears in the court register */
  legalName: "BELVIOR društvo s ograničenom odgovornošću za trgovinu i usluge",
  /** storefront brand, not the legal entity */
  brand: "RAČUNALO.hr",
  oib: "59354205995",
  mbs: "070226211",
  street: "Stepinčeva ulica 2A",
  postalCode: "40313",
  city: "Selnica",
  country: "Hrvatska",
  court: "Trgovački sud u Varaždinu",
  /** shown only in the Uvjeti trader details, not in the footer impressum */
  shareCapital: "3.060,00 EUR",
  directors: ["Leo Kocen", "Jasmin Kodba"],
  activity: "G47400 — Trgovina na malo informacijsko-komunikacijskom opremom",
  email: "info@racunalo.hr",
} as const;

/** "Stepinčeva ulica 2A, 40313 Selnica" */
export const COMPANY_ADDRESS = `${COMPANY.street}, ${COMPANY.postalCode} ${COMPANY.city}`;

/** "Stepinčeva ulica 2A, 40313 Selnica, Hrvatska" */
export const COMPANY_ADDRESS_FULL = `${COMPANY_ADDRESS}, ${COMPANY.country}`;

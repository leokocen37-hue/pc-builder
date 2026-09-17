// Single source of truth for the version tag recorded on every order as
// _uvjeti_verzija.
//
// Bump this whenever ANY of the three documents the buyer accepts changes:
//   /uvjeti        Opći uvjeti poslovanja
//   /privatnost    Politika privatnosti
//   /raskid        Pravo na jednostrani raskid (i iznimke)
//
// The tag only has evidential value if the exact text published on the day of
// an order can be recovered, so a bump must land in the same commit as the
// document change — git history is what ties the two together.
export const TERMS_VERSION = "2026-09";

/** Visible "last updated" line, shown at the top and bottom of those documents. */
export const TERMS_UPDATED_LABEL = "rujan 2026.";

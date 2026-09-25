// Croatian number agreement.
//
// The noun after a number takes three different forms, chosen by the LAST digit
// (and last two, because the teens are an exception):
//   1, 21, 101      -> singular            1 model
//   2-4, 22-24      -> "paucal"            3 modela
//   0, 5-20, 25-30  -> genitive plural     7 modela
//
// The site was writing "4 kompatibilnih modela", which is the third form where
// the second belongs.

export type PluralForms = {
  /** 1, 21, 31 … */
  one: string;
  /** 2–4, 22–24 … */
  few: string;
  /** 0, 5–20, 25–30 … */
  many: string;
};

export function pluralForm(n: number): keyof PluralForms {
  const abs = Math.abs(Math.trunc(n));
  const last = abs % 10;
  const lastTwo = abs % 100;
  if (last === 1 && lastTwo !== 11) return "one";
  if (last >= 2 && last <= 4 && (lastTwo < 12 || lastTwo > 14)) return "few";
  return "many";
}

/** "1 model" / "3 modela" / "7 modela" — the number, then the right form. */
export function plural(n: number, forms: PluralForms): string {
  return `${n} ${forms[pluralForm(n)]}`;
}

/** Ready-made sets for the nouns the storefront counts. */
export const NOUNS = {
  proizvod: { one: "proizvod", few: "proizvoda", many: "proizvoda" },
  stavka: { one: "stavka", few: "stavke", many: "stavki" },
  model: { one: "model", few: "modela", many: "modela" },
  dan: { one: "dan", few: "dana", many: "dana" },
} satisfies Record<string, PluralForms>;

/** "kompatibilan model" / "kompatibilna modela" / "kompatibilnih modela" —
 *  the adjective agrees too, so it can't be prefixed to NOUNS.model. */
export const KOMPATIBILNI_MODEL: PluralForms = {
  one: "kompatibilan model",
  few: "kompatibilna modela",
  many: "kompatibilnih modela",
};

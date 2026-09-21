// Single place for the numbers buyers ask about most (starting price, free
// shipping threshold, lead time) — edit here, not scattered across pages.
export const SITE = {
  startingPrice: 599, // EUR — placeholder, awaiting confirmation
  freeShippingFrom: 500, // EUR — placeholder, awaiting confirmation
  // Every PC is assembled after the order is placed — the "gotova" ones too,
  // which is why they carry no right of withdrawal (see /raskid). The wait is
  // therefore two stages, and is quoted as two rather than as one blended
  // number, so the buyer can see which part is us and which part is the
  // courier.
  buildDaysMin: 5,
  buildDaysMax: 10,
  shipDaysMin: 1,
  shipDaysMax: 2,
};

/** "Izrada i testiranje 5–10 radnih dana + dostava 1–2 radna dana" */
export const LEAD_TIME_PC =
  `Izrada i testiranje ${SITE.buildDaysMin}–${SITE.buildDaysMax} radnih dana` +
  ` + dostava ${SITE.shipDaysMin}–${SITE.shipDaysMax} radna dana`;

/** Peripherals ship from stock — there is no build stage to wait through. */
export const LEAD_TIME_STOCK = `Dostava ${SITE.shipDaysMin}–${SITE.shipDaysMax} radna dana`;

/**
 * Adds working days (Mon–Fri) to a date.
 *
 * The lead time is quoted in *working* days, so any date shown to a buyer has
 * to be counted that way: ten working days is fourteen calendar days, and
 * counting calendar days would show a delivery date up to four days before
 * the one actually promised.
 *
 * Public holidays aren't accounted for — the dates are explicitly an estimate,
 * and a holiday calendar would need maintaining every year to stay honest.
 */
export function addWorkingDays(from: Date, days: number): Date {
  const d = new Date(from);
  let left = days;
  while (left > 0) {
    d.setDate(d.getDate() + 1);
    const day = d.getDay();
    if (day !== 0 && day !== 6) left--;
  }
  return d;
}

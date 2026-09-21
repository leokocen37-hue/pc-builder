// Single place for the numbers buyers ask about most (starting price, free
// shipping threshold, lead times) — edit here, not scattered across pages.
export const SITE = {
  startingPrice: 599, // EUR — placeholder, awaiting confirmation
  freeShippingFrom: 500, // EUR — placeholder, awaiting confirmation

  // Every PC is assembled after the order is placed — the "gotova" ones too,
  // which is why they carry no right of withdrawal (see /raskid). That wait is
  // two stages and is quoted as two, so the buyer can see which part is us and
  // which part is the courier.
  buildDaysMin: 4,
  buildDaysMax: 8,
  shipDaysMin: 1,
  shipDaysMax: 2,

  // Peripherals ship from stock: no build stage, and quoted as one figure that
  // already includes the courier — a buyer ordering a keyboard has no reason
  // to care where the days go.
  stockDaysMin: 3,
  stockDaysMax: 7,
};

/** "Izrada i testiranje 4–8 radnih dana + dostava 1–2 radna dana" */
export const LEAD_TIME_PC =
  `Izrada i testiranje ${SITE.buildDaysMin}–${SITE.buildDaysMax} radnih dana` +
  ` + dostava ${SITE.shipDaysMin}–${SITE.shipDaysMax} radna dana`;

/** "Isporuka 3–7 radnih dana" — delivery included, no build stage. */
export const LEAD_TIME_STOCK = `Isporuka ${SITE.stockDaysMin}–${SITE.stockDaysMax} radnih dana`;

/**
 * Adds working days (Mon–Fri) to a date.
 *
 * Every lead time here is quoted in *working* days, so any date shown to a
 * buyer has to be counted that way: ten working days is fourteen calendar
 * days, and counting calendar days would show a date before the one promised.
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

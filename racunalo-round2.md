# RAČUNALO.hr — round 2 fixes

Desktop carousel geometry is good now — don't touch `getCardStyle` for desktop.
Everything below is mobile layout, two controls, one state bug, and the badge system.

---

## A. Mobile configurator — card overflow

At 390px the carousel is broken. From a real device screenshot on the RAM step:

- The focused card's title wraps to two lines, which pushes the spec line and the price
  **outside the card border** — `€0.00` renders below the frame, on top of
  `KLIKNI ZA ODABIR`.
- The neighbouring ghost cards render at nearly full size and bleed off both screen
  edges, overlapping the focused card's text. On the left, `64GB Corsair Vengeance
  DDR5 / 64 GB · DDR5-5200 / €0.00` is fully legible and sitting on top of the focused
  card.
- The `NAJBOLJI OMJER` badge and the `DETALJI` button collide at the top of the card.
- The sticky bottom bar (`ISPORUKA 20. kol – 22. kol / €0.00`) overlaps the `ODABRANO`
  summary panel.

Fix: mobile needs its own geometry, not a scaled-down desktop one.

- Show **one card**, centred, at roughly 78% of viewport width. Neighbours may peek at
  the very edges as a scroll affordance but must never overlap the focused card's
  content box — cap them at ~8% visible each and clip the track with `overflow: hidden`.
- Give the card a min-height that fits a **two-line title** plus spec line plus price,
  so nothing escapes the border. Test with `32GB Corsair Vengeance DDR5` and
  `ASUS ROG CROSSHAIR X870E HERO`.
- Badge and `DETALJI` must not collide: put the badge top-left and the icon top-right
  with a guaranteed gap, and let the badge text truncate rather than push.
- Reserve bottom padding on the scroll container equal to the sticky bar's height so the
  summary panel is never covered.

---

## B. Mobile configurator — vertical budget

At 390×844 I measured, before any selectable content:

```
announce bar        0   -> 52     (52px, wraps to 2 lines on mobile)
header             52   -> 121    (69px)
preamble          121   -> 377    (256px: step rail + KORAK label + H1 + subtitle)
--------------------------------------------------
first card starts at 377           = 45% of the viewport
Intel card        377   -> 540
AMD card          627   -> 782
```

On a real phone the browser URL bar eats another ~100px, which is why the AMD card is
cut in half. **Do not shrink the header** — it's already only 69px and it isn't the
problem. The 256px preamble and the 52px announce bar are.

Reclaim it like this:

1. **Hide the announce bar on mobile** (or collapse it into a single non-wrapping line).
   It's marketing copy and it currently takes two lines. −52px.
2. **Replace the 11-pill step rail on mobile** with a compact progress line:
   `Korak 1/11 · Platforma` plus a thin progress bar. Keep the pill rail on desktop.
   Tapping the line can expand the full rail for people who want to jump. −40px.
3. **Drop the `KORAK 01 — ODABIR` eyebrow on mobile** — it's redundant once the progress
   line exists. −30px.
4. **Subtitle to one line on mobile**, or hide it below 480px. −25px.
5. **Platform cards to ~120px tall on mobile** (currently 163px and mostly padding).
   −86px across the two.

That's roughly 230px reclaimed, which puts both platform cards comfortably above the
fold with the URL bar visible. Verify at 390×844 **and** at 390×740 to simulate the URL
bar being open.

---

## C. Mobile homepage

- **`TVOJA PRAVILA` is nearly invisible.** The gradient text fill from A4 combined with
  the A3 scrim is far too dark against the mobile hero crop. Use a lighter gradient on
  mobile — raise the stops toward white/light-magenta — or reduce the scrim opacity
  behind the headline specifically. It must be clearly readable on a phone in daylight.
  Check the contrast of the lightest and darkest points of the gradient against the
  image behind them.
- **The info strip stacks as three centred lines** (`Konfiguracije od 599,00 €` /
  `Besplatna dostava iznad 500,00 €` / `Spremno za 3–5 radnih dana`) and reads as a
  weak list. On mobile make it a horizontally scrollable single row of three chips, or a
  2+1 grid with dividers — anything with structure. Not three centred sentences.
- **The hero feature chips wrap 2+1** (`3–5 dana` `24 mj.` then `✓ TESTIRANO PRIJE
  SLANJA` alone underneath), which looks accidental. Either force all three onto one row
  at a smaller size, or lay them out as an even 3-column grid.

---

## D. "Usporedi" control — redesign

The current per-card checkbox is hard to hit (repeated mis-clicks), visually noisy, and
wrong on the card.

Replace it with a **compare mode**:

- Add a `Usporedi` toggle button to the toolbar next to the grid/carousel switch.
- Compare mode is **off by default** — cards stay clean, no checkboxes anywhere.
- When on, cards become selectable for comparison (a clear selected outline plus a
  corner tick), tapping a card adds it to the comparison instead of choosing it, and a
  bar shows `2/3 odabrano`. Selecting 2+ opens the comparison sheet.
- Turning the mode off clears the selection and returns cards to normal behaviour.
- Hit targets minimum 44×44px.

This removes the ambiguity of "does clicking this card select it or compare it" — the
mode answers that question before the tap.

If compare mode is disproportionately large, the fallback is: keep it per-card but make
it an **icon-only button in the card's top-left corner** with a 44×44px target and a
tooltip/aria-label, not a checkbox with a text label. Tell me which you're doing.

---

## E. "Detalji" — icon only

Drop the text. Keep just the ⓘ icon as a circular button. Same position, 44×44px hit
target, `aria-label="Detalji"` plus a title tooltip on desktop. Apply in both grid and
carousel.

---

## F. BUG — recommended-start doesn't survive "Ispočetka"

Repro: open the configurator, pick a platform (lands on the recommended item correctly),
move through a few steps, click **Ispočetka**, pick Intel again — now it opens at item 1
instead of the recommended one.

Cause: the ref tracking which steps have already been seeded isn't cleared by the reset
handler, so every step counts as already-initialised and skips the recommended focus.

Fix: clear that ref (and any per-step focus memory) inside the reset handler, alongside
the selections. Also clear it when the platform changes — switching Intel→AMD produces a
completely different product list, so each step must re-seed.

Add a test: reset, re-enter, assert the focused index equals the recommended index.

---

## G. Badges — "Preporučujemo" and "Best Buy" on every step

Target: **every step shows exactly two badges** — one `PREPORUČUJEMO` and one
`BEST BUY` — on two different products.

Changes:

1. **Rename** `NAJBOLJI OMJER` to `BEST BUY` (keep it in Latin script exactly like that,
   the user wants the English term).
2. **Colour it orange**, distinct from the magenta `PREPORUČUJEMO`. Pick an amber that
   doesn't read as the AMD brand orange used on the platform card — something around
   `#f59e0b` rather than a red-orange. Verify contrast for the badge text.
3. Both badges keep the hard cap of one each per step.

**Important dependency:** this can only work once the underlying flags exist per
platform. Right now `pcf.recommended` and `pcf.pick` are set once per component *type*,
but the configurator filters by platform/socket — so e.g. the only flagged CPU is an
Intel part, and the AMD list has no recommended item at all. I'm regenerating the Shopify
import so the flags are set per **type × platform**.

Until that import lands, keep the existing fallback behaviour, but tell me explicitly how
it currently works: when the flagged product isn't in the filtered list, are you
synthesising a badge on a computed fallback, or rendering nothing? I need to know whether
Shopify or the code is the source of truth before I set 40+ flags.

---

## Constraints

- Desktop carousel geometry is signed off — don't change it while fixing mobile. Use
  mobile-specific breakpoints, not shared values.
- Croatian copy, correct diacritics, EUR formatted `1.299,00 €`. `BEST BUY` stays English.
- Verify every change at 390×844 and 390×740, and confirm desktop is unchanged at 1440.
- Click through all 11 steps in a real or headless browser before pushing. The last two
  rounds each shipped a break that only appeared on interaction.
- No new dependencies without asking.

# RAČUNALO.hr — design & UX pass

Next.js 16 App Router + Shopify Storefront API, deployed on Vercel. Product data is
server-rendered (done in earlier work). This brief is UI/UX only.

## Before you start

Read the relevant components first and report what you find before writing code:
`components/Builder.tsx` (configurator), `components/CollectionView.tsx`,
`app/HomeClient.tsx`, `components/BrandMarquee.tsx`, the site header, and whatever
renders the product cards in each context. If anything below doesn't match how the code
is actually structured, say so and propose the equivalent rather than forcing it.

Work in phases. `npm run build` must pass before each commit. Don't start the next phase
until the current one is clean.

## Context that constrains everything

Prices do NOT exist yet — the company isn't registered, so distributor accounts aren't
open. Every `Variant Price` is 0,00 €. Spec data is now partially populated (see Phase B)
but is deliberately thin for SSDs, HDDs and CPUs, where the source data doesn't exist yet.

Everything you build must degrade gracefully when data is missing:

- No spec data → the spec row is omitted entirely, not rendered empty or as "—"
- Fewer than three spec lines → show what exists, don't pad
- No quality value → no tier label, and the item sorts to the end
- No recommendation flag → no badge, and the step shows no badge at all

Never render a placeholder, a skeleton, or a dash for missing data. Absent means absent.

Note: badges currently do not appear anywhere in the configurator, because `pcf.badge`
was deliberately emptied in Shopify ahead of this work. That is the expected starting
state, not a bug to fix — Phase D is what makes badges reappear, from the new fields.

DO NOT touch pricing display, the "Na upit" fallback, or the USKORO badge logic. Those
are correct and intentional while the catalogue is incomplete.

---

## Phase A — Quick fixes

**A1. Floating button overlaps the primary CTA on mobile.** There's a circular floating
button pinned to the right edge (visible on every page). At desktop widths it's clear of
everything; at 390px it lands directly on top of the "Otvori konfigurator" hero button,
and on the configurator it overlaps content too. Move it so it can never collide with a
CTA — raise it above the mobile bottom bar, or hide it below a breakpoint if it's
non-essential. Tell me what that button does; I'm not sure it's needed at all.

**A2. Step-pill scrollbar.** The horizontal step nav in the configurator shows a raw
desktop scrollbar on mobile. Hide it (`scrollbar-width: none` + `::-webkit-scrollbar`)
and add left/right fade masks so it still reads as scrollable. Also add scroll-snap and
auto-scroll the active step into view when it changes.

**A3. Hero scrim + eyebrow.** The eyebrow ("CUSTOM PC · RUČNO SASTAVLJENO U HRVATSKOJ")
is magenta on a light-purple part of the hero image and is effectively invisible at
desktop widths. Two changes:
  - Add a soft dark radial/linear scrim behind the centre column of the hero so all hero
    text sits on a consistent dark base. Tune it so the two PC case images either side
    stay bright — the scrim should be centred and fall off before it reaches them.
  - Change the eyebrow from magenta to white at ~70% opacity, keeping the mono uppercase
    letterspaced treatment. Magenta can stay on the "·" separators only.
  This is a desktop problem specifically; verify the mobile hero still looks right after.

**A4. "TVOJA PRAVILA".** Currently outline/stroke only, which makes the emphasised phrase
the least legible thing in the headline. Change it to solid text filled with the
magenta→violet gradient already used on the primary buttons (background-clip: text).
Keep "TVOJE RAČUNALO," solid white as it is. Check it degrades to solid magenta where
background-clip isn't supported.

**A5. Brand marquee.** Logos are near-invisible. Raise resting opacity to ~60% (full on
hover), and use `filter: grayscale(1) brightness(1.8)` rather than opacity alone so dark
logos (Klipsch, Ducky) don't vanish against the near-black background. Normalise all
logos to a fixed optical height — NZXT currently renders about twice the size of Fractal.

---

## Phase B — Data model

These metafields already exist in Shopify and are now populated. Do NOT create new ones.

- **`pcf.specs`** — multi-line text. One spec per line, format `Label: Value`:
  ```
  Chipset: B860M
  Priključak: LGA 1851
  Format: mATX
  Utori za memoriju: 2× DDR5
  ```
  Parse by splitting on newline, then on the first `": "`. Ignore malformed lines
  silently. Populated on 99 of 102 components (the 3 OS entries are intentionally empty).

  **The first three lines are the card specs. Everything is the drawer.** This is the
  whole rule — there is no per-category config in code. Ordering is controlled in Shopify
  so what appears on a card can change without a deploy.

- **`pcf.quality`** — the tier source. Already populated on 101 of 102. Five values, map
  to three display tiers:
  ```
  average, good   -> ULAZNI
  very good       -> SREDNJI
  excellent, flagship -> VRHUNSKI
  ```
  Any other value, or empty, renders no tier label. Do NOT create a `pcf.tier` field.

- **`pcf.recommended`** — boolean. Exactly one product per component type is flagged.
- **`pcf.pick`** — boolean, used for "best value". Exactly one per component type.

`pcf.badge` and `pcf.badge_color` are now empty on every product and are deprecated.
Remove all code that reads them.

Extend the Storefront query to fetch `specs`, `quality`, `recommended`, and `pick`
wherever configurator components are fetched.

---

## Phase C — Specs on cards

**C1. Key specs on the card.** Take the **first three lines** of `pcf.specs` and render
their values as a compact mono row separated by "·" — labels omitted on the card, values
only. Example, from the three lines `Chipset: B860M` / `Priključak: LGA 1851` /
`Format: mATX`, the card shows:

    B860M · LGA 1851 · mATX

Muted colour, smaller than the product name, sitting above the price. If a product has
fewer than three lines, show what exists. If `pcf.specs` is empty, render nothing — no
empty row, no dash, no reserved space that collapses the layout.

Apply this in three places:
  - configurator cards (both carousel and grid views)
  - pre-built PC cards on /racunala and its subcategories
  - the homepage product rows

For pre-built PCs the three keys should be CPU, GPU, and RAM. Nobody buys a €1.500 PC
from a product name alone — this is the single biggest conversion gap on the listing
pages.

**C2. Detail drawer.** Add a "Detalji" affordance to each configurator card that opens a
panel sliding in from the right, over a dimmed backdrop, with the configurator still
visible behind it. Contents: full `pcf.specs` table, product description, image.

It must be a drawer, not a modal dialog and not a route change — people must not lose
their place in the build. Requirements: closes on Escape and on backdrop click, traps
focus while open, returns focus to the triggering card on close, and is full-height
bottom-sheet style on mobile rather than a side panel.

Opening the drawer must NOT select the component. Selecting and inspecting are separate
actions — make that unambiguous in the hit targets.

---

## Phase D — Badge system

The current badges do three different jobs at once and collide. On the motherboard step
there are seven products with seven badges, two of them identical ("APSOLUTNI VRH"), all
at the same visual weight. Replace with three distinct devices:

**D1. Recommendation badge.** Driven by `pcf.recommended` — `PREPORUČUJEMO`, solid
magenta fill, white text, top-left of the card. Second badge from `pcf.pick` —
`NAJBOLJI OMJER`, same shape, muted/outline treatment so it reads as secondary. The data
already guarantees exactly one of each per component type; still, hard-cap at one of each
per step in code and log a dev warning if more appear. These must be the only filled
badges anywhere on the screen.

**D2. Tier label.** Not a badge. Small mono uppercase text above the product name, no
fill, ~60% opacity, derived from `pcf.quality` via the mapping in Phase B. Only ULAZNI /
SREDNJI / VRHUNSKI render; an unmapped or empty value renders nothing.

**D3. Delete the marketing adjectives.** Remove `TUF IZDRŽLJIVOST`, `GAMING ODABIR`,
`POUZDAN ODABIR`, `OSNOVNI STANDARD`, `ZLATNA SREDINA`, `APSOLUTNI VRH` and any other
free-text badge, along with whatever generates them. If a claim matters it belongs in the
specs.

While the metafields are empty this means no badges render at all. That is the correct
intermediate state — do not substitute the old logic as a fallback.

---

## Phase E — Carousel

Keep the carousel as the default view; the grid stays as a toggle. Improve it:

**E1. Sort by quality**, always — using the full five-level `pcf.quality` scale for
ordering (`average → good → very good → excellent → flagship`), not the collapsed
three-tier display value, so the sequence is finer-grained than the labels. Products with
no quality value sort last. Within the same quality level, sort by price ascending (all
prices are currently 0,00 € so this is a no-op today — implement it anyway). Moving right
must always mean moving up.

**E2. Add a tier axis** under the carousel — a thin horizontal scale labelled `ULAZNI` at
one end and `VRHUNSKI` at the other, with a marker showing the focused card's position.
Hide it entirely if no product in the current step has a quality value.

**E3. Remove the blur** on non-focused cards. Peripheral cards are currently blurred to
the point their names can't be read, which defeats the purpose of showing them. Keep a
subtle depth cue only: scale 0.92, opacity 0.75, zero blur.

**E4. Show five cards** at desktop widths (focused + two each side) instead of three.
Scale down at narrower breakpoints; one card on mobile.

**E5. Affordances:** a `3 / 7` position indicator, left/right arrow-key navigation when
the carousel has focus, visible focus rings on cards and arrows, and trackpad/touch swipe
in addition to the arrow buttons.

**E6. Persist the grid/carousel preference** across steps and visits.

---

## Phase F — Storage step and optional steps

**F1. Merge SSD and HDD into one step called "Pohrana"** containing two slots:
  - *Glavni disk (SSD)* — required, with a sensible default pre-selected
  - *Dodatni disk* — optional, where the default selected option is an explicit
    "Bez dodatnog diska" card, plus an option to add a further drive

Do not simply concatenate the two lists. The point is that optionality becomes visible in
place instead of being something the user has to infer. Step count goes 12 → 11.

**F2. Mark optional steps in the stepper** with lighter styling and the word
`opcionalno`, skippable in one click. Optional: the second storage slot, Sustav (many
buyers already own a Windows licence), and Hladnjak when the selected CPU ships with one
— if the data to determine that isn't available, leave Hladnjak required and tell me.

**F3.** Renumber the stepper and update any hardcoded step indices, the URL-restore
logic, and the permalink encoding so existing shared links don't break. If old encoded
links can't be migrated cleanly, make the decoder tolerant of the old format rather than
failing.

---

## Phase G — Compare (only if A–F are clean)

Add a "Usporedi" checkbox to configurator cards. Selecting two or three slides a
comparison table up from the bottom, with rows drawn from the union of their
`pcf.specs` keys and differing values highlighted. Clear-all and close controls.

This is the strongest differentiator on the list, but it's worthless without spec data —
so build it last, and only after C is solid.

---

## Constraints

- All user-facing copy in Croatian, matching existing tone, correct diacritics.
- Croatian EUR formatting (`1.299,00 €`).
- Keep the existing visual language — dark base, magenta/violet accent, condensed
  uppercase headings, mono for data. This is a refinement pass, not a redesign.
- Every interactive element needs a visible focus state. Check contrast on anything you
  restyle.
- Verify each phase at 1440px AND 390px before committing. The mobile bug in A1 exists
  because desktop-only checking missed it.
- No new dependencies without asking.
- Don't touch Shopify admin, pricing logic, "Na upit", or USKORO.
- If a phase needs a decision I haven't covered, stop and ask instead of guessing.

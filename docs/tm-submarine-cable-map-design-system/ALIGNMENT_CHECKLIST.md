# Kit ↔ Code Alignment Checklist

Tracks every component / spec in `tm-submarine-cable-map-design-system/` against the live `subcable/src/` code. Run top-down; each item is a single confirm-or-tweak.

- ✅ done in M1–M5b
- ⚠️ open — needs a decision or a tweak
- 🔍 verify — likely already matches but worth a spot-check
- 🧊 deferred — tech-debt, parked

Recent commits ahead of origin/main: `2c74062` `26458da` `ad24e3a` `c281c08` `4b4bc28` `f7d75b1` (+6 pre-M1).

---

## 1. Layout / chrome positioning

> The Figma reference screenshot the client just shared puts Cable Info **top-right** and Cable System **bottom-right** — opposite of our current layout. This whole section is a single user decision: do we re-shuffle to match that screenshot, or stay where we are?

- ✅ **Cable Info panel position** — stacked top-of-the-right-column, above Cable System (M6 / `0a67bb0`)
- ✅ **Cable System panel position** — bottom-right with fixed 3-row scrollable grid (M6 / `0a67bb0`)
- ✅ **Language pill + Re-center button position** — moved to bottom-center; `CompassButton` renamed to `RecenterButton` (Figma label), rotated 180deg (M7)
- ✅ **Header strip** — rebuilt to match Figma `Header` layer: inset frame 2008×120 at (18,12), translucent white-gradient fill (Rectangle 50), 4 white L-bracket corners, 52px Chakra Petch Bold title, 64px Regular cable code, and the new DOM/INT film-strip chip (translucent rect + 2 tactical lines + 4 corner dots). File renamed `BottomTitlebar.tsx` → `Header.tsx` (M8).
- ✅ **KeyStatistic strip** — hidden for now (mount + import + stats useMemo removed from `GlobeScene.tsx`). `KeyStatistic.tsx` component file kept around in case we re-add it later (M9).
- ✅ RightCluster on left edge (mirror of kit, swap preserved per your call)
- ✅ AudioMute top-right (paired with our right-side Sidebar)

## 2. Atom components

- ✅ `.v1-card-bevel` — Rectangle 53 gradient lifted, 17.5px cut (`globals.css`)
- ✅ `.v1-bracket` — used in HowTo tiles
- ✅ `.v1-circle-btn` — 76×76, radial gradient, lime-glow on active
- ✅ `.v1-pill` — language toggle: 56px tall (kiosk-touch-friendly per CLAUDE.md min 48px), 4px inner gutter, brighter pill gradient, active capsule with drop shadow + inset highlight, flip-color (EN=orange, BM=blue)
- ✅ `.v1-filter-tab` — 44px, orange-active
- ✅ `.v1-btn-{primary,blue,danger,send}` — added to globals.css; verify each consumer uses the class instead of inlining (Morse keyboard mostly still inlines)
- 🔍 **`.v1-status`** (triple-ring) vs `preview/comp-status.html` — already matches per the css spot-check, but double-confirm 14×14 / 1.4px / inset 2&4
- 🔍 **`.v1-tag`** chip vs `preview/comp-tags.html` — verify 10px Rajdhani 0.18em
- 🔍 **`.v1-cablecard`** vs `preview/comp-cable-card.html` — verify 4px radius, 60min-h, 11/8/7px font ramp, clamp-2-lines
- 🔍 **`.v1-input`** vs `preview/comp-input.html` — only used in Morse pickers right now; check 48min-h, blue-fill bg, locate icon
- 🔍 **Bevel card** vs `preview/comp-bevel-card.html` — pixel-diff vs Figma if you can side-by-side

## 3. Buttons / circle buttons

- ✅ Help / Info / Morse circle cluster (76×76, lime-active)
- ✅ Compass = full reset
- 🔍 **Circle button radial-gradient bg** — kit value matches; eyeball under the lime-glow active state
- 🔍 **Morse-key buttons** (DOT / DASH / ENTER LETTER / SPACE / BACKSPACE / CLEAR / SEND) currently inline their styles inside `MorseCodePop.tsx`. Refactor to use `.v1-btn-*` classes for consistency? Cosmetic refactor; no visual change.

## 4. Panels

### Sidebar / Cable System
- ✅ Filter tabs (Show All / International / Domestic) at 44px orange-active — relocated to BOTTOM, 3-col grid (M11)
- ✅ 3×3 grid panel with bevel card — width 454px, scroll thumb (orange) on right edge (M11)
- ✅ **Title strip on TOP** — black bg, 18px Chakra Petch Bold, 4 crosshair (+) corner markers, count chips inline-right (M11 / V3 spec)
- ✅ **Cable System layout flipped** to match `screenshots/cable-system-v3.png` (title → grid → filters, was filters → grid → counts)
- ✅ **CableCard bottom row** — 3 stacked metric blocks (Length+Km / Pts+Pts / RFS-month+year) replacing the inline string (M11)

### Cable Information
- ✅ Inactive cables show DECOMMISSIONED chip
- ✅ "Send Message →" orange CTA
- 🔍 **4-col field grid** (LENGTH / BUILT / RFS / TYPE) — kit may have a different ordering or capacity field; check vs Figma
- ⚠️ **CAPACITY field** — the user's screenshot shows a `CAPACITY 8,000 Gbps` field next to BUILT. We don't currently render capacity. Check whether `CableSystem` data model has it (probably not) and decide to add it.
- ⚠️ **"Full name" label** in front of the cable name — the screenshot shows `Full name` as an eyebrow above the cable long-name. Add or skip?

## 5. Dialogs

- ✅ HowTo (3 bracket-tile layout, kit-sized typography)
- ✅ FunFact (4 fixed thumbs I/II, 16:9, orange-active border)
- ✅ MorseCodePop (light-fill message area, 2-col A–Z reference, brown backspace)
- 🔍 **MorseCodePop key buttons** — currently inline; can adopt `.v1-btn-*` (see §3)
- 🔍 **Dialog frames** all consistent? (`var(--v1-bg-deep)` bg, 18px footer title, 36×36 ✕). If we want a shared `DialogShell` wrapper, that's a small refactor.
- ⚠️ **FunFact placeholder assets** — `public/textures/funfact/placeholder-{1..4}.webp` currently 404. Either ship neutral SVG placeholders or wait for real assets.

## 6. Globe rendering

- ✅ Selected cable: red `#ED1B2E` 3px
- ✅ Unselected cables: white 1px 30%
- ✅ Atmosphere `#034DA1`
- ✅ LandingPointCallout per landing point on selected cable, with PointHUD reticle
- ⚠️ **Cable line style** — the recent screenshot shows the SKR1M line as **alternating dashes + travelling dots**. Ours is currently solid red 3px. Add a dash pattern to the path stroke? (would need a three-globe path-rendering tweak)
- ⚠️ **Landing-point marker on the globe surface** — currently a plain colored sphere (lime when active, muted when on a non-selected cable). The kit's PointHUD reticle is anchored to the bottom of each callout; the globe-surface dot is separate. Decide whether to also replace the surface dot with a reticle (probably no — too busy at world zoom).
- 🔍 **City labels** ("Penang", "Cherating", etc.) — kit screenshot shows no city labels independent of the callouts. We currently render text labels via three-globe's `labelsData`. Suppress when a cable is selected (since callouts now carry the name)?

## 7. Brand / iconography

- 🔍 `assets/icons/compass.svg` vs our inline compass SVG — close enough, but kit ships a separate SVG. Decide to switch to the asset or stay inline.
- 🔍 `assets/icons/info-i.svg` and `info-i-glyph.svg` — same call.
- ⚠️ **TM Global logo** (`assets/logo-tm-global.png`) — not used anywhere in the kiosk currently. Splash screen?  Footer credit? Decide placement.
- ⚠️ **Cable cross-section** (`assets/cable-cross-section.png`) — natural fit for FunFact thumb 1. Wire it up.
- 🔍 **All inline SVG icons** — kit prescribes 1.6 stroke, round caps, round joins. Spot-check ours.

## 8. Type / tokens / spacing

- 🔍 Verify type ramp against `preview/type-scale.html` — likely already matches via the @font-face declarations
- 🔍 Verify spacing tokens against `preview/spacing-tokens.html` (4 / 8 / 12 / 16 / 20 / 24 / 32 / 48)
- 🔍 Verify glow value (`preview/spacing-glow.html`) — we use `0 0 24px rgba(143,255,63,0.5)` for circle btn active; should match
- 🔍 Verify stroke scale (`preview/spacing-strokes.html`) — hair 0.5 / firm 1 / bold 2 alpha-white

## 9. Loading + idle

- 🔍 LoadingScreen — kit calls for solid black bg + 3×3 grid overlay + "LOADING" Rajdhani 60px 0.15em. Compare against our current `LoadingScreen.tsx`.
- 🔍 Idle attractor — kit only documents "slow rotate + global cable pulse + TAP ANYWHERE hint"; verify our `useIdleAttractor.ts` still matches

## 10. Tech-debt (pre-existing, not blocking design alignment)

- 🧊 51 ESLint `@typescript-eslint/no-explicit-any` errors (lots of `any` casts on three-globe props)
- 🧊 `resolveCallRoute()` threading with `(cableId, fromId, toId)` so the call animation respects the user's From/To picks
- 🧊 Kiosk-resolution verification at 2049×1150 per tile
- 🧊 Per-language cable description copy (currently English-only)

---

## Suggested order to chew through

1. **§1 Layout** — biggest visual delta; one user-call gates a lot of downstream work
2. **§5 FunFact assets** — easy win, swap in the real cable-cross-section image
3. **§6 Cable line dash pattern** — visual feature most visible on the screenshot
4. **§4 CAPACITY + Full-name fields** — small data-model addition
5. **§2/3/8 verify-rounds** — quick spot-checks, mostly already aligned
6. **§7 Brand assets** — logo / icons / splash decisions
7. **§9 LoadingScreen + idle** — small polish
8. **§10 tech-debt** — when product alignment is done

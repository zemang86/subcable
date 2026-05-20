# Kit ↔ Code Alignment Checklist

Tracks every component / spec in `tm-submarine-cable-map-design-system/` against the live `subcable/src/` code. Run top-down; each item is a single confirm-or-tweak.

- ✅ done in M1–M5b
- ⚠️ open — needs a decision or a tweak
- 🔍 verify — likely already matches but worth a spot-check
- 🧊 deferred — tech-debt, parked

Recent commits ahead of origin/main: M1 `2c74062` · M2 `26458da` · M3 `ad24e3a` · M4 `c281c08` · M5 `4b4bc28` · M5b `f7d75b1` · M6 `0a67bb0` · M7 `4cd8286` · M7b `babc1fa` · M8 `3718502` · M9 `6349827` · M10 `9925b41` · M11 `f1510d0` · M12 `3e5f330` · M13 `38bff1f` · M14 `0c35f64` · M15 `b3d9acc` · M16 `fd1a8df` · M17 `3721986` · M18 `79b4ee2` · M19 `45a0e0d` (+ pre-M1 history).

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
- ✅ `.v1-filter-tab` — superseded by inline FilterButton inside the Cable System panel (M18); old class still in globals.css for any future re-use
- ✅ `.v1-btn-{primary,blue,danger,send}` — added to globals.css; verify each consumer uses the class instead of inlining (Morse keyboard mostly still inlines)
- 🔍 **`.v1-status`** (triple-ring) vs `preview/comp-status.html` — already matches per the css spot-check, but double-confirm 14×14 / 1.4px / inset 2&4
- 🔍 **`.v1-tag`** chip vs `preview/comp-tags.html` — verify 10px Rajdhani 0.18em
- ✅ **`.v1-cablecard`** — rebuilt exactly per Figma `temp/cablecards-{active,notactive}.css` (M12 → M17). Solid-orange selected state replaced with translucent-white + 2px orange outline + cobalt-blue text + auto-sized subtitle divider; chip is `#D9D9D9` pill with `#0A0449` text; status indicator on top-right (lime/green concentric rings); 66px tall
- 🔍 **`.v1-input`** vs `preview/comp-input.html` — only used in Morse pickers right now; check 48min-h, blue-fill bg, locate icon
- 🔍 **Bevel card** vs `preview/comp-bevel-card.html` — pixel-diff vs Figma if you can side-by-side

## 3. Buttons / circle buttons

- ✅ Help / Info / Morse circle cluster (76×76, lime-active)
- ✅ Compass = full reset
- 🔍 **Circle button radial-gradient bg** — kit value matches; eyeball under the lime-glow active state
- 🔍 **Morse-key buttons** (DOT / DASH / ENTER LETTER / SPACE / BACKSPACE / CLEAR / SEND) currently inline their styles inside `MorseCodePop.tsx`. Refactor to use `.v1-btn-*` classes for consistency? Cosmetic refactor; no visual change.

## 4. Panels

### Sidebar / Cable System — ✅ FULLY DONE (M11 → M18)
- ✅ Filter tabs (Show All / International / Domestic) — 32px tall, **inside** the panel container, 3-col grid column-aligned with the cards above; solid-orange active + red 2px bottom strip + 3px white corner squares; minimal transparent inactive (M18)
- ✅ 3-col scrollable grid panel — width 454px, **live orange scroll bar** (thumb tracks scroll position via ref + ResizeObserver, M14)
- ✅ Panel frame — single SVG (lifted from `temp/systemcable.svg`) with 2 brackets + 2 side lines, rounded line-caps, `preserveAspectRatio="none"` so it stretches with panel size; replaces the 4 hand-rolled div bands (M18)
- ✅ Title strip — **white-translucent gradient** (matches Header), 26px Chakra Petch 600, 4 **crosshair (+)** corner markers (M11 → M15), 17px Rajdhani 500 counts with literal `#8FFF3F` / `#FF3F3F` colors and concentric-ring status indicators
- ✅ CableCard — taller (66px) with more grid gap (12px), `minmax(0,1fr)` columns prevent horizontal scroll, font sizes bumped for kiosk readability (M13)
- ✅ CableCard subtitle divider — auto-sizes to text length (border-bottom on subtitle span, wider when subtitle is long) per Figma `cablecards-{active,notactive}.css` (M16)
- ✅ CableCard selected state — explicit `background-image: none` to fully clear bevel gradient; translucent white `rgba(255,255,255,0.56)` + 2px orange border (M17)

### Cable Information — ✅ FULLY DONE (M19)
- ✅ TitleStrip "Cable Information" — 28px Chakra Petch 500, white-translucent gradient bg, 4 crosshair (+) corners (matches Cable System pattern)
- ✅ Panel body — 454×362 with bevel gradient + SVG bracket frame (top + bottom + side rails)
- ✅ Online indicator — 15px concentric-ring (lime when active, red when inactive) anchored top-right inside panel
- ✅ "Full name" eyebrow chip — small white-bordered IBM Plex Mono label above the cable long-name
- ✅ Cable long-name — Rajdhani 700, 15px, **lime `#00FF4D`** when active / **red `#FF3F3F`** when inactive
- ✅ **2×2 field chip grid** (LENGTH/BUILT, CAPACITY/RFS) — label on the left + translucent-white value cell on the right, big IBM Plex Mono 17px value + small 8px unit suffix; vertically centered with baseline-aligned subscript and auto-scale via `transform: scaleX()` when content overflows the cell
- ✅ CAPACITY field wired through — `CableSystem.capacity` already existed in the data model (10/14 cables have values, fallback `—`)
- ✅ TYPE field removed from layout (was in 4-col grid, not in Figma)
- ✅ Owners eyebrow chip + **film-strip owner chips** — gray `#D9D9D9` fill, white border, orange Rajdhani 700 text, 10×10 protruding leader square at top-left
- ✅ Description container — white-bordered with eyebrow chip overlapping the top border + 50×44 inner L-bracket icon slot
- ✅ Send Message CTA **removed**; `onOpenMorse` prop unwired from GlobeScene
- ✅ i18n: `cableInformation` / `fullName` / `capacity` keys added (EN + BM)
- ⚠️ **Inactive DECOMMISSIONED chip** — was inline next to short-code; now that the short-code is gone from inside the panel (it lives in the Header), the chip needs a new home or can be dropped. Defer until we hit an inactive-cable case in QA.

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

1. ✅ ~~§1 Layout~~ — closed
2. ✅ ~~§4 Sidebar / Cable System~~ — closed M11 → M18
3. ✅ ~~§4 Cable Information~~ — closed M19
4. **§5 FunFact assets** ← **NEXT** (easy win, swap in the real cable-cross-section image)
5. **§6 Cable line dash pattern** — visual feature most visible on the screenshot
6. **§2/3/8 verify-rounds** — quick spot-checks, mostly already aligned
7. **§7 Brand assets** — logo / icons / splash decisions
8. **§9 LoadingScreen + idle** — small polish
9. **§10 tech-debt** — when product alignment is done

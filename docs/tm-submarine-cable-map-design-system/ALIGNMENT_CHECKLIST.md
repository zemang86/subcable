# Kit ↔ Code Alignment Checklist

Tracks every component / spec in `tm-submarine-cable-map-design-system/` against the live `subcable/src/` code. Run top-down; each item is a single confirm-or-tweak.

- ✅ done in M1–M5b
- ⚠️ open — needs a decision or a tweak
- 🔍 verify — likely already matches but worth a spot-check
- 🧊 deferred — tech-debt, parked

Recent commits ahead of origin/main: M1 `2c74062` · M2 `26458da` · M3 `ad24e3a` · M4 `c281c08` · M5 `4b4bc28` · M5b `f7d75b1` · M6 `0a67bb0` · M7 `4cd8286` · M7b `babc1fa` · M8 `3718502` · M9 `6349827` · M10 `9925b41` · M11 `f1510d0` · M12 `3e5f330` · M13 `38bff1f` · M14 `0c35f64` · M15 `b3d9acc` · M16 `fd1a8df` · M17 `3721986` · M18 `79b4ee2` · M19 `45a0e0d` · M20 `af816a3` · M21 (Header) `041ccfb` · M22 (RightCluster) `801f362` · M23 (FunFact title+bg) `c5a14bb` · M24 (FunFact bracket frame) `86f89cd` · M25 (HowToGuide) `c8f710c` · M26 (Morse bevelled card + 2-row pickers) `4a4ec9c` · M27 (Morse keys gradient pills) `dea53bc` · M28 (Morse reference ribbon) `f6e4d29` · M29 (Morse `fullmorse.svg` pixel-perfect rebuild) `1b4252a` · M30 (Morse native 1× for 3×3 wall) `b2add04` · M31 (Morse in-progress buffer) `3a314d6` · M32 (Idle attractor expanded sweep + mute moved into bottom-center cluster) `8917dd3` · M33 (Tappable LandingPointCallout — expanded card + new marker SVG + expand/shrink animation) `e5b7281` (+ pre-M1 history). Now on `version2` branch (forked from `main` at `3a314d6`, pushed to `origin/version2`).

---

## 1. Layout / chrome positioning

> The Figma reference screenshot the client just shared puts Cable Info **top-right** and Cable System **bottom-right** — opposite of our current layout. This whole section is a single user decision: do we re-shuffle to match that screenshot, or stay where we are?

- ✅ **Cable Info panel position** — stacked top-of-the-right-column, above Cable System (M6 / `0a67bb0`)
- ✅ **Cable System panel position** — bottom-right with fixed 3-row scrollable grid (M6 / `0a67bb0`)
- ✅ **Language pill + Re-center button position** — moved to bottom-center; `CompassButton` renamed to `RecenterButton` (Figma label), rotated 180deg (M7)
- ✅ **Header strip** — rebuilt to match Figma `Header` layer: inset frame 2008×120 at (18,12), translucent white-gradient fill (Rectangle 50), 4 white L-bracket corners, 52px Chakra Petch Bold title, 64px Regular cable code, and the new DOM/INT film-strip chip (translucent rect + 2 tactical lines + 4 corner dots). File renamed `BottomTitlebar.tsx` → `Header.tsx` (M8).
- ✅ **Header compaction pass (M21)** — height 120 → 80, title 52 → 40 (Bahasa fits one line via `whiteSpace: nowrap`), cable code at `right:87`, DOM/INT chip at `right:24` in a 3-column layout to stop the chip overlapping the cable code, and L-bracket corners swapped for the 8×8 **crosshair `+`** convention nested inside the visible Rectangle 50 border so the markers sit on the real corner.
- ✅ **KeyStatistic strip** — hidden for now (mount + import + stats useMemo removed from `GlobeScene.tsx`). `KeyStatistic.tsx` component file kept around in case we re-add it later (M9).
- ✅ RightCluster on left edge (mirror of kit, swap preserved per your call)
- ✅ **AudioMute repositioned (M32)** — moved from top-right (paired with Sidebar) into the **bottom-center cluster**, sitting left of LanguageToggle next to RecenterButton; keeps all globally-touchable controls in one strip.

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
- ✅ **RightCluster final pass (M22)** — order top→bottom Morse / Fact / Help with **31px** gap per Figma spec; per-glyph SVGs replaced with the 3 **full-button SVGs** from `temp/button_svg/` (radar dots, info-i, ?-mark); selected state is the 116×116 **lime ring overlay** (`selected-button.svg`) rendered at `top:-20, left:-20` over the 76×76 button; **Morse no longer gated by selected cable** (button always enabled, MorseCodePop accepts `cable: CableSystem | null` with a null-guard on `cablePoints`, SEND stays disabled until From/To pickers populate).
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

### Cable Information — ✅ FULLY DONE (M19 → M20)
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
- ✅ **M20 polish round:**
  - Field chip value+unit pair vertically centered with baseline-aligned subscript; `transform: scaleX()` auto-fit when content overflows the cell (handles "10 Tbps", "November 2005", etc.)
  - FilmStripChip rebuilt from `temp/owner-cableinfocard.svg` — single continuous L-shape outline (tab + main body), gray fill on main body only, tab area transparent (panel gradient shows through), inline SVG with `vectorEffect="non-scaling-stroke"`
  - DescriptionBlock rebuilt from `temp/description.svg` — integrated SVG frame where the eyebrow chip is part of the container outline (no overlapping borders), plus chamfered top-right + bottom-left staircase + open-ended inner L-bracket; tight 64×16 box around the "Description" label inside the integrated chip area
  - Title-strip-to-panel `gap`: 24px → 6px to match Cable System spacing
- ⚠️ **Inactive DECOMMISSIONED chip** — was inline next to short-code; now that the short-code is gone from inside the panel (it lives in the Header), the chip needs a new home or can be dropped. Defer until we hit an inactive-cable case in QA.

## 5. Dialogs

- ✅ **HowTo (M25)** — title moved into a 47px TitleStrip header card with crosshair `+` corners (matches CableInformation / CableSystem pattern); bottom title strip removed; panel body now uses the **bevelled SVG card** from `temp/card-help.svg` (orange→blue gradient + white stroke + cut corners, `preserveAspectRatio="none"`) as its background, replacing the prior CSS gradient + U-bracket frame approach; 3 tiles render the `tap.png`/`pinch.png`/`swipe.png` illustrations at 100% (assets shipped to `public/textures/howto/`), with the prior CSS frame + corner markers + inline SVG icons dropped since the frame is baked into the PNGs.
- ✅ **FunFact (M23 + M24)** — title moved into a TitleStrip header card matching CableSystem/CableInformation (47px, white-translucent gradient, 4 crosshair `+` corners, 28px Chakra Petch 500, ✕ close on right); panel body now uses the orange→blue gradient from `temp/facts_bg_gradient.css`; player and thumbnail strip **swapped** (player on top, thumbs at the bottom for touch reach); 4 fixed thumbs I/II at 16:9 with orange-active border; placeholder images temporarily use `picsum.photos` seeded URLs so the layout feels populated. Panel frame is a **CSS-bordered HUD bracket frame** (top + bottom U brackets @ 50px + left/right vertical rails inset 60px), chosen over an SVG stretch so brackets stay fixed at any panel size.
- ✅ **MorseCodePop (M26 → M31)** — full rebuild on top of `temp/fullmorse.svg` (pixel-perfect chrome: bevelled card + 2-row country/location pickers + gradient key pills + orange Morse Code Guide ribbon with A–Z + 0–9 reference). Native 833×641 size at `SCALE = 1` because the 3×3 TV wall handles its own up-scaling (M30). Live overlays only for interactivity — opaque navy picker masks, transparent `<select>` tap targets, opaque grey message canvas with **in-progress buffer rendered in orange** (`.` → `·`, `-` → `−`) alongside the decoded letters so users can see what they're typing before hitting Enter Letter (M31). TitleStrip header card matches CableSystem/CableInformation pattern (47px, crosshair `+` corners). Picker wiring still binds both row cells to the same `cablePoints` slot — functionality wiring deferred to a future session.
- 🔍 **Dialog frames** all consistent? All three now use the TitleStrip-on-top pattern. MorseCodePop body is the `fullmorse.svg` pixel-asset instead of a CSS-bevelled card — different visual treatment but the **header** matches. Lifting a shared `DialogShell` (TitleStrip + body slot) remains optional cleanup.
- ⚠️ **FunFact placeholder assets** — `public/textures/funfact/` placeholder-* still pending; current build uses `picsum.photos/seed/...` URLs which require network access and aren't kiosk-safe. Either swap real cable cross-section / repeater / ship images into `public/textures/funfact/` before kiosk deploy, or ship neutral SVG placeholders.

## 6. Globe rendering

- ✅ Selected cable: red `#ED1B2E` 3px
- ✅ Unselected cables: white 1px 30%
- ✅ Atmosphere `#034DA1`
- ✅ LandingPointCallout per landing point on selected cable, with PointHUD reticle
- ✅ **PointHUD reticle rebuilt (M33)** — replaced the prior 4-arc concentric reticle with the new `temp/marker.svg` mark (white outer ring + orange inner ring + green center dot, native 79×74) rendered at `MARKER_SCALE = 0.5`. SVG container shrunk to 40×70 with the reticle near the bottom; exports `HUD_CENTER_Y`, `HUD_BOTTOM_PAD`, `MARKER_TOP` so consumers can math the anchor correctly. `hideLine` prop suppresses the inline drop line when an external stem provides it.
- ✅ **Expandable LandingPointCallout (M33)** — tap a callout to grow it into a **439w card** with: city title (`FitTitle` auto-shrinks to one line, 74 → 28px floor), country + lat/lng row, picsum thumbnail (placeholder until real per-point photos exist), `Built: DD/MM/YY` placeholder, and lorem body copy. Height is content-driven via flex column (no fixed panel height) so descriptions of any length render cleanly. Siblings dim + desaturate while one is expanded. Anchored bottom-up via `translateY(-100%)` so the **stem-then-reticle** stack terminates exactly at the globe point — negative margins close the empty top/bottom pads of `PointHUD` so the stem connects flush to the reticle without gaps. Stem is a single 2.28px vertical orange line (the prior U-bracket was scrapped in iteration). Expansion is cleared on idle, cable selection change, and full reset.
- ✅ **Expand / shrink animation (M33)** — `.v1-callout-expand` / `.v1-callout-shrink` keyframes in `globals.css` scale the panel from 0.6 → 1 (240ms ease-out on open, 200ms ease-in on close) with `transform-origin: 50% 100%` so it grows from / collapses into the stem. Internal `closing` state in `ExpandedCard` delays the actual unmount by 200ms so the shrink animation finishes before the component disappears.
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
- ✅ **Idle attractor expanded sweep (M32)** — 60s threshold (`useIdleAttractor(60_000)`) untouched, but on activation now clears `openDialog`, `selectedCable`, `selectedLandingPoint`, and `expandedPointId` in addition to enabling auto-rotate, so the attractor reveals a clean globe regardless of what state the previous user left behind. Active call animations (~25s worst case) are intentionally left alone since they self-complete inside the 60s window.

## 10. Tech-debt (pre-existing, not blocking design alignment)

- 🧊 51 ESLint `@typescript-eslint/no-explicit-any` errors (lots of `any` casts on three-globe props)
- 🧊 `resolveCallRoute()` threading with `(cableId, fromId, toId)` so the call animation respects the user's From/To picks
- 🧊 Kiosk-resolution verification at 2049×1150 per tile
- 🧊 Per-language cable description copy (currently English-only)

---

## Suggested order to chew through

1. ✅ ~~§1 Layout~~ — closed (+ M21 Header compaction, M32 AudioMute relocation)
2. ✅ ~~§4 Sidebar / Cable System~~ — closed M11 → M18
3. ✅ ~~§4 Cable Information~~ — closed M19 → M20
4. ✅ ~~§3 RightCluster~~ — closed M22 (full-SVG buttons + lime-ring overlay + Morse always-on)
5. ✅ ~~§5 FunFact + HowTo dialog shells~~ — closed M23 → M25 (TitleStrip-on-top + framed body)
6. ✅ ~~§5 MorseCodePop pixel-perfect rebuild~~ — closed M26 → M31 (`fullmorse.svg` chrome, native 1× for 3×3 wall, live in-progress buffer)
7. ✅ ~~§6 LandingPointCallout + new PointHUD reticle~~ — closed M33 (tap-to-expand, expand/shrink animation, marker SVG, idle sweep)
8. **§5 FunFact assets** ← **NEXT** — swap `picsum.photos` URLs for real cable cross-section / repeater / ship images in `public/textures/funfact/` before kiosk deploy. Same goes for the new LandingPointCallout expanded-card thumbnail (also picsum-seeded right now).
9. **§5 Morse functionality wiring** — pickers currently both bind to the same `cablePoints` slot in MorseCodePop; wire From/To independently and thread `(cableId, fromId, toId)` into `resolveCallRoute()` so the call animation respects the user's picks.
10. **§6 Cable line dash pattern** — visual feature most visible on the screenshot
11. **§2/3/8 verify-rounds** — quick spot-checks, mostly already aligned
12. **§7 Brand assets** — logo / icons / splash decisions
13. **§9 LoadingScreen** — small polish (idle attractor itself is now closed in M32)
14. **§10 tech-debt** — when product alignment is done

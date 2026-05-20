# TM Submarine Cable Map · Design System

Design system for the **TM Global Submarine Cable Map** — a 3×3 TV-wall touchscreen kiosk built for visiting clients of Telekom Malaysia. The kiosk renders an interactive 3D globe with TM's submarine cable systems and supporting dialogs (How To, Fun Fact, Morse Code Message).

This package mirrors the v1.0 tactical-HUD design language confirmed by the client and is the source of truth for both **production code** at `subcable/` and any new artifacts (decks, mocks, marketing). Hand it to Claude Code (or any agent) to keep visual output on-brand.

---

## Index

- **`README.md`** — this file. Brand overview + content + visual + iconography fundamentals.
- **`SKILL.md`** — Agent Skill manifest. Use this to invoke the system inside Claude Code.
- **`colors_and_type.css`** — all design tokens (colors, typography, spacing, radii, strokes) as CSS custom properties + the atomic utility classes (`tm-card-bevel`, `tm-bracket`, `tm-status`, etc).
- **`fonts/`** — local TTFs (Chakra Petch · Rajdhani · IBM Plex Mono · B612 Mono). Space Mono is loaded from Google Fonts.
- **`assets/`** — TM Global logo, the cable cross-section image, and the core inline-SVG icon set.
- **`preview/`** — the 34 HTML cards rendered in the Design System tab (type, colors, spacing, components, brand).
- **`ui_kits/kiosk/`** — high-fidelity, click-thru recreation of the kiosk shell + dialogs.

## Sources

| Source | Where it lives |
|---|---|
| Figma file | `Submarine Cable UI UX.fig` — concept page **`UI UI Concept V1.3`** is the canonical design |
| Codebase | Local: `subcable/` (Next.js 16 + React 19 + Tailwind v4 + react-globe.gl + Electron) |
| Production handoff | `subcable/docs/design_handoff_subcable_v1/` — `tokens-v1.json`, `styles-v1.css`, `*.html` references |
| GitHub | `https://github.com/zemang86/subcable` |
| Live web | `https://subcable.vercel.app` |
| Hardware | Large multitouch kiosk with LiDAR overlay; 3×3 wall composite at **6147 × 3450** (2049 × 1150 per tile) |

The Figma's `Wireframe-1`, `UI-UI-Concept-V1.0/V1.1/V1.2` pages are earlier iterations — **always defer to V1.3** if they disagree. `First-Draft` and `Fina-Design` pages were empty.

## Verdict — does current code match the Figma?

Yes, very closely. After auditing `subcable/src/app/globals.css`, `subcable/src/lib/colors.ts`, and all `subcable/src/components/*.tsx` against `/Wireframe/UI-UI-Concept-V1.3/`, every token in this system is already mirrored in the production code under a parallel `v1-*` namespace (we use `tm-*` here so the kit drops into any codebase, not just `subcable/`). The drift items still worth a pass for Claude Code:

- `subcable/src/components/Sidebar.tsx` positions the sidebar at `right: 32` — Figma V1.3 puts the Cable System panel on the **left**, with the globe centered. Confirm intent.
- `KeyStatistic` is rendered top-right in the production code (`GlobeScene.tsx`); V1.3 also shows them top-right of the body — match the kiosk frame.
- The Figma globe is a stylized vector sphere with hand-drawn coastlines; the production globe is `react-globe.gl` with NASA textures. This was flagged as Open Q §H.1 in the prior handoff.

---

## Product context

The kiosk is a **physical exhibit**, not a web app. People walk up at a TM event, tap a cable to inspect it, optionally play a Morse-code message that animates along the cable's route. There is no login, no analytics, no data fetch — everything ships in `src/data/`. There is exactly **one** product: this kiosk.

Cable inventory rendered:

- **International (active)**: SMW4, SMW5, BBG, AAG, APCN-2, Cahaya Malaysia, BDM, DMCS, MCT, NuGate, SAT3/WASC/SAFE
- **IRU (international)**: FLAG, FLAG Atlantic 1
- **Domestic (active)**: BPS, Langkawi–Perlis, SKR1M, Stingray (Pangkor/Tioman/Perhentian), Stingray II (Ketam/Redang)
- **Domestic (inactive)**: MDSCS
- **Planned**: SMW6, ALC, AUG East, CANDLE

---

## CONTENT FUNDAMENTALS

### Tone
- **Technical, factual, declarative.** This is a museum-piece for a telco showcasing real engineering. No marketing fluff, no emoji, no exclamation marks.
- **"Cable system" not "fiber product"**. Use the industry term every time. The audience are clients, engineers, and visiting dignitaries — assume they know what RFS means.
- **No second person.** The UI is signage, not a chat. Imperative for actions ("Tap a cable", "Send Message") and noun phrases for state ("21 Active", "1,300 km").
- **Bilingual.** Every visible string ships in **English and Bahasa Malaysia**. The language toggle is top-centre. No third language. Cable names are not translated (e.g. "Sistem Kabel Rakyat 1Malaysia" stays as-is in both modes).

### Casing
- **ALL CAPS** for: tab labels, field labels (LENGTH / BUILT / RFS / TYPE), eyebrows, button text, type chips (INT / DOM), status pills (DECOMMISSIONED). Tracking always `0.15em`–`0.20em`.
- **Title Case** for: page titlebars, panel headers ("Cable System", "General Information", "Key Statistic"), card titles in dialogs.
- **Mixed case** for: body copy, descriptions, region names in callouts ("Sarawak · Malaysia").
- **Cable codes** stay as authored: `SMW4` (not `Smw4`), `SKR1M`, `Stingray II (Ketam)`.

### Vibe
- A **mission-control HUD** — tactical, mil-spec, instrument-panel. Less "consumer app", more "submarine bridge". The visual cues (bracket frames, bevelled cut corners, triple-ring status, monospace coords) all reinforce this.
- Numbers are loud — orange-hot `#FF4D00` in B612 Mono at 32px+ for stats. They draw the eye before any prose does.

### Examples
- ✅ "1.3M — km of cable on seafloor"
- ✅ "21 Active · 1 Inactive"
- ✅ "Tap a cable in the side panel to inspect it."
- ✅ "Y-branch system across the Gulf of Thailand. The first cable to land in Cambodia."
- ❌ "Hey! Ready to explore? 🌊"
- ❌ "Discover our amazing cable network!"
- ❌ "Click here to learn more"

### Copy slots in the UI
- **Splash**: "Brought to you by **TM Global** — Submarine Cable Map"
- **Loading**: literally just `LOADING`
- **Filter tabs**: SHOW ALL · INTERNATIONAL · DOMESTIC
- **Count strip**: `21 Active · 1 Inactive`
- **Right cluster aria-labels**: How to use · Fun fact · Reset view
- **Morse placeholder**: "Tap Dots & Dashes to Begin" (mute-dark on light fill)
- **Morse send button**: `SEND MESSAGE` (white bg, blue text — only inverted button in the whole UI)

---

## VISUAL FOUNDATIONS

### Surface & atmosphere
- Page background is **near-black navy `#040E1F`** — colder than pure black, just enough hue to feel oceanic. Never use `#000000` for surfaces; reserve true black for the bottom-titlebar gradient endpoint.
- A **3×3 TV-wall grid overlay** (`tm-tv-grid` — 4%-white hairlines at thirds) sits on top of the bg at 15–38% opacity. It's not decorative — it tracks the literal physical seams of the 3×3 LCD wall.
- Alt panels (`#061630`) and cobalt accents (`#0A0449`) appear inside dialogs and deep-zoom callouts.

### Color
- **Two-tone brand**: TM blue `#034DA1` (calm/atmosphere) + TM orange `#F05A22` (action/accent). Orange is the only colour that ever fills a "you can tap this" surface. Blue is the bed; orange is the lure.
- **Lime/red dual-state status** is the major v1.0 evolution: `#8FFF3F` for active + `#FF3F3F`/`#ED1B2E` for inactive, each with a darker middle-ring `#3F642E`/`#642E2E`. This is unique to this system — most kiosks use grey for "inactive"; we make it screaming red.
- **Selected cable on the globe is always uniform red** `#ED1B2E` 3px. Per-cable `CABLE_COLORS` only show up in side-panel chips. Don't add new cable colors to the globe.
- Gradient usage is **limited and intentional**: only in the bevel cards (`tm-blue → transparent` overlaid by `tm-orange 60% → transparent`) and the bottom-titlebar (`transparent → black`). Never a free-flowing rainbow or purple/blue brand gradient.

### Typography
- 5 families, each with a fixed job — don't reach for a new one:
  - **Chakra Petch** (Bold) — page banners, 56–88px. The only time you see "large" type. Letter-spacing `0.02–0.04em`.
  - **Rajdhani** (400/500/600) — every UI label, button, eyebrow, panel heading. 10–24px. Uppercase + `0.15–0.20em` tracking for labels; sentence case for panel titles.
  - **IBM Plex Mono** (400) — all body copy, descriptions, captions. 9–13px. Line-height `1.5–1.6`.
  - **B612 Mono** (400, tabular) — big stat numbers in `tm-h-stat`. 28–44px. Always orange-hot `#FF4D00`.
  - **Space Mono** (400) — tactical text: lat/lng, point coords, tiny `INT/DOM` chips. 7–10px.
- No serifs, no humanist sans, no Inter. The whole stack is geometric or monospaced on purpose — it reads as instrument-panel.

### Spacing
- Token scale: **4 / 8 / 12 / 16 / 20 / 24 / 32 / 48** (multiples of 4). Card padding is `18–22px`; dialog padding is `20–28px`; section gaps are `24–32px`.
- 44px minimum touch target, 48px preferred (LiDAR multitouch on a 65"+ screen).

### Backgrounds
- **No imagery** behind UI surfaces — the page bg is solid navy + the TV-grid. The only places photos/video appear are the Fun Fact dialog (16:9 video tiles) and the splash logo.
- **No textures or grain**. Flat & engineered.

### Borders & strokes
- **Hair** `0.5px solid rgba(255,255,255,0.5)` — cable-card outlines.
- **Firm** `1px solid rgba(255,255,255,0.5)` — panel borders, inputs.
- **Bold** `2px solid rgba(255,255,255,0.7)` — right-cluster circular buttons.
- All strokes are white at varying alpha. **Never** a coloured border (except the active orange ring on the morse "ENTER LETTER" or the active glow on right-cluster buttons).

### Corners
- Default radius is **0** (tactical, hard-edged). Cable mini-cards get `4px`. The language pill is the only `9999px` pill in the system. Bevelled cards use a **16px clip-path corner-cut** instead of rounding — this is the system's signature shape.

### Bracket frames
- The other signature shape: 4 small L-shaped corner ticks (12 × 12 with 1px border legs) framing a card without filling it. Used in **How To** tiles and any reference card that should feel "marked off" rather than enclosed.

### Shadows / glow
- **No outer-shadow drop-shadows.** The system is flat.
- **Glow** is reserved for active state: `0 0 24px rgba(143,255,63,0.5)` on the right-cluster button's outer ring when its dialog is open. Lime green only. (Inactive uses red but no glow.)
- Bottom-titlebar uses a `transparent → rgba(0,0,0,0.9) → #000` linear gradient that acts as a protection-mask over the globe — never a capsule.

### Hover & press states
- **Hover is not a primary interaction** — the kiosk is touch-only. We still apply subtle changes for desktop preview:
  - Filter tabs / cable cards: 120ms `background` transition; selected = orange fill.
  - Circle buttons: 200ms `all` transition; active = lime border + lime glow.
- **Press / down**: opacity goes to `0.85` very briefly. No scale, no shadow.
- **Disabled**: opacity `0.35–0.4`, cursor `not-allowed`.

### Animation
- Two animations exist:
  - `tm-pulse` — 1.5s ease-in-out infinite — status indicators and active landing rings (opacity 1 → 0.55, scale 1 → 0.85).
  - Cable "call" pulse — a 3px red dot that travels along a cable's polyline when a Morse message is sent (handled by `GlobeScene.tsx`, not the kit).
- No bounces, no overshoot, no spring physics. **No page-transition animations.** The kiosk should always feel instantaneous.

### Transparency & blur
- **No `backdrop-blur`** anywhere. The earlier v0.1 design was glassmorphic; v1.0 deliberately dropped it because LiDAR refresh ghosts looked bad under blur.
- Alpha is used freely (4–95%) but every alpha layer sits on the solid navy bg, not on each other.

### Layout rules
- **All interactive chrome is in the bottom half** of the wall composite. The upper half is out of physical reach above a person's head — anything there is decorative or labels-only.
- **Sidebar / Cable System panel**: top-left, width `460px`, sticky.
- **Cable Information**: bottom-left when a cable is selected, width `~580px`.
- **Right cluster**: vertically centered on the right edge, three 64×64 circles stacked.
- **Bottom titlebar**: full-width, 110px+ tall, page title left + cable code right.
- **Key Statistic strip**: top-right area, three 194×66 bevel cards in a row.

### Imagery
- When photos appear (Fun Fact dialog), they live inside the kiosk's bracket-framed tiles. **Warm cool palette** — preferred photos lean teal/blue with orange highlights to keep continuity with the UI palette. No people's faces, no marketing-stock shots. Documentary-style.

---

## ICONOGRAPHY

- **Inline SVGs**, hand-rolled. Stroke `1.6` · `stroke-linecap: round` · `stroke-linejoin: round`. White by default, lime when active.
- Sized in three buckets: **18–22px** inline with text, **26–28px** inside circular buttons, **40–46px** inside How-To bracket tiles.
- **No icon font.** No icon library is bundled in production (`subcable/src/components/*.tsx` ships the SVG paths inline). If you need a glyph the kit doesn't have, match the same stroke aesthetic — **lucide-react** is the nearest match on CDN. If you substitute from lucide, document the swap in code comments.
- **No emoji.** The kiosk is exhibited internationally and the client is a state-linked telco — keep emoji out of all kiosk copy. (Comments / commits internally are fine.)
- **Unicode glyphs used as icons**: `·` (dot), `—` (dash), `↵` (enter), `␣` (space), `⌫` (backspace), `✕` (close), `→` (CTA arrow). All other "icons" are SVG.

Icons in `assets/icons/`:

- `compass.svg` — top-centre "locate / reset" button (copied from Figma)
- `info-i.svg` — info marker over landing points
- `status-ring-active.svg` — the static lime outer ring (we render the rest in CSS)

Icons rendered inline in JSX components: zoom, swipe, tap-finger, power, reset (concentric circles), help (?), info (i), audio mute, audio on, close, search.

---

## Open questions still on the table for Claude Code

These survived from the prior `docs/design_handoff_subcable_v1/README.md` and remain unresolved:

1. **Globe pipeline** — keep three-globe.gl, or migrate to the Figma's stylized vector sphere?
2. **Cable System overflow** — what happens at >9 cables? Currently the production code scrolls; Figma shows a fixed 3×3.
3. **Language scope** — UI strings only, or also cable names?
4. **Compass action** — reset to default view, or center on Malaysia?
5. **Fun Fact content** — client needs to provide real images/video.
6. **Inactive cable tap behaviour** — disabled tap, or show "decommissioned" info?
7. **Idle attractor / splash** — needed for the kiosk? (production has `useIdleAttractor.ts`.)

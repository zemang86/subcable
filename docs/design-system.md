# TM Submarine Cable Network — Design System

> Reference doc for the **TM Global Submarine Cable Network (SCN)** kiosk POC. Snapshot of the current implementation as a starting point for design iteration. Hand off to creative for Figma refinement; tokens here mirror what's live in code so changes round-trip cleanly.

---

## 1. Product context

| Field | Value |
|---|---|
| Product | TM Global Submarine Cable Network — interactive 3D globe visualisation |
| Brand owner | Telekom Malaysia (TM Global) |
| Deployment | 3 × 3 TV wall (16:9 tiles → tall composite, ~Full HD scaling per tile), LiDAR touch overlay, Electron kiosk |
| Stack | Next.js 16 · React 19 · Tailwind v4 · react-globe.gl · Three.js |
| Audience | Visiting clients, partners, internal stakeholders |
| Core narrative | TM's submarine cable systems carry signals across the Asia-Pacific. The "Make a Call" demo embodies it — a morse message travels Malaysia → Japan along a real APCN-2 polyline. |

### Kiosk constraint that shapes the layout

The 3 × 3 wall is **tall**. The upper half is hard to reach by hand. **All interactive chrome must live in the lower half.** Top header is decorative branding only — never an action target.

---

## 2. Brand foundation

### Colour palette (TM Global)

#### Core surface

| Token | Hex | Usage |
|---|---|---|
| `--tm-dark` | `#06013A` | Page background, panel base, modal background |
| `--tm-navy` | `#180092` | Deep accent, used sparingly |
| `--tm-cobalt` | `#1800E7` | **Primary brand colour.** Borders, primary buttons, selection, highlights |
| `--tm-accent-orange` | `#FF5E00` | **Single accent colour.** CTAs (Make a Call, Send), call animation pulse, planned-cable status, alerts, "DELIVERED" |
| `--foreground` | `#F5F5F5` | Default body text on dark surfaces |

#### Secondary text & utility

| Token | Hex | Usage |
|---|---|---|
| `text-mute` | `#A8B0D6` | Secondary text, labels, caption rows |
| `text-mute-soft` | `rgba(168, 176, 214, 0.5)` | Placeholder text, disabled labels |

#### Cable status colours (data layer, not UI chrome)

| Status | Colour | Meaning |
|---|---|---|
| Active | `CABLE_COLORS[id]` (per-cable, generated from `src/lib/colors.ts`) | Live cable systems, full saturation |
| Planned / In development | `#FF5E00` | Future systems |
| Legacy / Inactive | `#94A3B8` (slate-400) | Decommissioned |
| Muted (when another cable selected) | `rgba(30,40,60,0.35)` light · `rgba(100,100,100,0.3)` dark | Non-selected cables fade back |

#### Glass / surface opacity scale

The product leans heavily on **dark glass panels with cobalt borders**. Three opacity steps:

| Layer | Background | Border | Where |
|---|---|---|---|
| L1 — base panels | `bg-[#06013A]/95` + `backdrop-blur-xl` | `border-[#1800E7]/40` | Sidebar, modals, primary surfaces |
| L2 — header / floating | `bg-[#06013A]/85` + `backdrop-blur-md` | `border-[#1800E7]/40` | Header gradient, altitude HUD, footer strips |
| L3 — nested controls | `bg-[#06013A]/60` | `border-[#1800E7]/30` | Sub-panels, inputs, settings menu items |
| L4 — neutral chips | `bg-white/5` | `border-[#1800E7]/30` (or transparent) | Reference chart rows, inactive tabs, disabled buttons |

Active / pressed states use `active:bg-white/10` (or `active:bg-[#1800E7]/50` for primary).

### Two themes for the globe canvas

The Mono basemap supports **dark** (default) and **light** variants. UI chrome stays cobalt-on-dark in both — the theme toggle only repaints the *globe sphere* itself, not the surrounding chrome.

| Theme | Globe sea | Globe land | Country stroke |
|---|---|---|---|
| `dark` (default) | `#0B1322` | `#152033` | `rgba(150, 165, 200, 0.30)` |
| `light` | `#C9D7E8` | `#FAF6EB` | `rgba(60, 70, 95, 0.45)` |

---

## 3. Typography

### Type families

| Family | Role | Source |
|---|---|---|
| **HK Grotesk Wide** | Display (headings, labels, button text, all caps) | Self-hosted OTF in `/public/fonts/`. Weights: 400, 500, 700, 800, 900 |
| **Roboto** | Body, captions, paragraph text | Google Fonts, weights 300-700 |

CSS classes:
- `font-display` → HK Grotesk Wide
- Default body → Roboto

### Type scale (current usage)

| Role | Size | Weight | Tracking | Class |
|---|---|---|---|---|
| Brand chip ("TM GLOBAL") | 10px / 20px | 900 / 700 | `tracking-tight` / `tracking-[0.2em]` | `font-display font-black` |
| Page H1 ("SUBMARINE CABLE NETWORK") | 16px (`text-base`) | 700 | `tracking-[0.18em]` UPPERCASE | `font-display font-bold` |
| Section H2 ("MAKE A CALL", "HOW TO USE SCN") | 14-24px | 700-900 | `tracking-[0.15-0.2em]` UPPERCASE | `font-display font-bold` |
| Stat number | 14px | 700 tabular-nums | — | `font-display font-bold tabular-nums` |
| Section label | 9-10px | 700 | `tracking-[0.2-0.3em]` UPPERCASE | `font-display font-bold` |
| Body / message | 11-13px | 300-500 | normal | Roboto |
| Caption / hint | 9-11px | 400-500 | `tracking-wider` | mute colour |
| Mono (morse buffer, codes) | 10-16px | normal | `tracking-widest` | `font-mono` |

**Tone:** Headings and labels are **UPPERCASE with letter-spacing**. Body copy is sentence case. Use `tabular-nums` for any numeric stat that animates or counts so the layout doesn't jitter.

---

## 4. Spacing, sizing & layout grid

### Spacing scale

The product uses standard Tailwind spacing (`gap-1` through `gap-8`). Most-used:

| Token | px | Where |
|---|---|---|
| `gap-1` / `space-1` | 4px | Filter tab gaps |
| `gap-2` / `p-2` | 8px | Keyboard buttons, chip rows |
| `gap-3` / `p-3` | 12px | Card padding, inline gaps |
| `gap-4` / `p-4` | 16px | Modal body padding, group spacing |
| `px-5 py-3` | 20/12px | Sidebar header strip |
| `gap-6` / `p-6` | 24px | Modal padding (centred dialogs) |
| `bottom-6 left-6` etc | 24px | Standard floating-chrome inset from screen edge |

### Border radius

| Token | Value | Where |
|---|---|---|
| `rounded` | 4px | Stat cards, small chips, filter tabs |
| `rounded-md` | 6px | Settings menu items |
| `rounded-lg` | 8px | Inputs, secondary buttons, tile buttons |
| `rounded-xl` | 12px | Reference chart, message preview, primary CTA, keyboard button |
| `rounded-2xl` | 16px | Floating modal containers (Sidebar dock, CallDialog) |
| `rounded-full` | pill | Status badges, brand chip, close buttons |

### Shadows (single-step elevation system)

| Token | Where |
|---|---|
| `shadow-[0_4px_24px_rgba(255,94,0,0.35)]` | MAKE A CALL primary CTA (orange glow) |
| `shadow-[0_8px_40px_rgba(0,0,0,0.5)]` | Sidebar floating modal |
| `shadow-[0_8px_60px_rgba(0,0,0,0.6)]` | Centred dialogs (CallDialog, InfoModal) |
| `shadow-[0_4px_24px_rgba(255,94,0,0.5)]` | DELIVERED status badge |

### Touch-target floor

Kiosk + LiDAR overlay = imprecise. **Minimums:**

- Inputs: `min-h-[44px]`
- Filter tabs / icon buttons: `min-h-[36px]` (acceptable for short rows)
- Primary keyboard buttons: `min-h-[68-88px]`
- Spec floor: **48 px touch target wherever possible.** Only go smaller for non-critical controls.

### Layout zones (kiosk grid)

```
┌─────────────────────────────────────────────────────┐
│  HEADER STRIP (decorative — TM logo + stat cards)   │  ← out of reach, OK
├─────────────────────────────────────────────────────┤
│                                                     │
│                                                     │
│              GLOBE CANVAS                           │
│              (full bleed)                           │
│                                                     │
│                                                     │
├─────────────────────────────────────────────────────┤
│  ┌──────────────┐                ┌────────────────┐ │
│  │              │                │                │ │
│  │   CALL       │                │   SIDEBAR      │ │
│  │   DIALOG     │                │   MODAL        │ │
│  │  (when open) │  ┌───────────┐ │   (always)     │ │
│  │              │  │ INFO·SET  │ │                │ │
│  │              │  └───────────┘ │                │ │
│  └──────────────┘                └────────────────┘ │
│  ↑ MAKE A CALL btn (when no call) ↑ INFO·SETTINGS  │
└─────────────────────────────────────────────────────┘
            BOTTOM HALF — all interactive chrome
```

---

## 5. Components

### 5.1 Top header bar (decorative)

`fixed top-0` · gradient fade `from-[#06013A]/95 via-[#06013A]/70 to-transparent` · `backdrop-blur-sm`

Contents (left → right):
- TM brand chip (`bg-white` rounded badge, `TM` cobalt + `GLOBAL` dark)
- Vertical divider (`h-8 w-px bg-[#1800E7]/30`)
- Title block — H1 + subtitle
- Right cluster — 4 **stat cards** (INTL · DOMESTIC · PLANNED · LANDING POINTS)

Stat card:
```
[label 10px tracking-wider mute]   [value 14px font-display bold tabular-nums]
```
`px-3 py-1.5 bg-[#06013A]/80 border-[#1800E7]/40 rounded`. PLANNED uses orange accent on the value.

### 5.2 Floating sidebar modal

`fixed bottom-6 right-6 w-[380px] h-[66vh] rounded-2xl` — L1 surface.

Three vertical sections (top → bottom):

1. **Header strip** — title ("CABLE SYSTEMS") + active count summary with pulsing orange dot
2. **Scroll body** — cable list grouped by status (ACTIVE / PLANNED·IN DEVELOPMENT / LEGACY·INACTIVE) OR `CableDetailPanel` when a cable is selected
3. **Footer strip** — search input + 5-tab filter row (`ALL · INTL · DOM · IRU · NEW`)

**Section divider** pattern (between status groups in the list):
```
─── ACTIVE · 12 ───
```
9px tracking-wider label flanked by hairlines tinted to the section accent.

### 5.3 CableCard

L4 chip with a left-edge colour bar matching `cable.color`, name + short name, status badges, distance/RFS metadata.

### 5.4 CableDetailPanel

Replaces the cable list when a cable is selected. Includes route summary, owners, landing points, full description, close button.

### 5.5 Bottom-right control cluster

`fixed bottom-6 right-[420px]` — sits to the LEFT of the sidebar modal. Two icon buttons in a row:

- **(?)** Info — opens InfoModal
- **⚙** Settings — opens dropdown menu (ROTATE toggle · STYLE cycle · DARK/LIGHT toggle)

Each: `w-12 h-12 rounded-lg` L1 surface, mute icon stroke.

### 5.6 Settings dropdown

Anchored above the gear button (`bottom-14 right-0`). Vertical stack of L3 surface menu items:

- **Toggle row** (e.g. ROTATE, DARK/LIGHT) — pill toggle on the left, label on the right
- **Cycle row** (STYLE) — label left, current value in orange right

Pill toggle:
- Off: `bg-[#0B0750]` (dark navy track) + `bg-[#A8B0D6]` mute thumb
- On: `bg-[#1800E7]` (cobalt track) + white thumb

### 5.7 MAKE A CALL button (primary CTA)

`fixed bottom-6 left-6` · `bg-[#FF5E00]` · `rounded-xl` · orange glow shadow.

Anatomy: phone-receiver icon in a circular `bg-white/20` halo · two-line label (eyebrow "DEMO" / heading "MAKE A CALL"). When a call is in progress, eyebrow becomes "CALLING…" and button is disabled (50% opacity).

### 5.8 CallDialog (docked panel)

`fixed bottom-6 left-6 w-[640px] max-h-[calc(100vh-3rem)] rounded-2xl` — L1 surface. **No backdrop overlay** — the globe stays visible behind. Two columns:

- **Left (1fr):** From → To header · message preview · 5-button morse keyboard · Clear + Send row
- **Right (180px):** Morse code reference chart, scrollable A–Z + 0–9 grid

**Morse keyboard** — 5 buttons in two rows:

| Row 1 (primary) | Row 2 (secondary) |
|---|---|
| `· DOT` (cobalt) | `↵ LETTER` (orange-tinted) |
| `— DASH` (cobalt) | `␣ SPACE` (neutral) |
|                 | `⌫ BACKSPACE` (neutral) |

Each button: `min-h-[68px] rounded-xl` with big symbol (24px font-display bold) on top + 9px hint label underneath. Active state: `active:scale-[0.98]` + colour darken.

**Send button:** primary orange, full-width within its row, `rounded-lg` · `min-h-[44px]` · "SEND MESSAGE →".

### 5.9 InfoModal (centred)

`fixed inset-0 bg-black/70 backdrop-blur-sm` overlay · centred card `max-w-[820px]` · L1 surface.

Anatomy:
- Title eyebrow + H2 "HOW TO USE SCN"
- Three equal Tile cards: **Tap to interact** · **Zoom in and out** · **Swipe**
- CLOSE primary button at bottom

Tile card: `rounded-xl bg-white/5 border-[#1800E7]/30 p-5` · centred · orange icon (40 px stroked SVG) + bold label + 11 px caption.

### 5.10 Altitude HUD

`fixed top-[88px] right-6` · L2 surface · single row:
```
ALTITUDE   12,847 km   ▰▰▰▰▰▰▱▱▱▱
```
Progress bar: `bg-[#FF5E00]` fill, log-scaled across the camera altitude range.

### 5.11 LoadingScreen

Full-viewport `z-50` overlay with TM logo, spinner, brand chevron corners. Cobalt on dark.

### 5.12 Status badges (call animation)

Centred `top-[40%]` pill (`rounded-full px-6 py-3` L1 surface). State-coloured border + label:

| Phase | Border | Text | Effect |
|---|---|---|---|
| `DIALING…` | `border-[#FF5E00]/60` | orange | `animate-pulse` |
| `ESTABLISHING LINK…` | `border-[#1800E7]/60` | white | static |
| `TRANSMITTING` | `bg-[#1800E7]/80` | white | static |
| `DELIVERED` | `bg-[#FF5E00]/90` | white | static, orange shadow |

### 5.13 Floating message label (during call travel)

Screen-projected from the moving 3D pulse position (`globeRef.current.camera()` projection).

```
        ┌────────────┐
        │  HI WORLD  │   ← orange pill, message text
        └────────────┘
              │           ← 12 px gradient drop line
              ▼
              ●           ← bright orange pulse on globe
```

`bg-[#FF5E00]` · `rounded-lg` · `px-4 py-2` · `font-display font-bold tracking-[0.2em]` · orange glow shadow. Drop line: `w-px h-12 bg-gradient-to-b from-[#FF5E00] to-transparent`.

---

## 6. Iconography

- **Style:** stroked SVG, `strokeWidth="1.6-1.8"`, `strokeLinecap="round"`, `strokeLinejoin="round"`
- **Sizes:** `w-4 h-4` (16 px) inside circular halos · `w-5 h-5` (20 px) chrome buttons · `w-10 h-10` (40 px) info-modal tile icons
- **Colour:** mute (`text-[#A8B0D6]`) for chrome · orange (`text-[#FF5E00]`) for accents · white in primary CTAs
- **Library:** hand-rolled inline (no icon dep). Replace with Lucide / Heroicons in Figma if standardising — keep stroke-based aesthetic

Icons currently in use: gear, question-mark-in-circle, phone receiver, magnifier with plus, swipe-arrows, hand-tap, back arrow, close ✕, return key, space, backspace.

---

## 7. Motion

| Pattern | Duration | Easing | Where |
|---|---|---|---|
| Camera pan / zoom (`pointOfView`) | 1500ms | three-globe default | Cable selection, return to world view |
| Camera pan (call build-up → start) | 2200ms | three-globe default | Connect + intro phases combined |
| Camera follow (call travel) | per-frame lerp · alpha 0.06 | linear | Pulse chasing |
| Toggle pill thumb | 300ms | `transition-all` (Tailwind default ease) | Settings toggles |
| Tab/colour active state | 0ms (instant) + `active:scale-[0.98]` | — | Buttons, tabs |
| Modal entrance | (currently none — instant mount) | — | Open animation pending |
| Status badge appear | 0ms + `animate-pulse` for DIALING | Tailwind built-in | Call phases |
| Halo opacity pulse (during travel) | 240ms sine | `Math.sin(elapsed/120)` | Pulse halo |

**Ask for design:** Add formal modal entrance/exit animation (suggest: `slide-in-from-bottom` 240 ms, `cubic-bezier(0.32, 0.72, 0, 1)`).

---

## 8. Audio

The morse demo is **audio-first**. Document because Figma can't render it but design must respect it.

| Sound | Frequency | Duration | When |
|---|---|---|---|
| Dot tap | 650 Hz sine | 80 ms | Tap DOT key |
| Dash tap | 650 Hz sine | 240 ms | Tap DASH key |
| Letter commit click | 440 Hz square | 50 ms | Tap LETTER |
| Space click | 330 Hz square | 50 ms | Tap SPACE |
| Backspace click | 180 Hz square | 50 ms | Tap BACKSPACE |
| Dialing pips | 880 → 520 Hz sine, 5 descending | 5 × 110 ms with 120 ms gaps | Send pressed, phase 1 |
| Connect tone | 420 → 820 Hz rising sine | 900 ms | Phase 2 |
| Message playback | 650 Hz sine, full morse encoding | scaled to fit travel duration (~14 s) | Phase 4 (with the pulse) |

All audio uses Web Audio API with attack/release ramps to avoid clicks. AudioContext is lazily created on first user gesture (browser autoplay policy).

---

## 9. States, voice, and copy

### State styling

| State | Treatment |
|---|---|
| **Default** | L1-L4 surfaces as documented above |
| **Selected** (cable, tab) | Cobalt border + cobalt-tinted background (`bg-[#1800E7]` for tabs, accent border for cards) |
| **Muted** (other cables when one is selected) | 35% opacity grey-blue |
| **Disabled** | `disabled:opacity-40-50` · darker bg if primary |
| **Active / pressed** | `active:bg-white/10` for chrome · `active:bg-[#1800E7]/50` for cobalt primary · `active:bg-[#E65500]` for orange CTA · `active:scale-[0.98]` on big buttons |
| **In progress** (e.g., call) | Orange tint + animated pulse if waiting |
| **Hover** | **Avoid hover-only states** — kiosk has no hover layer. Touch device. |

### Copy tone

- ALL CAPS short labels (`ACTIVE · 12`, `MAKE A CALL`, `DELIVERED`)
- Sentence case for body and onboarding ("Tap the screen to interact with buttons…")
- Use the en-dash `→` between locations (`Malaysia → Japan`), not arrows or colons
- Use `·` (middle dot) for stat separators (`12 ACTIVE · 3 PLANNED · 38 TOTAL`)
- Avoid jargon in user-facing strings; "submarine cable" preferred over "SCN" except in the brand title

---

## 10. Accessibility & touch

- **Min target 44 px height.** 48 px preferred. Filter tabs ride at 36 px — acceptable but flagged for review.
- **No hover-only behaviour.** Every action must be reachable by tap.
- **No text smaller than 9 px.** Use it sparingly (eyebrows, 0.2em-tracked labels only).
- **Respect `touch-action: none`** on the globe canvas (drag/pinch only, never page-scroll).
- **Z-order spec:** content `z-10` · sidebar/modals `z-20` · dialog overlays `z-30` · loading `z-50`.

---

## 11. Globe canvas conventions (context for designers)

The 3D globe is the centrepiece. Design tokens that affect it:

| Layer | Token / value |
|---|---|
| Atmosphere colour (theme-driven) | `#2362DD` dark / `#cfe6ff` light |
| Cable line stroke | 2 px default · 4 px when selected |
| Travelling dot (perpetual) | 0.11 r sphere · `#FFFFFF` dark · `#0B1A3A` light · scale-with-camera |
| Call pulse (one-shot) | 0.22 r sphere · `#FF5E00` · 2.4× halo with additive blending · `#FF8A3D` |
| Landing point dot | 0.025–0.06 r (zoom-bucketed) |
| City labels | base 0.13, fades in below alt 0.314 |
| Country labels | base 0.85, fades out below alt 0.20 |

Designers: the globe textures (`/textures/world-mono-{light,dark}.webp` and `/textures/world-mono-{light,dark}-sea.webp`) are **pre-baked** from Natural Earth GeoJSON. Recolouring the basemap requires re-running `scripts/generate-world-map.mjs` with new sea/land/stroke values.

---

## 12. Open design items (questions for creative)

1. **Modal entrance/exit animation** — currently instant. Suggest a 240 ms slide-from-bottom with cubic-bezier easing.
2. **Hover/focus visibility** — kiosk has no hover, but a desktop preview build would benefit from focus rings for keyboard testing. Define non-intrusive focus state?
3. **Filter tabs at 36 px** — under the 44 px floor. Bump up or accept for the demo?
4. **Splash + welcome screens** — wireframe shows them; not yet built. Specify visuals.
5. **Localisation hooks** — copy is English-only today. Confirm if BM (Bahasa Malaysia) is a future requirement; affects HK Grotesk Wide character coverage.
6. **Light theme chrome** — currently the chrome stays cobalt-on-dark even when the globe is light-themed. Should chrome adapt to a true light surface, or remain cobalt for brand consistency?
7. **Call demo route variants** — currently Malaysia → Japan only. Future: Malaysia → US (BIFROST), Malaysia → EU (SMW6)? Need destination iconography.
8. **Iconography library** — replace hand-rolled SVGs with a consistent library (Lucide?) and ship as exported assets.
9. **Empty states** — "No cables match" exists; need design for "Loading", "Network error" (offline kiosk fallback), "Call destination unavailable".
10. **Stat card responsiveness** — fixed widths today; on a true 4K wall they'll look small. Define a scale-up tier or `rem`-based sizing.

---

## 13. Quick token export (for Figma variables)

```json
{
  "color": {
    "tm.dark":           "#06013A",
    "tm.navy":           "#180092",
    "tm.cobalt":         "#1800E7",
    "tm.accent.orange":  "#FF5E00",
    "tm.accent.orangeDeep": "#E65500",
    "tm.text.foreground":"#F5F5F5",
    "tm.text.mute":      "#A8B0D6",
    "tm.status.legacy":  "#94A3B8",
    "tm.globe.dark.sea": "#0B1322",
    "tm.globe.dark.land":"#152033",
    "tm.globe.light.sea":"#C9D7E8",
    "tm.globe.light.land":"#FAF6EB"
  },
  "radius": {
    "sm": 4, "md": 6, "lg": 8, "xl": 12, "2xl": 16, "full": 9999
  },
  "space": {
    "1": 4, "2": 8, "3": 12, "4": 16, "5": 20, "6": 24, "8": 32
  },
  "font": {
    "display": "HK Grotesk Wide",
    "body": "Roboto",
    "mono": "ui-monospace"
  },
  "tracking": {
    "tight": "-0.01em",
    "wide": "0.04em",
    "label": "0.2em",
    "labelLoose": "0.25em",
    "title": "0.18em",
    "eyebrow": "0.3em"
  },
  "shadow": {
    "panel":      "0 8px 40px rgba(0, 0, 0, 0.5)",
    "dialog":     "0 8px 60px rgba(0, 0, 0, 0.6)",
    "ctaOrange":  "0 4px 24px rgba(255, 94, 0, 0.35)",
    "deliverFlash":"0 4px 24px rgba(255, 94, 0, 0.5)"
  },
  "blur": {
    "panel": "16px",
    "header": "8px",
    "overlay": "4px"
  }
}
```

---

## 14. Source-of-truth files in code

| Concern | File |
|---|---|
| Brand colours | `src/lib/colors.ts`, `src/app/globals.css` |
| Type setup | `src/app/layout.tsx`, `src/app/globals.css` |
| Sidebar pattern | `src/components/Sidebar.tsx` |
| Header pattern | `src/components/Header.tsx` |
| Modal pattern (centred) | `src/components/InfoModal.tsx` |
| Modal pattern (docked) | `src/components/CallDialog.tsx` |
| Settings menu / chrome | `src/components/GlobeScene.tsx` (lines ~1090–1175) |
| Call animation overlay | `src/components/GlobeScene.tsx` (`CallAnimationOverlay`, lines ~1260+) |
| Audio tokens | `src/lib/morseAudio.ts` |
| Globe basemap presets | `scripts/generate-world-map.mjs`, `scripts/generate-regional-map.mjs` |

---

*Maintained by the implementation team. Re-export the Figma tokens (§13) whenever palette or scale changes upstream so design and code stay in lockstep.*

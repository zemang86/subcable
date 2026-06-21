# v7 futuristic pass — status

The agreed spine is FULLY SHIPPED on `version7` (PR #5):

- ✅ Flowing-energy cables (e34b1f5) — src/lib/cableFlow.ts
- ✅ Hologram fresnel rim (592cf7d) — src/lib/hologramRim.ts
- ✅ Radar scan sweep (6350dcb) — src/lib/scanSweep.ts
- ✅ Graticule grid (e93fc22) — baked into textures, §1 below
- ✅ Panel materialize/decrypt (0317030) — v7-mat-* CSS + useScramble, §2
- ✅ Circuit-trace selection (ffb31db) — energizeFront in cableFlow, §3
- ✅ Touch ripple (3345cac) — src/lib/touchRipple.ts, §4

Sections below kept for reference (tuning knobs, design rationale).
Only the **stretch ideas at the bottom** remain unbuilt.

---

## 1. Graticule grid

**What:** Faint glowing latitude/longitude lines over the whole sphere
(every 10–15°), very low opacity, sitting under the cables.

**What you'll see:** The ocean stops being empty black — the globe reads as
a coordinate system, a machine's projection of Earth. Subtle; you notice it
most at idle/default zoom.

**How:** Bake the grid lines into the existing dark world texture by
extending `scripts/generate-world-map.mjs`, then regenerate
`world-mono-dark.webp` (and the SEA overlay for close zoom).

**Cost:** Zero runtime cost (it's pixels in a texture we already draw).
**Effort:** Small — script change + rebake + eyeball pass.
**Risk:** None at runtime. Only risk is taste: too strong and it looks like
graph paper. Easy to tune line opacity in the script and rebake.
**Wow factor:** Low-medium — a "finish" detail, not a headline. Pairs well
with the rim + sweep already in.

## 2. Panel materialize / decrypt animations

**What:** Panels and cards stop sliding in — they *assemble*: the corner
crosshairs draw first, the frame traces in, then text resolves through a
~200 ms scramble (random glyphs settling into the real label, the
"decrypting" effect).

**What you'll see:** Every open of the Cable Information card, landing-point
callout, pickers, dialogs feels engineered, like the terminal is rendering
the data on demand. This is the piece visitors touch the most — every tap
gets the 2050 treatment.

**How:** CSS keyframes for frame/corners; a small React hook for the
scramble-text resolve on headings. Runs once per open, fast, never loops —
so it doesn't get annoying on a kiosk.

**Cost:** Negligible (CSS + a few timers while a panel opens).
**Effort:** Medium — touches several components (CableInformation, callout,
pickers, dialogs), needs care to keep the 48 px touch targets live
immediately (animation must not delay interactivity).
**Risk:** Low. Worst case it feels busy — trivially dialled back per panel.
**Wow factor:** High — biggest perceived-quality jump for walk-up users,
since it fires on every interaction.

## 3. Circuit-trace cable selection

**What:** On selecting a cable, instead of it just turning red, it redraws
itself tip-to-tail: a bright scan head races along the route (like a PCB
trace energizing) and settles into the selected look.

**What you'll see:** Selection becomes an *event* — your tap visibly
charges the cable end to end (~700 ms), which also draws the eye along the
actual route geography.

**How:** Mostly already paid for — the flow shader has per-fragment
distance-along-line; add a per-cable "energize front" uniform animated on
selection so fragments beyond the front stay muted until the head passes.

**Cost:** Near zero (a couple of uniforms on materials we already patch).
**Effort:** Small-medium — wiring selection timestamps into cableFlow, plus
an end-to-end (multi-segment) ordering nuance: segments energize in store
order, which may not be perfectly tip-to-tail on branched systems.
**Risk:** Low; degrades to current behavior if disabled.
**Wow factor:** High for the cost — rewards the single most common action.

## 4. Globe touch ripple

**What:** Tapping the globe spawns a brief expanding ring on the sphere's
surface at the geographic point you touched — your finger disturbs the
hologram.

**What you'll see:** Instant, physical-feeling feedback for every globe
tap — including "missed" taps that hit open ocean, which currently do
nothing visible. Big deal on a kiosk where people doubt the screen heard
them.

**How:** Same additive-shell shader family as rim/sweep: tap → raycast
lat/lng (already computed for tap forgiveness) → ring expands/fades over
~600 ms in a small shader. A tiny pool (2–3 ripples) handles fast repeat
taps.

**Cost:** One small mesh + uniforms, only alive ~0.6 s per tap.
**Effort:** Small.
**Risk:** None meaningful.
**Wow factor:** Medium-high — it's subtle but it's *felt* by every user
within seconds of walking up; great LiDAR-touchscreen showpiece.

---

## Stretch ideas (not yet scoped)

- **Magnetic targeting reticle** — a small lock-on reticle that snaps to the
  nearest landing point while your finger drags near it (builds on the
  tap-forgiveness nearest-point math). Medium effort, high sci-fi feel.
- **Parallax HUD + fake telemetry** — panels counter-shift 2–3 px against
  globe rotation so the UI floats like a glass layer; thin animated
  sparkline/hex-ticker strips in panel headers. Small effort each, pure
  atmosphere.

## Suggested order (wow ÷ effort)

1. **Circuit-trace selection** — high wow, small cost, infra already built
2. **Globe touch ripple** — small, every user feels it
3. **Panel materialize/decrypt** — biggest perceived upgrade, most files
4. **Graticule grid** — cheap finish detail, do during any lull

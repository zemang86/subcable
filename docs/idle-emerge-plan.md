# Idle submerge/emerge — "docked hologram" plan

Working doc for the idle attract-mode upgrade (continues the v7 futuristic
pass). Reference: `docs/v7-backlog.md` for the shipped v7 toolkit this builds
on. Cadence as always: build → hand-test on :3100 → commit on your word.

**Concept:** while idle the globe isn't just underwater — it's a hologram
*docked* in a seafloor facility, fed by umbilical data tethers. Waking the
kiosk releases it from dock (tethers detach), it breaches, branding plays,
then the whole system *boots*: the cable network powers on and the HUD
reconstructs in sequence.

## Build order

- [x] **1. Umbilical tethers (idle)** — conduits + docking pads + inward pulses
      (`4333015`, src/lib/idleTethers.ts; per-tether TM brand hues)
- [x] **2. Detach sequence (wake)** — reverse circuit-trace unplug, staggered
      (`54aaec6`; emerge stretched 1150→2600ms, all breach FX rescaled)
- [x] **3. System boot (post-branding)** — all-cables power-on + staggered chrome
      (`93eeecd`; dormant/bootAt in cableFlow, bootStage gates in GlobeScene;
      branding moved to AFTER the globe parks so the splash plays clean)
- [ ] **4. Garnish** — sonar pings, terminal stamps, depth readout

Each step is independently commit-able.

---

## Beat 1 — SUBMERGED: docked & feeding

- **4–6 glowing conduits** curve in from off-screen (bottom corners + sides)
  and clamp onto the visible hemisphere. Line2 fat lines so they reuse the
  comet-pulse flow shader (`src/lib/cableFlow.ts` family) — pulses travel
  **inward**, into the globe: charging/syncing while it sleeps.
- **Docking pads** at the attach points: small additive glow disc on the
  sphere — touchRipple's angular-distance shader frozen as a soft pulsing pad
  instead of an expanding ring.
- **Auto-rotate wrinkle:** idle rotation orbits the *camera*, not the mesh.
  Screen-anchored tethers would see their clamp points drift across the
  turning surface — lean into it (magnetic clamps tracking the hull).
  Implementation: recompute anchor lat/lng from camera bearing each frame,
  or parent the tether group to the camera.
- New module pattern: `src/lib/idleTethers.ts` exporting
  `attachIdleTethers(scene) => { detachAnimated(), dispose() }`, hooked from
  GlobeScene like the other v7 effects. Active only while `isIdle`.

## Beat 2 — WAKE: disengage & breach

- On tap, each tether plays a **reverse circuit-trace**: white-hot front
  races from globe *outward* along the conduit (`energizeFront` run
  backwards), the pad flashes white and dies, the dead tether sinks/retracts
  off-screen.
- Stagger ~80 ms apart, all done in ~500 ms — punched out right as the
  waterline (1150 ms `v1-uw-recede`, breach FX at ~430 ms) crosses the globe,
  so the breach reads as "released from dock, ascending".
- Corner terminal stamp during the recede: `UPLINK TERMINATED` → `ASCENDING`,
  decrypted via `useScramble`. (Can slip to Beat 4 if it crowds the breach.)

## Beat 3 — AFTER BRANDING: full system boot

- **Network power-on (the money shot):** the moment the branding card bows
  out, run a **one-shot circuit-trace on ALL cables simultaneously** — the
  network energizes tip-to-tail out of the dark. The `energizeFront`
  plumbing in cableFlow already does this per-selected-cable; generalize to
  an "all cables, once" trigger in its tick.
- **Staggered chrome reconstruction:** panels already self-assemble via
  `v7-mat-*` on mount. Add **orchestration**: instead of everything mounting
  at once on `chromeReady`, boot like subsystems —
  Header (120 ms) → Sidebar (+150 ms) → Cable Info / General Info (+150 ms)
  → right cluster (+150 ms). Pure CSS `animation-delay` via a `--boot-seq`
  custom property on the existing materialize classes.
- Optional: one scan-sweep pass timed to land exactly as the last panel
  finishes — the "system online" wipe.

## Beat 4 — Garnish (cheap atmosphere)

- **Sonar heartbeat:** every ~5 s while idle, `touchRipple.spawn()` at a
  random landing point — faint sonar contacts across the network. ~3 LOC.
- **Depth readout** near the tap-to-begin hint:
  `DEPTH 3 200 M · UPLINK ACTIVE · SYNC 99.7%`, scramble-ticking digits.
- Terminal stamps from Beat 2 if deferred.

## Explicitly skipped

- Pressure-distortion shader on the idle globe — `v1-globe-defocus` already
  covers the feel.
- Physical tether sag / rope physics — a fixed Bézier bow reads identically
  at kiosk distance for 5% of the cost.

---

## Existing sequence (for timing reference)

GlobeScene wake-from-idle effect (`SURFACE_MS = 2600`; sequence as of
`93eeecd` — branding waits for the globe to park):

| t (ms) | what |
| --- | --- |
| 0 | tap → `surfacing=true`, chrome held; tether unplugs start (280 ms stagger, 1430 ms each) |
| ~975 | breach FX peak (spray; rings 815/1060/1310; rush ≤2450) |
| ~2550 | last tether consumed |
| 2600 | recede done → globe x-slides to offset (700 ms) + two-leg fly-in (1300 + 650 ms) |
| 4550 | globe parked → branding card fades in, holds 2500 ms |
| 7050 | card bows out → `networkDormant=false`, all-cables power-on trace (2.4 s) |
| 7750 | `chromeReady=true` → chrome boots: Header → Sidebar/buttons → info panel → cluster/controls (180 ms steps) |

Network is ghosted (`networkDormant`, explicit state) from idle entry all
the way to the 7050 ms power-on — no bright flicker between phases.

## Toolkit being reused

- `src/lib/cableFlow.ts` — flow pulses + `energizeFront` circuit trace
- `src/lib/touchRipple.ts` — angular-distance ring shader, `spawn(lat,lng)`
- `src/lib/useScramble.ts` — decrypt text
- `globals.css` `v7-mat-*` — crosshair pop / frame trace / wipe / body fade
- `src/lib/scanSweep.ts` — optional "system online" pass

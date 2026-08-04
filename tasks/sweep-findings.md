# Pre-UI/UX Sweep — Findings (2026-08-04, branch `pre-uiux-sweep`)

Full-codebase bug/perf sweep by 5 parallel review agents (globe rendering, panels/dialogs, app shell + idle + Electron, data/routing, bundle/assets) plus lint + production build. Build compiles clean; `tsc --noEmit` clean. **No unbounded three.js leaks, AudioContext leaks, or timer/listener accumulation found** — long-session memory story is healthy. 11 P1s and ~20 deduped P2s below, ranked by kiosk impact.

---

## P1 — fix before kiosk handover

### Robustness (kiosk soft-locks)

1. **Intro/attract video machine has zero error recovery** — `IntroSequence.tsx:329` (also 163, 263, 287, 312, 371-381, 436-460). Every phase transition waits on `ended`/`timeupdate`, every `play()` rejection is swallowed (`.catch(() => {})`), no `<video>` has `onError`, and taps are dead outside `attract`. One failed clip = kiosk frozen on the opaque z-60 layer until process restart.
   **Fix:** `onError` handlers + per-phase watchdog timeout (clip duration + margin) that forces the next phase or falls back to `attract`.

2. **Fun Fact video failure deadlocks the idle hold** — `generalInfo/VideoScreen.tsx:41-44, 127-142`. `playing = started && !paused`; no `onError`/`onStalled`, so a clip that fails to decode leaves `onHoldIdle(true)` raised forever — attract never returns. (Exactly the known 10-bit HEVC failure mode.)
   **Fix:** `onError={() => { setStarted(false); setPaused(false); }}`.

3. **Second Morse send during a live call corrupts the call** — `GlobeScene.tsx:1694-1717, 2204-2205`. `CallAnimationOverlay` is unkeyed and its one-shot effect never re-runs, so the old run keeps driving the camera on the stale route while the new label/highlight render; the old `onDone()` then kills the new call mid-flight. Reachable because RightCluster/Sidebar stay interactive during `activeCall`.
   **Fix:** `key={activeCall.startedAt}` on the overlay and/or gate chrome interactions on `activeCall`.

4. **Stale close-timer re-expands a landing point** — `LandingPointCallout.tsx:303-307`. `setTimeout(onClose, SHRINK_MS)` is never cleared; a fast tap elsewhere inside the 200 ms shrink window fires the stale callback, which re-expands the just-closed point and flies the camera back, stomping the user's new tap.
   **Fix:** store the id in a ref, clear on unmount.

5. **Far-side callout occlusion never fires** — `GlobeScene.tsx:1443-1450`. `visible = v.z <= 1` is always true (camera far plane is 125,000; globe-surface points never project past NDC z = 1), so selected-cable markers/reticles float over the sphere when they rotate behind the globe.
   **Fix:** hemisphere test (dot of camera position vs surface normal), not NDC z.

### Data correctness (user-visible on the globe / in calls)

6. **Cherating claims APCN-2 membership it doesn't have** — `landingPoints.ts:26` vs `cables.ts:142-153` (APCN-2 lands at Kuantan). The phantom shared cable suppresses the same-country teleport, so Cherating→Kuantan (45 km) routes 255 km via Rompin — the only asymmetric pair in the network.
   **Fix:** remove `"apcn2"` from cherating's `cableIds`.

7. **MDSCS ring order draws three phantom trans-South-China-Sea strands** — `cables.ts:366-374`. Order `[..., kota-kinabalu, cherating, bintulu]` creates KK→Cherating (1,419 km), Cherating→Bintulu (1,082 km), Bintulu→Mersing (1,032 km) strands plus a Kuching→Miri chord cutting inland; drawn total 5,067 km vs stated 4,134 km.
   **Fix:** reorder to `[cherating, mersing, kuching, bintulu, miri, labuan, kota-kinabalu]` (skr1m convention).

8. **NuGate has no real geometry → calls animate over Sumatra** — no `nugate` key in `cableGeometry.ts`; `cableRoutes.ts:98-105` falls back to a great-circle with ~145 km over Indonesian land, and the v6 land-guard only trips for real-geometry cables, so every Jakarta/Singapore-PoP call crosses land (up to 386 km on composite routes).
   **Fix:** import NuGate polylines via `scripts/import-cable-geometry.mjs` (or hand-route through the Bangka Strait).

9. **CM name contradiction** — `cables.ts:182` description says "CM (Cable Malaysia)" but `name` (line 160) is "Cahaya Malaysia". Visible in the Cable Information panel. **Fix:** "Cahaya Malaysia (CM)".

10. **SKRM wrong expansion** — `cables.ts:441` says "Submarine Kabel Rakyat Malaysia"; `name` (line 419) is "Sistem Kabel Rakyat Malaysia". **Fix:** align.

### Assets

11. **26.0 MB of unreferenced tm-clip videos ship in every build** — `public/video/tm-clip1-underwater-dolly-v2.mp4` (9.4 MB), `tm-clip2-fullseq-fast.mp4` (5.4 MB), `tm-clip3-submerge-loop.mp4` (11.2 MB). Only referenced in commented-out lines (`IntroSequence.tsx:40-42`); live constants use `draft-*.mp4`. They inflate `out/` (94 MB, video = 82 MB), the Electron installer, and every Vercel deploy.
    **Fix:** move them out of `public/` until the final-clip swap-back.

---

## P2 — worth doing, grouped

### Kiosk hardening (Electron)
- `electron/main.js:19-43, 60-62` — Escape exits fullscreen with no dev-flag gate; no `kiosk: true`; no `render-process-gone`/`unresponsive` auto-relaunch; no `requestSingleInstanceLock`. One renderer crash or double-launch ends/duplicates the exhibit.
- `electron/main.js:48-55` — app:// protocol handler joins the decoded pathname with no containment check (`..%5c` escapes `out/` on Windows). Hardening: `path.resolve` + reject paths outside `OUT_DIR`.

### Video robustness
- `IntroSequence.tsx:234-247 vs 331-343` — mount-time decode priming is defeated: the initial `live` phase branch pauses all four videos while the prime `play()` promises are pending (AbortError), so the warm-up never runs. Prime via seek + `requestVideoFrameCallback` instead.
- `IntroSequence.tsx:391-397` — if the attract lead clip reaches `ended` without the seam `timeupdate` firing, the lead is parked at frame 0 paused forever (attract frozen until tap). Call `loopSwap()`/replay in that branch instead of parking.
- `VideoScreen.tsx:53` — only `play()` in the app without `.catch`; unhandled rejection + UI stuck in "playing" visuals. `play().catch(() => setPaused(true))`.

### Idle attractor
- `useIdleAttractor.ts:93-95` — activity = `pointerdown`/`touchstart`/`keydown` only; a 60 s unbroken drag/pinch never re-arms, so warn/submerge can fire mid-touch. Add throttled `pointermove` (or `pointerup`).

### Globe perf (per-frame work)
- `GlobeScene.tsx:1980-1990, 2112-2113` — call overlay allocates `new THREE.Vector3` per frame and `setLabelPos` with a fresh object at 60 fps. Hoist a scratch vector; skip sub-pixel updates (reuse the 0.5 px guard).
- `GlobeScene.tsx:1441-1464` — 30 fps callout tracker allocates a fresh record + `{x,y,z}` per marker per tick even at rest. Precompute per-marker vectors on `markerPoints` change; pool the record.
- `GlobeScene.tsx:758 + 73-81, 249` — zoom poll publishes on raw 0.1 altitude delta, coarser than the bucket boundaries (0.18 cluster flip), so `zoomBucket`/`useClusters` can rest on the stale side; bucket 5 / 0.02 boundary unreachable (`MIN_CAM_DISTANCE` floors altitude ≈ 0.08). Publish on bucket/threshold crossings.
- `GlobeScene.tsx:719` — boot-hold `setTimeout(() => setIsLoaded(true), 3000)` never stored/cleared (stray setState if tree ever remounts).
- `GlobeScene.tsx:284-293` — `arrivalSettleRef` is dead (cleared but never assigned).

### React correctness (lint cluster)
- `setState` synchronously in effect: `GlobeScene.tsx:514, 683, 1421`, `IntroSequence.tsx:271, 350`, `MorseCodePop.tsx:141`, `Sidebar.tsx:102`, `useIdleAttractor.ts:52` — cascading re-renders.
- `Sidebar.tsx:618` — reads `dragging.current` during render (`react-hooks/refs`).

### i18n / BM gaps (bundle with client BM sign-off pass)
- `MorseCodePop.tsx:474` — "Maximum Characters: …" hardcoded (dict key `maximumLetter` exists, unused); error toast `"…is not a valid morse letter"` hardcoded (`:166, 183`).
- `MorseCodePop.tsx` — dialog chrome (From/To, "Type Message Here", Dot/Dash/Enter/Space…) baked into `fullmorse.svg`, stays English in BM. Needs BM SVG variant or live-text overlay.
- `CableCard.tsx:155` — "{n} Points" hardcoded; no dict key; CableCard receives no `t`.
- `Sidebar.tsx:212` — "No cables match." bypasses `t()` (currently unreachable).
- Hardcoded EN aria-labels: `MorseCodePop.tsx:334/349/957`, `VideoScreen.tsx:171/229/380-437`, `LandingPointCallout.tsx:118/197/384`, `generalInfo/shared.tsx:399`, `RightCluster.tsx:27-43`, `LanguageToggle.tsx:21`.
- `i18n.ts` — 15 of 63 dict keys never referenced (incl. `decommissioned`, which isn't even a Status value; data uses `inactive`). Prune.

### Data cleanup
- `cableGeometry.ts` smw5 — Yanbu spur is a 3-vertex fragment isolated 208 km from the rest (> `STITCH_SNAP_KM` 150), so SMW5 never draws through Yanbu and it's only reachable by teleport off SMW4 at Jeddah. Re-import with the spur connected or raise the snap for that join.
- `landingPoints.ts:109-117` — `kuala-muda` has `cableIds: []`, referenced by nothing, but renders as a globe point tied to nothing. Delete or attach. (Also: actual count is 114 points, not the 113 in CLAUDE.md.)
- `cableRoutes.ts:20-56` — `TOPOLOGIES` for `bdm`, `mct`, `skr1m`, `cm`, `apcn2`, `flag` are dead (realSegments wins); only `bps`, `mdscs`, `stingray2-ketam` fallbacks are live.

### Dead code
- `SplashScreen.tsx`, `UnderwaterOverlay.tsx`, `lib/idleTethers.ts`, `lib/scanSweep.ts` imported by nothing; `_archive/` holds only BrandingFlash.tsx. Inert in bundle, but their CSS ships: `globals.css:366-482` (`v1-uw-*`, `v1-globe-breach/defocus`, `v1-splash-drop`, `v1-ripple-ring`, `v1-uw-rush`) and `528-531` (`v1-splash-rise`) are orphaned. Move components to `_archive/`, prune the CSS.
- Debug routes ship to production: `/capture` (second full globe instance; its own comment says delete when done) and `/font-test` — in the kiosk installer and live on subcable.vercel.app. Delete both (+ GlobeCapture.tsx).

### Asset diet
- `public/video/funfact-subsea-cable-repair.mp4` — 40.7 MB (187.8 s, 720p, 1.81 Mbps), largest single asset. Re-encode ~1.0–1.2 Mbps H.264 8-bit → saves ~13–17 MB.
- `public/fonts/` — 3.0 MB of raw TTFs (all 17 faces verified in use). Convert TTF→WOFF2 → ~1.1–1.5 MB. Web path benefits; kiosk reads from disk.
- `docs/temp-video/` (untracked, 8.1 MB) — source clips already re-encoded into `public/video/draft-*`; one `git add .` from bloating the repo. Move out or `.gitignore`.

### Lint noise
- ~20 errors from `docs/tm-submarine-cable-map-design-system/**` reference JSX and 3 `require()` errors from `electron/*.js` — add both to ESLint ignores so real errors stand out.

---

## Verified clean (checked, no action)
- three.js lifecycle: cableFlow/hologramRim/touchRipple attach+dispose correct; reveal/submerge cycles don't stack rAF loops; SEA-overlay handles load-after-unmount; three-globe disposes replaced Line2 geometry/materials.
- Audio: single module-level AudioContext, `stopAll()` closes + recreates, nodes GC-eligible, stopped on call-skip.
- Timers/listeners: useIdleAttractor, useScramble, DidYouKnow, GeneralInfoDialog, Sidebar, CableInformation, IntroSequence's 7 timer refs — all cleaned up correctly.
- Bundle split intact: initial JS 547 KB / 7 chunks, zero three.js in initial chunks; 2.1 MB globe chunk deferred; all data JSON lands in the deferred chunk.
- i18n dict parity 63/63; all didYouKnow + generalInfo entries have non-empty EN and BM; all media paths exist.
- Coordinates: all 114 points in range, no swapped lat/lng, no dupes. Call routing: 108/114 dialable, 5,575-pair audit shows no land-crossing or cross-country teleports offered (SMW5's 378 km Egypt crossing is the genuine terrestrial Suez segment).
- Deps: no unused packages; next.config.ts fine; no `console.*` in src/ or electron/.

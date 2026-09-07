# Submarine Cable Map · Kiosk UI Kit

High-fidelity recreation of the TM Submarine Cable Map kiosk — Figma `UI UI Concept V1.3`. Build at the kiosk viewport (2049×1150 per tile) and scaled to fit any preview.

## Files

- `index.html` — entry. Loads React + all JSX, mounts the kiosk shell.
- `app.jsx` — top-level state machine (selected cable, open dialog, filter, language).
- `globe.jsx` — placeholder SVG sphere (the real app renders three-globe / react-globe.gl).
- `components/*.jsx` — one component per file. Each exports to `window` at the bottom so the babel scripts can share scope.
- `data.js` — trimmed cable + landing-point fixtures.

## How to interact

- Tap a cable in the right-side **3×3 grid** to select it → cable highlights red on the globe, info panel populates, bottom title bar shows code.
- Tap **filter tabs** (Show all / International / Domestic) to change the grid.
- Tap **language pill** (top-centre) to switch EN ↔ BM.
- Tap the **three circular buttons** (right edge) to open How-To / Fun Fact / Reset.
- Tap the **landing-point ring** on the (selected) globe to open a callout.
- From the Cable Information panel, tap **"Send Message →"** to open the Morse keyboard.

## What's faithful vs deliberately stubbed

- **Faithful**: every token, component class, type ramp, status indicator, bracket frame, bevelled card, button hierarchy, dialog framing, layout grid.
- **Stubbed**: the globe is a flat SVG sphere with a few cable polylines, not the three-globe scene. Audio, video playback, idle attractor, real geo data are out of scope for the kit.

## Source of truth

- Figma `UI UI Concept V1.3` — `/Wireframe/UI-UI-Concept-V1.3` in the .fig VFS.
- Code reference: `subcable/src/components/*` (the `tm-*` classnames here mirror the production `v1-*` classes in `subcable/src/app/globals.css` 1-for-1).

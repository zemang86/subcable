# TM Submarine Cable Map

Interactive 3D globe visualizing Telekom Malaysia's submarine cable network —
26 cable systems and 113 landing points. Built for large-format kiosk
touchscreens (1920×1080, LiDAR touch overlay) with a tactical-HUD interface:
cable circuit-trace animations, Morse-code messaging demo, make-a-call routing
demo, and an underwater idle attract mode.

## Stack

- Next.js 16 (App Router) + TypeScript, static export
- react-globe.gl / three.js for the globe
- Tailwind CSS v4
- Electron 35 for the Windows kiosk build

## Run it

```bash
npm install
npm run dev              # web dev server on :3000
npm run electron:dev     # desktop app, local build
npm run electron:build   # package installer (NSIS exe / DMG)
```

## Deploy

- **Web** — Vercel: https://subcable.vercel.app
- **Kiosk** — GitHub Actions builds the Windows exe on every push to `main`
  (artifacts tab, or attach to a Release for permanent distribution)

See `CLAUDE.md` for architecture notes and development conventions.

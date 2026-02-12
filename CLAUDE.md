# TM Submarine Cable POC

## Overview
Interactive 3D globe visualization showcasing Telekom Malaysia submarine cable systems.
Built as a POC for Telekom Malaysia — deployed on large touchscreen displays with LiDAR touch interface.

## Tech Stack
- Next.js 16 (App Router) + TypeScript
- react-globe.gl for 3D globe rendering
- Tailwind CSS v4 for styling
- Electron 35 for desktop app (kiosk/touchscreen deployment)
- electron-builder for cross-platform packaging (DMG + NSIS)
- Deployed on Vercel (web) + GitHub Actions (desktop builds)

## Project Structure
```
src/
├── app/           # Next.js app router (layout, page, globals.css)
├── components/    # React components (GlobeScene, Sidebar, Header, etc.)
├── data/          # Static cable data (cables, landing points, routes)
└── lib/           # Types, colors, utilities
electron/
├── main.js        # Electron main process (app:// protocol, window management)
└── preload.js     # Preload script (context isolation bridge)
```

## Development
- `npm run dev` — Start Next.js dev server (http://localhost:3000)
- `npm run build` — Production build (static export to out/)
- `npm run lint` — Run ESLint
- `npm run electron:dev` — Build + launch Electron app locally
- `npm run electron:build` — Build + package Electron installer (DMG on macOS, exe on Windows)

## Key Patterns
- Globe component uses dynamic import with `ssr: false` (WebGL can't render server-side)
- All globe interaction is in GlobeScene.tsx (client component)
- Cable data is static in src/data/ (no API needed for POC)
- Colors defined in src/lib/colors.ts following TM brand
- Touch-first UI: min 48px touch targets, no hover-only interactions
- Points/labels scale dynamically with zoom (linear interpolation between altitude 0.5–2.2)
- Electron uses `app://` custom protocol to serve static files from `out/` directory (avoids file:// CORS issues with Next.js static export)

## Data
3 cable systems: BDM, MCT, SKR1M
13 unique landing points across Malaysia, Indonesia, Thailand, Cambodia

## Textures
- Night: NASA 13500x6750 (7.5MB) — near GPU max
- Day: NASA Blue Marble 8192x4096 (5.5MB) — downscaled from 21600x10800 source
- WebGL GPU limit is typically 8192px; anything larger gets downsampled by the GPU
- Topology bump map for terrain relief

## Deployment
### Web (Vercel)
- `vercel` — Preview deploy
- `vercel --prod` — Production deploy
- Production URL: https://subcable.vercel.app
- `output: "export"` works with both Vercel and Electron

### Desktop (Electron)
- GitHub Actions builds macOS DMG + Windows exe on every push to `main`
- Download installers from GitHub Actions artifacts tab (requires GitHub login, expires 90 days)
- For permanent distribution, create a GitHub Release and attach the .dmg/.exe files
- No code signing configured (internal distribution)
- Config in `electron-builder.yml`
- CI workflow: `.github/workflows/build.yml`

### GitHub
- Repo: https://github.com/zemang86/subcable
- Releases: https://github.com/zemang86/subcable/releases/latest

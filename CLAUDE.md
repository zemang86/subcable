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
- GitHub Actions builds the Windows exe on every push to `main` (CI no longer builds the macOS DMG — kiosk target is Windows; run `npm run electron:build` locally for a DMG)
- Download installers from GitHub Actions artifacts tab (requires GitHub login, expires 90 days)
- For permanent distribution, create a GitHub Release and attach the .exe file
- No code signing configured (internal distribution)
- Config in `electron-builder.yml`
- CI workflow: `.github/workflows/build.yml`

### GitHub
- Repo: https://github.com/zemang86/subcable
- Releases: https://github.com/zemang86/subcable/releases/latest

## Workflow Orchestration

### 1. Plan Node Default
- Enter plan mode for ANY non-trivial task (3+ steps or architectural decisions)
- If something goes sideways, STOP and re-plan immediately - don't keep pushing
- Use plan mode for verification steps, not just building
- Write detailed specs upfront to reduce ambiguity

### 2. Subagent Strategy
- Use subagents liberally to keep main context window clean
- Offload research, exploration, and parallel analysis to subagents
- For complex problems, throw more compute at it via subagents
- One task per subagent for focused execution

### 3. Self-Improvement Loop
- After ANY correction from the user: update `tasks/lessons.md` with the pattern
- Write rules for yourself that prevent the same mistake
- Ruthlessly iterate on these lessons until mistake rate drops
- Review lessons at session start for relevant project

### 4. Verification Before Done
- Never mark a task complete without proving it works
- Diff behavior between main and your changes when relevant
- Ask yourself: "Would a staff engineer approve this?"
- Run tests, check logs, demonstrate correctness

### 5. Demand Elegance (Balanced)
- For non-trivial changes: pause and ask "is there a more elegant way?"
- If a fix feels hacky: "Knowing everything I know now, implement the elegant solution"
- Skip this for simple, obvious fixes - don't over-engineer
- Challenge your own work before presenting it

### 6. Autonomous Bug Fixing
- When given a bug report: just fix it. Don't ask for hand-holding
- Point at logs, errors, failing tests - then resolve them
- Zero context switching required from the user
- Go fix failing CI tests without being told how

## Task Management

1. **Plan First**: Write plan to `tasks/todo.md` with checkable items
2. **Verify Plan**: Check in before starting implementation
3. **Track Progress**: Mark items complete as you go
4. **Explain Changes**: High-level summary at each step
5. **Document Results**: Add review section to `tasks/todo.md`
6. **Capture Lessons**: Update `tasks/lessons.md` after corrections

## Core Principles

- **Simplicity First**: Make every change as simple as possible. Impact minimal code.
- **No Laziness**: Find root causes. No temporary fixes. Senior developer standards.
- **Minimal Impact**: Changes should only touch what's necessary. Avoid introducing bugs.

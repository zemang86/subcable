# TM Submarine Cable POC - Implementation Plan

## Context
POC for Telekom Malaysia to showcase their submarine cable network on an interactive 3D globe. Three cable systems will be visualized: BDM, MCT, and SKR1M. Inspired by TeleGeography's submarine cable map (dark futuristic theme) and 3D globe visualizations. Will deploy to Vercel.

**Deployment target: Large touchscreen display with LiDAR touch interface.** All interactions must be optimized for multitouch gestures - no hover states as primary interaction, large touch targets, pinch-to-zoom, two-finger rotate, etc.

---

## Tech Stack
- **Next.js 15** (App Router) + TypeScript + Tailwind CSS
- **react-globe.gl** - 3D globe library (built on Three.js, has native cable path support)
- **Vercel** for deployment

Why react-globe.gl: It has built-in `pathsData` for drawing cable routes, `pointsData` for landing markers, animated dashed lines, click/hover callbacks, and camera controls - all out of the box. Much less code than raw Three.js.

---

## Touch/Multitouch Interface Requirements
- **Pinch-to-zoom**: Two-finger pinch gesture to zoom in/out on globe
- **Two-finger rotate**: Drag with two fingers to rotate the globe
- **Single tap**: Select cable or landing point (large touch targets, min 48px)
- **Swipe**: Scroll sidebar cable list
- **Long press**: Show tooltip/info for a cable or point
- **No hover dependency**: All hover-based interactions must have tap-based alternatives
- **Touch target sizing**: All buttons/cards minimum 48x48px, comfortable spacing
- **Prevent default browser gestures**: Disable pull-to-refresh, pinch-zoom on page (only on globe)
- **CSS `touch-action`**: Properly configured on globe container vs UI panels
- **High DPI**: Render at device pixel ratio for sharp output on large screens
- **Fullscreen mode**: Optional kiosk/fullscreen toggle for exhibition display

---

## Project Structure
```
subcable/
├── CLAUDE.md
├── package.json
├── next.config.ts              # transpilePackages for react-globe.gl
├── tsconfig.json
├── postcss.config.mjs
├── .gitignore
├── public/
│   └── textures/               # earth-night.jpg, night-sky.png, earth-topology.png
├── src/
│   ├── app/
│   │   ├── layout.tsx          # Root layout, fonts, metadata
│   │   ├── page.tsx            # Main page
│   │   └── globals.css         # Tailwind + custom animations
│   ├── components/
│   │   ├── GlobeScene.tsx      # Main client component - globe + all UI
│   │   ├── GlobeWrapper.tsx    # Dynamic import (ssr: false)
│   │   ├── Sidebar.tsx         # Cable list, search, details panel
│   │   ├── CableCard.tsx       # Cable list item
│   │   ├── CableDetailPanel.tsx # Expanded cable info
│   │   ├── Header.tsx          # Top bar with TM branding
│   │   └── LoadingScreen.tsx   # Loading state
│   ├── data/
│   │   ├── cables.ts           # 3 cable system definitions
│   │   ├── landingPoints.ts    # 13 landing points with lat/lng
│   │   └── cableRoutes.ts     # Coordinate arrays for cable paths
│   └── lib/
│       ├── types.ts            # TypeScript interfaces
│       ├── colors.ts           # TM brand + cable colors
│       └── utils.ts            # Helpers
```

---

## Cable Data (3 Systems)

### 1. BDM (Batam Dumai Melaka) - Color: Cyan `#00BCD4`
- Length: ~353 km | RFS: 2009 | Owners: Moratelindo, Telekom Malaysia
- Landing points: **Melaka** (2.196N, 102.24E) → **Batam** (1.149N, 104.02E) + **Dumai** (1.694N, 101.45E)

### 2. MCT (Malaysia-Cambodia-Thailand) - Color: Orange `#FF6B35`
- Length: 1,300 km | RFS: 2017 March | Owners: TM, Symphony, Telcotech
- Landing points: **Cherating** (4.126N, 103.39E) → **Rayong** (12.67N, 101.27E) with branch to **Sihanoukville** (10.59N, 103.54E)

### 3. SKR1M (Sistem Kabel Rakyat 1Malaysia) - Color: TM Blue `#2362DD`
- Length: ~3,700 km | RFS: 2017 Sept | Owners: TM, TIME dotCom
- Landing points: **Cherating** → **Kuantan** → **Mersing** → **Kuching** → **Bintulu** → **Miri** → **Kota Kinabalu**

---

## Implementation Steps

### Phase 1: Project Setup
1. **Scaffold Next.js project** in `/Users/hazman/subcable/` with TypeScript + Tailwind
2. **Install dependencies**: `react-globe.gl`, `three`
3. **Configure** `next.config.ts` with `transpilePackages`
4. **Create CLAUDE.md** with project docs
5. **Init git** repo + `.gitignore`

### Phase 2: Data Layer
6. Create `src/lib/types.ts` - CableSystem, LandingPoint, CableRoute interfaces
7. Create `src/lib/colors.ts` - TM brand colors + cable palette
8. Create `src/data/cables.ts` - 3 cable system objects
9. Create `src/data/landingPoints.ts` - 13 landing points
10. Create `src/data/cableRoutes.ts` - Coordinate waypoints for each cable segment

### Phase 3: Globe + UI
11. Create `GlobeWrapper.tsx` - Dynamic import with `ssr: false`
12. Create `GlobeScene.tsx` - Main component with globe, paths, points, interactions
13. Create `Header.tsx` - Top bar with TM branding
14. Create `Sidebar.tsx` + `CableCard.tsx` + `CableDetailPanel.tsx` - Right panel
15. Create `LoadingScreen.tsx` - Loading state
16. Wire up `page.tsx` and `layout.tsx`

### Phase 4: Interactivity + Touch Optimization
17. Cable selection - tap to highlight, zoom, show details
18. Landing point tap - zoom to point, show info
19. Search filtering in sidebar
20. Smooth camera animations via `pointOfView()`
21. Auto-rotation (stops on touch interaction, resumes after idle)
22. **Multitouch gestures** - pinch zoom, two-finger rotate on globe
23. **Touch target optimization** - min 48px targets, proper spacing
24. **Disable browser default gestures** on globe container (`touch-action: none`)
25. **Device pixel ratio** - render sharp on high-DPI large screens

### Phase 5: Polish + Deploy
26. Animated dashed cable lines, pulsing landing markers
27. Glassmorphism panels (`backdrop-blur`, semi-transparent)
28. Large-screen layout optimization (sidebar proportional to screen size)
29. **Deploy to Vercel** via `npx vercel` or GitHub integration

---

## Visual Design
- **Theme**: Dark futuristic (deep navy `#0A0E1A` background, star field, TM blue glow)
- **Globe**: Night earth texture with city lights, TM-blue atmosphere
- **Panels**: Glassmorphism - `bg-slate-900/80 backdrop-blur-xl border-blue-500/30`
- **Font**: IBM Plex Mono (technical/futuristic feel)
- **Layout**: Globe fills viewport, sidebar right (380px), header top, controls bottom-left
- **Touch UI**: Large buttons, generous padding, no reliance on hover states

---

## Reference Links
1. https://www.submarinecablemap.com/
2. https://submarine-cable-map-2025.telegeography.com/
3. https://earth3dmap.com/3d-globe/

---

## Verification
1. `npm run dev` - Globe renders with 3 cable routes visible
2. Tap each cable → highlights, sidebar shows correct details
3. Tap landing points → zooms in, shows connected cables
4. Pinch-to-zoom and two-finger rotate work smoothly
5. Search works in sidebar
6. `npm run build` succeeds without errors
7. `npx vercel` deploys successfully
8. Test on touchscreen device / Chrome DevTools touch emulation

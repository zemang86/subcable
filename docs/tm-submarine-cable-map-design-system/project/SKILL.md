---
name: tm-submarine-cable-design
description: Use this skill to generate well-branded interfaces and assets for the TM Submarine Cable Map kiosk (Telekom Malaysia's interactive 3D globe touchscreen for visiting clients), either for production work in the /subcable codebase or for throwaway prototypes, mocks, slides, etc. Contains essential design guidelines (tactical-HUD aesthetic), colors, type, fonts, assets, and a high-fidelity React UI kit that recreates the kiosk shell + all major dialogs.
user-invocable: true
---

Read the `README.md` file within this skill, and explore the other available files (`colors_and_type.css`, `preview/`, `ui_kits/kiosk/`, `assets/`, `fonts/`).

If creating visual artifacts (slides, mocks, throwaway prototypes, marketing material, etc.), copy the relevant assets out of this skill folder into your output and create static HTML files for the user to view. Always load `colors_and_type.css` — it defines every token (`--tm-bg`, `--tm-blue`, `--tm-orange`, `--tm-active`, ...) and every utility class (`tm-card-bevel`, `tm-bracket`, `tm-status`, `tm-cablecard`, `tm-circle-btn`, `tm-filter-tab`, etc.) needed to render anything in the kiosk's visual language.

If working on production code in the `subcable/` codebase, this skill is the source of truth for tokens, copy and component behaviour. The production code uses a parallel `v1-*` token/class namespace (see `subcable/src/app/globals.css` and `subcable/docs/design_handoff_subcable_v1/`) — they're 1-for-1 equivalent to the `tm-*` names here. Don't rename either side; treat them as aliases.

Key constraints to obey always:

- **Tactical-HUD aesthetic, not consumer app.** Hard edges (0 radius default), corner-bracket frames, bevelled cut-corner cards, monospace tactical text. No backdrop blur, no drop shadows, no gradients beyond the system's two (card-fill and titlebar-protect).
- **Two-tone brand**: TM blue `#034DA1` + TM orange `#F05A22`. Lime/red for status. **No purple-blue gradients, no emoji, no left-border-accent cards.**
- **Type stack is fixed**: Chakra Petch (display, page banners only) · Rajdhani (UI labels, buttons, headings) · IBM Plex Mono (body, captions) · B612 Mono (big orange stat numbers) · Space Mono (tactical 8–10px coords). Don't substitute Inter / Roboto / Geist.
- **Touch-first**: 44px min, 48px preferred. No hover-only interactions.
- **Bilingual**: every UI string must have an EN and BM variant. Cable names stay as authored.
- **All chrome in the bottom half** — the kiosk's upper half is out of reach on the physical wall.

If the user invokes this skill without any other guidance, ask them what they want to build or design — is it a new screen in the kiosk, a marketing slide deck, a printed leaflet, an internal dashboard reusing the same brand, something else — ask the questions that matter for that medium (audience, viewport, deliverable format), then act as an expert designer who outputs HTML artifacts **or** production-ready React/TSX for the `subcable/` codebase, depending on the need.

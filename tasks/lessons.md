# Lessons

Self-improvement log, per CLAUDE.md → Self-Improvement Loop.
After ANY correction from the user, add an entry: the mistake, the root cause,
and a rule that prevents it recurring. Review relevant entries at session start.

Format:
```
## YYYY-MM-DD — short title
- **What happened:** the mistake or correction.
- **Root cause:** why it happened.
- **Rule:** the durable rule to apply going forward.
```

---

## 2026-05-29 — Disabled buttons can't fire the hint that explains them
- **What happened:** Gated the Morse/Fun Fact cluster buttons with HTML `disabled` while also needing a "choose a network first" tap hint — but an inert button never fires the tap.
- **Root cause:** Treated "disabled" as a single concept; visual-disabled and behaviour-inert are different needs.
- **Rule:** When a gated control must still explain *why* it's gated on interaction, render it visually dimmed but keep it clickable (a `dimmed` prop), and intercept the action upstream. Reserve true `disabled` for controls that need no feedback.

## 2026-05-29 — Graph terminals: attach to ONE nearest node, not per-fragment
- **What happened:** In the call-route stitcher, connecting from/to to the nearest vertex of every fragment let Dijkstra take a long straight terminal edge as a shortcut, skipping the cable.
- **Root cause:** Extra terminal edges created cheap straight-line paths that beat following the real geometry.
- **Rule:** When attaching query points to a graph for shortest-path, connect to the single nearest node only. Prototype + measure the longest hop in the result before trusting any path-finding change.

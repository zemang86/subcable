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

## 2026-08-03 — `rm -rf` behind an `&&` chain deleted 102MB of the user's work
- **What happened:** Moving dropped images out of `public/` with `for d in ...; do if compgen -G "$d"*.png; then mv ...; fi; done && rm -rf public/images`. `compgen` is a bash builtin that doesn't exist in zsh, so every `mv` silently failed — but the loop still exited 0, so the `rm -rf` ran and destroyed 38 source PNGs (an evening of the user selecting and cropping). FileVault ruled out disk carving, there was no Time Machine destination, APFS snapshots predated the files, and `rm -rf` bypasses Trash. Unrecoverable from the machine; only recovered because the images turned out to still exist in a Figma board.
- **Root cause:** Chained a destructive command to a guard I had never verified, in a shell I hadn't confirmed supported it. The failure was printed twelve times in the output and I ran the delete anyway without reading it.
- **Rule:** A destructive command (`rm -rf`, `git checkout --`, overwrite) is ALWAYS its own separate tool call, never `&&`-chained after the step it depends on. Verify the precondition explicitly first — count the files that moved, and compare before/after — then delete. Never assume bash builtins in zsh (`compgen`, `mapfile`, `declare -A`); this environment's shell is zsh. Prefer moving files with an explicit list built in Python over a shell glob guard.

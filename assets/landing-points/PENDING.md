# Landing-point photos — what is still pending

Updated 2026-08-18, branch `routing-adjustments`. Re-check the live count any time with:

```
node scripts/import-landing-images.mjs   # prints "no image yet (N): …"
```

| | Count |
|---|---|
| Landing points in `landingPoints.ts` | 114 |
| **Have a photo** | **96** |
| Pending | 18 |

The client's designer filled the international table's Image column on 2026-08-17 and Hazman
dropped the lot by hand, which cleared the 45 rows that used to be blocked. The old worklists —
"fetchable now", "blocked on client", "already done — 23" — are all spent and have been removed;
`git log` has them if they are ever needed.

**A point with no photo is not broken.** `ExpandedCard` in `LandingPointCallout.tsx` guards the
`<img>` with `{photo && …}`, so the card shrinks to title + coordinates rather than leaving a gap
or showing a broken image. Every entry below renders that way today.

---

## Still pending — 18

**Decided, leave as-is (2):**

- `labuan` — deliberate: MDSCS is struck through on the client board, so this card is title-only by design
- `cochin` — the one row the designer did not supply. Hazman's call on 2026-08-18: leave it

**Never on either client table (16)** — these were never scaffolded a folder, because the client's
tables cover only the systems they own. All belong to the IRU or planned systems:

| System | Points |
|---|---|
| FLAG (IRU) | `songkhla`, `shanghai`, `geoje`, `miura`, `ninomiya`, `aqaba`, `estepona`, `porthcurno` |
| FA-1 (IRU) | `island-park-ny`, `northport-ny`, `plerin`, `skewjack` |
| SMW6 (planned) | `morib` |
| ALC / AUG East (planned) | `sedili-1` |
| CANDLE (planned) | `sedili-2` |
| none | `kuala-muda` — orphan, empty `cableIds`, may not be a real station |

Each needs a sourced photo from somewhere other than the client's board, or a standing decision to
let the card stay title-only. No decision has been asked for yet.

---

## How to fetch one from Figma

The photos are **not** inside the table — `download_assets` on `1107:3363` returns `rawImages: []`.
They are `rounded-rectangle` nodes named `image N` (lowercase) floating over the Image column. All
125 node ids are recorded in `scripts/sources/intl-landing-image-nodes.json`, so no call ever needs
to be spent rediscovering them.

1. Look up the node id — that JSON.
2. Figma MCP `download_assets`, `fileKey: 0rOyiFkKpF5DxLLaV4rSSO`, that node id.
3. Take the `rawImages` entry with the **largest pixel area**. There are usually two: a ~1200px
   original and a ~300px thumbnail. The `export` is a re-render and roughly ties the original.
4. `curl` it into `assets/landing-points/<id>/` under any filename.
5. `node scripts/import-landing-images.mjs`

**Quota warning.** The Starter plan refuses after roughly 2–3 calls. On 2026-08-10 a single table
probe plus one asset pull exhausted it — `alexandria` was the only photo that got through. Budget
one station per call; copying by hand off the board is far faster than waiting on MCP.

## Gotchas worth not relearning

- **Parent-relative coordinates.** In a `get_figjam` dump, nested nodes carry x/y relative to their
  parent. Reading them as absolute puts table `1107:3363` at (21840, 552) when its true canvas
  origin is (4576, 58304) — which is how the Image column first looked empty. Accumulate parent
  offsets before filtering by coordinate.
- **Lowercase `image N`.** Grepping for `Image N` matches 15 unrelated nodes and misses all 125.
- **Mersing / Merang** are one letter apart and a photo once landed in the wrong folder. Caught by
  dimensions, not by eye.
- **`cox-bazar`**, not `cox's-bazar` — the only folder name that does not fall straight out of the
  board text.
- Five Malaysian points appear on the *international* table (`melaka`, `penang`, `kuantan`,
  `mersing`, `cherating`) because international systems land there.
- **Only the first photo shows.** The card renders `[0]` and nothing else; a carousel was never
  built. `mersing` holds 3 and `pulau-jerejak` 4, all but one unused.

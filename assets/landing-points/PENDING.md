# Landing-point photos — what is still pending

Generated 2026-08-10, branch `routing-adjustments` (PR #8). Re-check the live count any time with:

```
node scripts/import-landing-images.mjs   # prints "no image yet (N): …"
```

| | Count |
|---|---|
| Landing points in `landingPoints.ts` | 114 |
| **Have a photo** | **23** |
| Pending | 91 |
| └ A. fetchable now from the board | 29 |
| └ B. on the board, Image column empty — blocked on client | 45 |
| └ C. not on the international table at all | 17 |

Ceiling without client action: **52 of 114**.

---

## A. Fetchable now — 29 stations

The board already has 2–4 photos on each of these rows, and the client's sticky says *choose any
one photo*. This is the copy-paste worklist: board rows 1–37, top to bottom.

Drop one image into `assets/landing-points/<folder>/` under any filename, then re-run the import.

| Board row | Landing point | Folder | Photos on board | First image node |
|---|---|---|---|---|
| 2 | Annaba, Algeria | `annaba/` | 2 | `1123:7479` |
| 3 | Bizerte, Tunisia | `bizerte/` | 3 | `1123:7505` |
| 4 | Chennai, India | `chennai/` | 3 | `1123:7568` |
| 5 | Colombo, Sri Lanka | `colombo/` | 2 | `1123:7598` |
| 6 | Cox's Bazar, Bangladesh | `cox-bazar/` | 3 | `1123:7615` |
| 7 | Fujairah, United Arab Emirates | `fujairah/` | 3 | `1123:7641` |
| 8 | Jeddah, Saudi Arabia | `jeddah/` | 3 | `1123:7673` |
| 9 | Karachi, Pakistan | `karachi/` | 2 | `1123:7735` |
| 10 | Marseille, France | `marseille/` | 4 | `1123:7750` |
| 11 | Melaka, Malaysia | `melaka/` | 4 | `1128:7808` |
| 12 | Mumbai, India | `mumbai/` | 3 | `1128:7837` |
| 13 | Palermo, Italy | `palermo/` | 3 | `1128:7877` |
| 14 | Satun, Thailand | `satun/` | 2 | `1128:7933` |
| 15 | Suez, Egypt | `suez/` | 3 | `1130:7954` |
| 16 | Tuas, Singapore | `tuas/` | 3 | `1130:7992` |
| 17 | Abu Talat, Egypt | `abu-talat/` | 2 | `1130:8026` |
| 18 | Catania, Italy | `catania/` | 3 | `1130:8046` |
| 19 | Djibouti City, Djibouti | `djibouti/` | 3 | `1130:8075` |
| 20 | Dumai, Indonesia | `dumai/` | 2 | `1130:8120` |
| 23 | Kuakata, Bangladesh | `kuakata/` | 2 | `1169:8200` |
| 24 | Marmaris, Turkey | `marmaris/` | 3 | `1170:8219` |
| 25 | Matara, Sri Lanka | `matara/` | 2 | `1170:8241` |
| 26 | Medan, Indonesia | `medan/` | 3 | `1171:8281` |
| 28 | Pathein, Myanmar | `pathein/` | 2 | `1171:8333` |
| 29 | Qalhat, Oman | `qalhat/` | 3 | `1172:8357` |
| 30 | Toulon, France | `toulon/` | 2 | `1172:8387` |
| 32 | Yanbu, Saudi Arabia | `yanbu/` | 4 | `1172:8402` |
| 33 | Zafarana, Egypt | `zafarana/` | 2 | `1172:8490` |
| 34 | Barka, Oman | `barka/` | 3 | `1172:8516` |

## B. Blocked on the client — 45 stations

These rows exist on the international table but their Image column is empty. Nothing we can do
until the client adds photos. **Biggest blocker of the three — worth chasing, it includes Okinawa,**
**Penang, Kuantan and the Singapore/HK stations.**

| Board row | Landing point | Folder |
|---|---|---|
| 38 | Penang, Malaysia | `penang/` |
| 39 | Mt Lavinia, Sri Lanka | `mt-lavinia/` |
| 40 | Changi, Singapore | `changi/` |
| 41 | Keawaula, Hawaii, United States | `keawaula/` |
| 42 | La Union, Philippines | `la-union/` |
| 43 | Lantau Island, Hong Kong | `lantau/` |
| 45 | San Luis Obispo, California, United States | `san-luis-obispo/` |
| 46 | Sri Racha, Thailand | `sri-racha/` |
| 47 | Tanguisson Point, Guam | `tanguisson/` |
| 48 | Tungku, Brunei | `tungku/` |
| 49 | Vung Tau, Vietnam | `vung-tau/` |
| 50 | Batangas, Philippines | `batangas/` |
| 51 | Chikura, Japan | `chikura/` |
| 52 | Chongming, China | `chongming/` |
| 53 | Katong, Singapore | `katong/` |
| 54 | Kitaibaraki, Japan | `kitaibaraki/` |
| 55 | Kuantan, Malaysia | `kuantan/` |
| 57 | Pusan, Korea, Rep. | `busan/` |
| 58 | Shantou, China | `shantou/` |
| 59 | Tanshui, Taiwan | `tanshui/` |
| 60 | Shinmaruyama, Japan | `shinmaruyama/` |
| 62 | Tseung Kwan O, Hong Kong | `tseung-kwan-o/` |
| 65 | East Coast, Singapore | `east-coast-sg/` |
| 66 | Daet, Philippine | `daet/` |
| 67 | Okinawa, Japan | `okinawa/` |
| 68 | Batam, Indonesia | `batam/` |
| 74 | Rayong, Thailand | `rayong/` |
| 75 | Sihanoukville, Cambodia | `sihanoukville/` |
| 76 | Equinix Singapore | `singapore-pop/` |
| 78 | Cyber Building Jakarta | `jakarta/` |
| 79 | Abidjan, Côte d'Ivoire | `abidjan/` |
| 80 | Accra, Ghana | `accra/` |
| 81 | Alta Vista, Canary Islands, Spain | `alta-vista/` |
| 82 | Baie Jacotet, Mauritius | `baie-jacotet/` |
| 83 | Cacuaco, Angola | `cacuaco/` |
| 84 | Cochin, India | `cochin/` |
| 85 | Cotonou, Benin | `cotonou/` |
| 86 | Dakar, Senegal | `dakar/` |
| 87 | Douala, Cameroon | `douala/` |
| 88 | Lagos, Nigeria | `lagos/` |
| 89 | Libreville, Gabon | `libreville/` |
| 91 | Melkbosstrand, South Africa | `melkbosstrand/` |
| 92 | Mtunzini, South Africa | `mtunzini/` |
| 93 | Sesimbra, Portugal | `sesimbra/` |
| 94 | St Paul, La Reunion | `st-paul-reunion/` |

## C. No source at all — 17 stations

On neither the international nor the domestic table. Each needs a sourced photo, or a decision to
let the card show title + coordinates only (which is what it does today).

**Malaysia (5):**

- `labuan` — Labuan, Malaysia — deliberate: MDSCS is struck through on the client board, so this card is title-only by design
- `kuala-muda` — Kuala Muda, Malaysia — known orphan point, may not be a real station
- `morib` — Morib, Malaysia
- `sedili-1` — Sedili CLS1, Malaysia
- `sedili-2` — Sedili CLS2, Malaysia

**International (12)** — mostly the FLAG / FA-1 IRU systems, which the client's
international table does not cover:

`songkhla`, `shanghai`, `geoje`, `miura`, `ninomiya`, `island-park-ny`, `northport-ny`, `aqaba`, `plerin`, `estepona`, `porthcurno`, `skewjack`

---

## How to fetch one from Figma

The photos are **not** inside the table — `download_assets` on `1107:3363` returns `rawImages: []`.
They are `rounded-rectangle` nodes named `image N` (lowercase) floating over the Image column. All
125 node ids are recorded in `scripts/sources/intl-landing-image-nodes.json`, so no call ever needs
to be spent rediscovering them.

1. Look up the node id — table above, or that JSON.
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

## Already done — 23

`alexandria`, `bayan-baru`, `bintulu`, `cherating`, `jeram`, `kota-kinabalu`, `kuala-besut`, `kuala-perlis`, `kuching`, `langkawi`, `lumut`, `merang`, `mersing`, `miri`, `pulau-jerejak`, `pulau-ketam`, `pulau-pangkor`, `pulau-perhentian`, `pulau-redang`, `pulau-tioman`, `rompin`, `seberang-jaya`, `sg-lima`

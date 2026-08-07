# Landing-point photos — drop zone

Drop images into the folder named after the landing point, then run:

```
node scripts/import-landing-images.mjs
```

That converts them to web-sized WebP in `public/images/landing-points/` and
regenerates `src/data/landingPointImages.ts`. The expanded landing-point card
reads the manifest; a point with no image just renders title + coordinates.

Any filename works — output is renamed `1.webp`, `2.webp`, … in drop order
(shortest filename first, so a pasted `image.png` beats `image copy.png`).
`.png`, `.jpg` and `.webp` sources are picked up.

## What's committed

**Only the WebP output is in git.** Sources here are gitignored: they land as
~2000px screenshots at 2–5 MB each, and 23 stations' worth came to ~100 MB —
more than the entire rest of the app. Keep your own copy of the originals; the
committed WebP is what the build ships.

## Folders

One per landing point, named with the `id` from `src/data/landingPoints.ts`.
23 folders cover all 29 rows of the client's `temp/cablesystem/domestic.csv` —
MDSCS and SKRM share six stations, which get one folder each, not two.

| Folder | Landing point | Systems |
|---|---|---|
| `mersing/` | Mersing, Malaysia | MDSCS, SKRM |
| `kuching/` | Kuching, Malaysia | MDSCS, SKRM |
| `miri/` | Miri, Malaysia | MDSCS, SKRM |
| `labuan/` | Labuan, Malaysia | MDSCS |
| `kota-kinabalu/` | Kota Kinabalu (Tg Aru), Malaysia | MDSCS, SKRM |
| `cherating/` | Cherating, Malaysia | MDSCS, SKRM |
| `bintulu/` | Bintulu, Malaysia | MDSCS, SKRM |
| `bayan-baru/` | Bayan Baru, Penang | BPS |
| `pulau-jerejak/` | Pulau Jerejak, Penang | BPS |
| `seberang-jaya/` | Seberang Jaya, Penang | BPS |
| `kuala-perlis/` | Kuala Perlis, Malaysia | LKP |
| `langkawi/` | Langkawi, Malaysia | LKP |
| `lumut/` | Lumut, Malaysia | Stingray (Pangkor) |
| `pulau-pangkor/` | Pulau Pangkor, Malaysia | Stingray (Pangkor) |
| `rompin/` | Rompin, Malaysia | Stingray (Tioman) |
| `pulau-tioman/` | Pulau Tioman, Malaysia | Stingray (Tioman) |
| `kuala-besut/` | Kuala Besut, Malaysia | Stingray (Perhentian) |
| `pulau-perhentian/` | Pulau Perhentian, Malaysia | Stingray (Perhentian) |
| `jeram/` | Jeram, Malaysia | Stingray II (Ketam) |
| `sg-lima/` | Sungai Lima, Malaysia | Stingray II (Ketam) |
| `pulau-ketam/` | Pulau Ketam, Malaysia | Stingray II (Ketam) |
| `merang/` | Merang, Malaysia | Stingray II (Redang) |
| `pulau-redang/` | Pulau Redang, Malaysia | Stingray II (Redang) |

The client sheet lists the Sabah point as "Tanjung Aru"; we carry it as
"Kota Kinabalu (Tg Aru)" under `kota-kinabalu`. Same station.

Nothing stops you adding folders for international landing points — the card
looks up by id, so any id in `landingPoints.ts` works.


## International folders

The client's international table is FigJam node `1107:3363` on board
`0rOyiFkKpF5DxLLaV4rSSO` — 94 landing-point rows across 4 columns (no., cable
system, landing point, Image). Every row below was matched to a `landingPoints.ts`
id by exact name, then cross-checked against that point's `cableIds` to be sure
the row's cable actually lands there: **94/94 matched, 0 cross-check failures.**

Nine rows needed an alias because the board's wording differs from ours —
`Kalba, Fujairah`→`fujairah`, `Pusan, Korea, Rep.`→`busan`, `Tanshui`→`tanshui`
(we carry it as Tamsui), `Daet, Philippine`→`daet`, `Equinix Singapore`→
`singapore-pop`, `Graha Pena Batam`→`batam`, `Cyber Building Jakarta`→`jakarta`,
and the two three-part US names.

**Pick one image per row and drop it into the folder in the last column.** 94 rows
collapse to 77 stations: some stations carry several cables and so appear on
several rows, and those only need one photo. Rows marked *same station as row N*
are already covered by an earlier row — skip them. That leaves **75 folders to
fill**: of the 77 stations, only `mersing` and `cherating` already carry a photo
from the domestic pass. Note that five Malaysian points appear in this
international table — `melaka`, `penang`, `kuantan`, `mersing`, `cherating` —
because international systems land there; the first three still need a photo.

| Row | Cable | Board location | Folder | Note |
|---|---|---|---|---|
| 1 | SEA-ME-WE 4 | Alexandria, Egypt | `alexandria/` |  |
| 2 | SEA-ME-WE 4 | Annaba, Algeria | `annaba/` |  |
| 3 | SEA-ME-WE 4 | Bizerte, Tunisia | `bizerte/` |  |
| 4 | SEA-ME-WE 4 | Chennai, India | `chennai/` |  |
| 5 | SEA-ME-WE 4 | Colombo, Sri Lanka | `colombo/` |  |
| 6 | SEA-ME-WE 4 | Cox's Bazar, Bangladesh | `cox-bazar/` |  |
| 7 | SEA-ME-WE 4 | Fujairah, United Arab Emirates | `fujairah/` |  |
| 8 | SEA-ME-WE 4 | Jeddah, Saudi Arabia | `jeddah/` |  |
| 9 | SEA-ME-WE 4 | Karachi, Pakistan | `karachi/` |  |
| 10 | SEA-ME-WE 4 | Marseille, France | `marseille/` |  |
| 11 | SEA-ME-WE 4 | Melaka, Malaysia | `melaka/` |  |
| 12 | SEA-ME-WE 4 | Mumbai, India | `mumbai/` |  |
| 13 | SEA-ME-WE 4 | Palermo, Italy | `palermo/` |  |
| 14 | SEA-ME-WE 4 | Satun, Thailand | `satun/` |  |
| 15 | SEA-ME-WE 4 | Suez, Egypt | `suez/` |  |
| 16 | SEA-ME-WE 4 | Tuas, Singapore | `tuas/` |  |
| 17 | SEA-ME-WE 5 | Abu Talat, Egypt | `abu-talat/` |  |
| 18 | SEA-ME-WE 5 | Catania, Italy | `catania/` |  |
| 19 | SEA-ME-WE 5 | Djibouti City, Djibouti | `djibouti/` |  |
| 20 | SEA-ME-WE 5 | Dumai, Indonesia | `dumai/` |  |
| 21 | SEA-ME-WE 5 | Kalba, Fujairah | `fujairah/` | same station as row 7 |
| 22 | SEA-ME-WE 5 | Karachi, Pakistan | `karachi/` | same station as row 9 |
| 23 | SEA-ME-WE 5 | Kuakata, Bangladesh | `kuakata/` |  |
| 24 | SEA-ME-WE 5 | Marmaris, Turkey | `marmaris/` |  |
| 25 | SEA-ME-WE 5 | Matara, Sri Lanka | `matara/` |  |
| 26 | SEA-ME-WE 5 | Medan, Indonesia | `medan/` |  |
| 27 | SEA-ME-WE 5 | Melaka, Malaysia | `melaka/` | same station as row 11 |
| 28 | SEA-ME-WE 5 | Pathein, Myanmar | `pathein/` |  |
| 29 | SEA-ME-WE 5 | Qalhat, Oman | `qalhat/` |  |
| 30 | SEA-ME-WE 5 | Toulon, France | `toulon/` |  |
| 31 | SEA-ME-WE 5 | Tuas, Singapore | `tuas/` | same station as row 16 |
| 32 | SEA-ME-WE 5 | Yanbu, Saudi Arabia | `yanbu/` |  |
| 33 | SEA-ME-WE 5 | Zafarana, Egypt | `zafarana/` |  |
| 34 | BBG | Barka, Oman | `barka/` |  |
| 35 | BBG | Chennai, India | `chennai/` | same station as row 4 |
| 36 | BBG | Fujairah, United Arab Emirates | `fujairah/` | same station as row 7 |
| 37 | BBG | Mumbai, India | `mumbai/` | same station as row 12 |
| 38 | BBG | Penang, Malaysia | `penang/` |  |
| 39 | BBG | Mt Lavinia, Sri Lanka | `mt-lavinia/` |  |
| 40 | AAG | Changi, Singapore | `changi/` |  |
| 41 | AAG | Keawaula, Hawaii, United States | `keawaula/` |  |
| 42 | AAG | La Union, Philippines | `la-union/` |  |
| 43 | AAG | Lantau Island, Hong Kong | `lantau/` |  |
| 44 | AAG | Mersing, Malaysia | `mersing/` | already has a photo |
| 45 | AAG | San Luis Obispo, California, United States | `san-luis-obispo/` |  |
| 46 | AAG | Sri Racha, Thailand | `sri-racha/` |  |
| 47 | AAG | Tanguisson Point, Guam | `tanguisson/` |  |
| 48 | AAG | Tungku, Brunei | `tungku/` |  |
| 49 | AAG | Vung Tau, Vietnam | `vung-tau/` |  |
| 50 | APCN-2 | Batangas, Philippines | `batangas/` |  |
| 51 | APCN-2 | Chikura, Japan | `chikura/` |  |
| 52 | APCN-2 | Chongming, China | `chongming/` |  |
| 53 | APCN-2 | Katong, Singapore | `katong/` |  |
| 54 | APCN-2 | Kitaibaraki, Japan | `kitaibaraki/` |  |
| 55 | APCN-2 | Kuantan, Malaysia | `kuantan/` |  |
| 56 | APCN-2 | Lantau Island, Hong Kong | `lantau/` | same station as row 43 |
| 57 | APCN-2 | Pusan, Korea, Rep. | `busan/` |  |
| 58 | APCN-2 | Shantou, China | `shantou/` |  |
| 59 | APCN-2 | Tanshui, Taiwan | `tanshui/` |  |
| 60 | CM | Shinmaruyama, Japan | `shinmaruyama/` |  |
| 61 | CM | Mersing, Malaysia | `mersing/` | already has a photo |
| 62 | CM | Tseung Kwan O, Hong Kong | `tseung-kwan-o/` |  |
| 63 | CM | Shinmaruyama, Japan | `shinmaruyama/` | same station as row 60 |
| 64 | CM | Tseung Kwan O, Hong Kong | `tseung-kwan-o/` | same station as row 62 |
| 65 | CM | East Coast, Singapore | `east-coast-sg/` |  |
| 66 | CM | Daet, Philippine | `daet/` |  |
| 67 | CM | Okinawa, Japan | `okinawa/` |  |
| 68 | BDM | Batam, Indonesia | `batam/` |  |
| 69 | BDM | Dumai, Indonesia | `dumai/` | same station as row 20 |
| 70 | BDM | Melaka, Malaysia | `melaka/` | same station as row 11 |
| 71 | DMCS | Dumai, Indonesia | `dumai/` | same station as row 20 |
| 72 | DMCS | Melaka, Malaysia | `melaka/` | same station as row 11 |
| 73 | MCT | Cherating, Malaysia | `cherating/` | already has a photo |
| 74 | MCT | Rayong, Thailand | `rayong/` |  |
| 75 | MCT | Sihanoukville, Cambodia | `sihanoukville/` |  |
| 76 | NuGate | Equinix Singapore | `singapore-pop/` |  |
| 77 | NuGate | Graha Pena Batam | `batam/` | same station as row 68 |
| 78 | NuGate | Cyber Building Jakarta | `jakarta/` |  |
| 79 | SAT3-WASC-SAFE | Abidjan, Côte d'Ivoire | `abidjan/` |  |
| 80 | SAT3-WASC-SAFE | Accra, Ghana | `accra/` |  |
| 81 | SAT3-WASC-SAFE | Alta Vista, Canary Islands, Spain | `alta-vista/` |  |
| 82 | SAT3-WASC-SAFE | Baie Jacotet, Mauritius | `baie-jacotet/` |  |
| 83 | SAT3-WASC-SAFE | Cacuaco, Angola | `cacuaco/` |  |
| 84 | SAT3-WASC-SAFE | Cochin, India | `cochin/` |  |
| 85 | SAT3-WASC-SAFE | Cotonou, Benin | `cotonou/` |  |
| 86 | SAT3-WASC-SAFE | Dakar, Senegal | `dakar/` |  |
| 87 | SAT3-WASC-SAFE | Douala, Cameroon | `douala/` |  |
| 88 | SAT3-WASC-SAFE | Lagos, Nigeria | `lagos/` |  |
| 89 | SAT3-WASC-SAFE | Libreville, Gabon | `libreville/` |  |
| 90 | SAT3-WASC-SAFE | Penang, Malaysia | `penang/` | same station as row 38 |
| 91 | SAT3-WASC-SAFE | Melkbosstrand, South Africa | `melkbosstrand/` |  |
| 92 | SAT3-WASC-SAFE | Mtunzini, South Africa | `mtunzini/` |  |
| 93 | SAT3-WASC-SAFE | Sesimbra, Portugal | `sesimbra/` |  |
| 94 | SAT3-WASC-SAFE | St Paul, La Reunion | `st-paul-reunion/` |  |

### Status

Empty as of 2026-08-07 — the Figma MCP quota ran out before any international
image could be pulled, so all 75 folders are scaffolded but unfilled. Drop the
images in and run `node scripts/import-landing-images.mjs`; nothing else needs
changing, because the card looks photos up by id.

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

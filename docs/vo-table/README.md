# Kiosk narration — where everything lives

## Audition pages (listen to every clip)

- **English** — https://claude.ai/code/artifact/0295835e-ffa7-4ee7-8dc8-d7b386e05384
- **Bahasa Malaysia** — https://claude.ai/code/artifact/1462ef1c-c164-41db-b296-b925c56472ba

Each page carries all 32 clips for its language, playable in the browser with the
script text, length and pace beside them. Audio is embedded, so a page is a
single file — forwardable as-is.

## The files

| What | Where |
|---|---|
| Narration script, for the client | `docs/vo-table/vo-script.md` |
| Same thing, machine-readable | `docs/vo-table/vo-script.json` |
| Shipped audio | `public/audio/vo/<lang>/*.mp3` |
| Unit → file, duration, take hash | `src/data/voManifest.json` |
| WAV masters | `temp/voiceover/render/<lang>/` (gitignored) |
| The client's own CSVs | `info.csv`, `system.csv` — **do not source from these**, see the header of `scripts/buildVoScript.ts` |

Copy itself lives in `src/data/generalInfo.ts` and `src/data/cables.ts`, both
bilingual. Nothing here is hand-written — regenerate rather than edit.

## The commands

```bash
npx tsx scripts/buildVoScript.ts                          # script, after any copy change
node scripts/renderVoiceover.mjs --lang=bm --block=cables --tempo=1.15
node scripts/verifyVoiceover.mjs --lang=bm                # ALWAYS run this
node scripts/buildAuditionPage.mjs --lang=bm              # rebuild the page above
```

`--dry-run` shows what would render, `--only=a,b` narrows, `--force` overrides
the take hash, `--reencode` retunes the audio chain off the masters with no API
call and no new take.

## Two things that will bite you

**Roughly one take in five comes back wrong** — a sentence that is not in the
script, or the whole description spoken twice. It never shows in a waveform, a
duration or a loudness figure. Run `verifyVoiceover.mjs`; it transcribes each
clip back and word-diffs it against the script. Re-render anything it flags.

**A re-render is a different take, not a patch.** The engine is not
reproducible. The manifest stores a hash of each unit's spoken text so a re-run
only touches units whose copy actually changed — which is why a one-word edit
costs one clip rather than the set.

## Republishing an audition page

Rebuild it, then publish that same file path to the **same URL above** so the
link people already have keeps working. Publishing without the URL creates a
second artifact instead of updating the first.

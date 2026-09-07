/* Voiceover script builder — emits the narration script from the app's own copy,
 * so the script can never drift from what the kiosk actually shows.
 *
 * Run:  npx tsx scripts/buildVoScript.ts            (writes docs/vo-table/vo-script.md)
 *       npx tsx scripts/buildVoScript.ts --stdout   (print instead of write)
 *
 * Output is plain Markdown, formatted to survive a Markdown-to-PDF conversion:
 * no emoji, no nesting past three heading levels, segment blocks that break
 * cleanly across pages.
 *
 * Sources, deliberately NOT the client's CSVs in docs/vo-table/. Those sheets
 * still carry four transcription errors that were caught and corrected on
 * 2026-08-03 — "Cable Malaysia" for Cahaya Malaysia, SMW4 at 18,800 km against
 * its own 20,000 km column, CM at 8 landing points instead of 6, and "Submarine
 * Kabel Rakyat 1Malaysia" for Sistem Kabel Rakyat Malaysia. Narrating the sheet
 * would put TM's own cable name wrong in the audio.
 *   - src/data/generalInfo.ts   info panel, already bilingual
 *   - src/data/cables.ts        cable descriptions, bilingual since 2026-08-28
 */
import { writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";
import { getInfoTabs } from "@/data/generalInfo";
import { cables } from "@/data/cables";

const REPO = path.resolve(import.meta.dirname, "..");
const OUT = path.join(REPO, "docs/vo-table/vo-script.md");
/** Machine-readable twin of OUT. The renderer reads this rather than
 * re-walking the sources, so recorded audio cannot drift from the script
 * the client signed off. */
const OUT_JSON = path.join(REPO, "docs/vo-table/vo-script.json");

/** Spoken pace assumed for every estimate below. Adjust once, here. */
const WPM = 145;

const words = (s: string) => s.trim().split(/\s+/).filter(Boolean).length;
const secs = (s: string) => (words(s) / WPM) * 60;
const clock = (s: number) =>
  `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;

type Segment = {
  ref: string;
  where: string;
  en: string;
  bm: string;
  /** false when the BM is ours/drafted rather than client-supplied. */
  bmApproved: boolean;
};

const segments: Segment[] = [];
/** Prose deliberately not narrated — summarised in one line so the cut is on record. */
const skipped: string[] = [];

// ── Info panel ────────────────────────────────────────────────────────────────
// getInfoTabs resolves every {en,bm} pair down to one language, so walking the
// two trees in parallel re-pairs them. Same shape both times — the resolver only
// collapses leaves.
const en = getInfoTabs("en");
const bm = getInfoTabs("bm");

// Every BM string in this tab is ours, pending client sign-off; the client's
// sheet left "Then And Now" entirely in English.
const OURS_BM_TABS = new Set(["then-and-now"]);

en.forEach((tab, t) => {
  const tabBm = bm[t];

  tab.screens.forEach((screen, s) => {
    const screenBm = tabBm.screens[s] as Record<string, unknown>;
    const scr = screen as Record<string, unknown>;
    const where = `${tab.label} > ${screen.id}`;
    const ref = `${tab.id}/${screen.id}`;
    const oursBm = OURS_BM_TABS.has(tab.id);

    const push = (suffix: string, enText: string, bmText: string) =>
      segments.push({
        ref: `${ref}${suffix}`,
        where,
        en: enText,
        bm: bmText,
        bmApproved: !oursBm,
      });

    // Titles read as spoken headings; body/description/note are the prose.
    if (typeof scr.title === "string" && screen.kind !== "video") {
      push("#title", scr.title, screenBm.title as string);
    }
    if (Array.isArray(scr.body)) {
      (scr.body as string[]).forEach((para, i) =>
        push(`#body${i + 1}`, para, (screenBm.body as string[])[i]),
      );
    }
    if (typeof scr.description === "string") {
      push("#description", scr.description, screenBm.description as string);
    }
    if (typeof scr.note === "string") {
      push("#note", scr.note, screenBm.note as string);
    }

    // Tabular and on-screen-label content — cut from narration on Hazman's call
    // 2026-08-18. Tracked so the omission stays on record rather than silent.
    if (Array.isArray(scr.rows)) {
      skipped.push(`${(scr.rows as unknown[]).length} cutaway layer rows`);
    }
    if (Array.isArray(scr.facts)) {
      skipped.push(`${(scr.facts as unknown[]).length} tree-information rows`);
    }
    if (Array.isArray(scr.specs) && (scr.specs as unknown[]).length) {
      const era = screen.id.charAt(0).toUpperCase() + screen.id.slice(1);
      skipped.push(`${(scr.specs as unknown[]).length} ${era} spec rows`);
    }
    if (screen.kind === "video") {
      skipped.push(`the "${scr.title}" video screen`);
    }
  });
});

const infoSegments = [...segments];

// ── Cable systems ─────────────────────────────────────────────────────────────
// 20 descriptions came off the client's sheet and read as narration. Six are
// ours and read as terse internal notes — flagged rather than silently mixed in.
const CLIENT_SHEET_CABLES = new Set([
  "smw4", "smw5", "bbg", "aag", "apcn2", "cm", "bdm", "dmcs", "mct", "nugate",
  "sat3-wasc-safe", "mdscs", "bps", "langkawi-perlis", "skr1m",
  "stingray-pangkor", "stingray-tioman", "stingray-perhentian",
  "stingray2-ketam", "stingray2-redang",
]);

const cableSegments: (Segment & { short: string; ours: boolean })[] = [];
const missingBm: string[] = [];

cables.forEach((cable) => {
  if (!cable.description?.en) return;
  if (!cable.description.bm) missingBm.push(cable.id);
  cableSegments.push({
    ref: `cable/${cable.id}`,
    where: cable.shortName,
    short: cable.shortName,
    en: cable.description.en,
    bm: cable.description.bm || "— NO BM —",
    bmApproved: false, // every cable BM is a draft; none has been signed off
    ours: !CLIENT_SHEET_CABLES.has(cable.id),
  });
});

// ── Emit ──────────────────────────────────────────────────────────────────────
const total = (rows: { en: string; bm: string }[], lang: "en" | "bm") =>
  rows.reduce((n, r) => n + secs(r[lang]), 0);

const all = [...infoSegments, ...cableSegments];
const pendingInfo = infoSegments.filter((s) => !s.bmApproved).length;
const oursCables = cableSegments.filter((c) => c.ours);

const L: string[] = [];
const w = (s = "") => L.push(s);

const block = (
  ref: string,
  enText: string,
  bmText: string,
  status: string,
  flag?: string,
) => {
  w(
    `**${ref}** — ${words(enText)}w / ${clock(secs(enText))} EN · ` +
      `${words(bmText)}w / ${clock(secs(bmText))} BM — ${status}` +
      (flag ? ` — ${flag}` : ""),
  );
  w();
  w(`> **EN** — ${enText}`);
  w();
  w(`> **BM** — ${bmText}`);
  w();
};

w("# Kiosk voiceover — narration script");
w();
w("TM Submarine Cable touchwall. Bahasa Malaysia and English, per segment.");
w();
w(`Pace assumed throughout: **${WPM} words per minute**.`);
w();

w("## Totals");
w();
w("| Block | Segments | EN | BM |");
w("|---|---|---|---|");
w(
  `| Info panel | ${infoSegments.length} | ${clock(total(infoSegments, "en"))} | ${clock(total(infoSegments, "bm"))} |`,
);
w(
  `| Cable systems | ${cableSegments.length} | ${clock(total(cableSegments, "en"))} | ${clock(total(cableSegments, "bm"))} |`,
);
w(
  `| **Total** | **${all.length}** | **${clock(total(all, "en"))}** | **${clock(total(all, "bm"))}** |`,
);
w();
w(
  `Both languages together: **${clock(total(all, "en") + total(all, "bm"))}** of finished audio.`,
);
w();

w("## Before recording");
w();
w(
  `1. **${pendingInfo} of ${infoSegments.length}** info-panel segments carry BM written by us, not the client. Pending TM sign-off.`,
);
w(
  `2. **All ${cableSegments.length}** cable-system BM strings are drafts written for this script. The source data holds English only. None is approved.`,
);
w(
  `3. **${oursCables.length} cable descriptions** — ${oursCables.map((c) => c.short).join(", ")} — were written by us as internal notes rather than supplied by the client. They read tersely and should be rewritten in narration register before recording.`,
);
if (missingBm.length) w(`4. **Missing BM entirely:** ${missingBm.join(", ")}.`);
w();
w(
  "Recording unapproved copy means re-rendering it later. TTS output is not reproducible, " +
    "so a re-render is a different take, not a patch.",
);
w();
if (skipped.length) {
  w(
    `**Not narrated**, by decision: ${[...new Set(skipped)].join(", ")}. These are tables, ` +
      "on-screen labels, or clips carrying their own audio.",
  );
  w();
}

w("---");
w();
w("## 1. Info panel");
w();
let lastWhere = "";
infoSegments.forEach((s) => {
  if (s.where !== lastWhere) {
    w(`### ${s.where}`);
    w();
    lastWhere = s.where;
  }
  block(
    s.ref,
    s.en,
    s.bm,
    s.bmApproved ? "client copy" : "BM PENDING SIGN-OFF",
  );
});

w("---");
w();
w("## 2. Cable systems");
w();
w(
  `Played when a cable is selected. ${cableSegments.length} segments, averaging ` +
    `${clock(total(cableSegments, "en") / cableSegments.length)} each in English.`,
);
w();
cableSegments.forEach((s) => {
  w(`### ${s.short}`);
  w();
  block(
    s.ref,
    s.en,
    s.bm,
    "BM DRAFT",
    s.ours ? "EN is ours, not client copy" : undefined,
  );
});

w("---");
w();
w(
  "Generated by `scripts/buildVoScript.ts` from the app's own copy. Re-run after any " +
    "copy change rather than editing this file. Nothing here has been recorded.",
);
w();

const out = L.join("\n");

// Flat segment list for scripts/renderVoiceover.mjs. Unit = the ref up to "#":
// one info screen or one cable, which is how narration is recorded and played.
const json = {
  generatedBy: "scripts/buildVoScript.ts",
  wpm: WPM,
  segments: all.map((s) => ({
    ref: s.ref,
    where: s.where,
    en: s.en,
    bm: s.bm,
    bmApproved: s.bmApproved,
    ours: "ours" in s ? (s as { ours: boolean }).ours : false,
  })),
};
mkdirSync(path.dirname(OUT_JSON), { recursive: true });
writeFileSync(OUT_JSON, JSON.stringify(json, null, 2) + "\n");

if (process.argv.includes("--stdout")) {
  console.log(out);
} else {
  mkdirSync(path.dirname(OUT), { recursive: true });
  writeFileSync(OUT, out);
  console.log(`${all.length} segments -> ${path.relative(REPO, OUT)}`);
  console.log(
    `  info panel ${infoSegments.length} (${clock(total(infoSegments, "en"))} EN / ${clock(total(infoSegments, "bm"))} BM)`,
  );
  console.log(
    `  cables     ${cableSegments.length} (${clock(total(cableSegments, "en"))} EN / ${clock(total(cableSegments, "bm"))} BM)`,
  );
  console.log(
    `  both languages together: ${clock(total(all, "en") + total(all, "bm"))}`,
  );
  if (missingBm.length) console.log(`  MISSING BM: ${missingBm.join(", ")}`);
}

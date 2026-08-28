/**
 * Builds a self-contained audition page for a rendered narration language.
 *
 * Thirty-two clips is too many to review as individual files, so this puts them
 * on one page: the exact words each clip should say, its length and pace, and a
 * transport that plays a whole section straight through. Audio is embedded as
 * data URIs so the page can be shared as a single file with nothing alongside.
 *
 *   node scripts/buildAuditionPage.mjs --lang=en
 *
 * Output: temp/voiceover/audition-<lang>.html (gitignored — it carries the audio).
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { join } from "node:path";

const argv = process.argv.slice(2);
const lang = argv.find((a) => a.startsWith("--lang="))?.split("=")[1] ?? "en";

const manifest = JSON.parse(readFileSync("public/audio/vo/manifest.json", "utf8"));
const script = JSON.parse(readFileSync("docs/vo-table/vo-script.json", "utf8"));
const units = manifest.units?.[lang];
if (!units) throw new Error(`nothing rendered for ${lang}`);

/** Per-cable identity colours, straight from the app so the page matches it. */
const colorsTs = readFileSync("src/lib/colors.ts", "utf8");
const cableColors = Object.fromEntries(
  [...colorsTs.matchAll(/^\s*"?([a-z0-9-]+)"?:\s*"(#[0-9A-Fa-f]{6})"/gm)].map((m) => [m[1], m[2]]),
);

/**
 * Script text, plus the provenance flag that actually matters for the language
 * being reviewed. In English that is copy we wrote rather than the client's; in
 * Malay it is copy TM has not signed off, which is nearly all of it.
 */
const LANGS = {
  en: { name: "English", title: "TM Narration Audition", flagLabel: "our copy",
        flagged: (s) => s.ours },
  bm: { name: "Bahasa Malaysia", title: "Audisyen Naratif TM", flagLabel: "not signed off",
        flagged: (s) => !s.bmApproved },
};
const L = LANGS[lang];
if (!L) throw new Error(`unknown --lang=${lang}`);

const text = new Map();
const flagged = new Set();
for (const seg of script.segments) {
  const ref = seg.ref.split("#")[0];
  text.set(ref, [...(text.get(ref) ?? []), seg[lang]]);
  if (L.flagged(seg)) flagged.add(ref);
}

const clock = (s) => `${Math.floor(s / 60)}:${String(Math.round(s % 60)).padStart(2, "0")}`;
const esc = (s) =>
  String(s).replace(/[&<>"]/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;" })[c]);

const rows = Object.entries(units).map(([ref, u]) => {
  const id = ref.replace(/[^a-z0-9]/gi, "-");
  const wpm = Math.round((u.words / u.seconds) * 60);
  const cableId = ref.startsWith("cable/") ? ref.slice(6) : null;
  return {
    ref,
    id,
    wpm,
    seconds: u.seconds,
    words: u.words,
    parts: text.get(ref) ?? [],
    flagged: flagged.has(ref),
    cable: cableId,
    color: cableId ? cableColors[cableId] ?? "#034DA1" : "#034DA1",
    b64: readFileSync(join("public/audio/vo", u.file)).toString("base64"),
  };
});

const info = rows.filter((r) => !r.cable);
const cables = rows.filter((r) => r.cable);
const totalSecs = rows.reduce((n, r) => n + r.seconds, 0);
const totalWords = rows.reduce((n, r) => n + r.words, 0);

/** Label a clip's pace against the set, since pace is the open question. */
const paceClass = (wpm) => (wpm >= 140 ? "fast" : wpm <= 95 ? "slow" : "");

const row = (r, i) => `
<article class="clip${r.flagged ? " clip--flagged" : ""}" id="${r.id}" data-i="${i}"
         data-src="data:audio/mpeg;base64,${r.b64}" tabindex="0"
         aria-label="Play ${esc(r.ref)}">
  <span class="clip__bar" style="--dot:${r.color}"></span>
  <div class="clip__head">
    <span class="clip__ref">${esc(r.ref)}</span>
    <span class="clip__meta">
      <span class="stat">${clock(r.seconds)}</span>
      <span class="stat stat--${paceClass(r.wpm)}">${r.wpm} wpm</span>
      <span class="stat stat--dim">${r.words}w</span>
      ${r.flagged ? `<span class="tag">${esc(L.flagLabel)}</span>` : ""}
    </span>
  </div>
  <div class="clip__text">${r.parts.map((p) => `<p>${esc(p)}</p>`).join("")}</div>
  <div class="clip__wave" aria-hidden="true"><i></i></div>
</article>`;

const section = (title, note, list, offset) => `
<section class="block">
  <header class="block__head">
    <h2>${esc(title)}</h2>
    <p>${esc(note)}</p>
    <button class="playall" data-from="${offset}">Play through</button>
  </header>
  ${list.map((r, i) => row(r, offset + i)).join("")}
</section>`;

const html = `<title>${esc(L.title)}</title>
<link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=Chakra+Petch:wght@500;600;700&family=Rajdhani:wght@400;500;600&family=IBM+Plex+Mono:wght@400;500&display=swap">
<style>
/* Committed single-theme design: this page wears the kiosk's own v1.0
   tactical-HUD palette, so it reads as the product rather than as a document
   about it. Every colour is painted explicitly — nothing inherits the host. */
:root{
  --bg:#040E1F;
  --line:rgba(3,77,161,.42); --line2:rgba(3,77,161,.20);
  --blue-lit:#0362A1;
  --orange:#F05A22; --green:#8FFF3F;
  --fg:#F1F7FF; --mute:#C4C4C4; --dim:#6E7F98;
  --display:"Chakra Petch",system-ui,sans-serif;
  --body:"Rajdhani",system-ui,sans-serif;
  --mono:"IBM Plex Mono",ui-monospace,monospace;
}
*{box-sizing:border-box}
body{
  margin:0; background:var(--bg); color:var(--fg);
  font-family:var(--body); font-size:17px; line-height:1.5;
  padding-bottom:104px;
  background-image:linear-gradient(180deg,#061630 0%,#040E1F 46%);
  background-repeat:no-repeat; background-size:100% 620px;
}
.wrap{max-width:1080px; margin:0 auto; padding:0 24px}

/* ── masthead ─────────────────────────────────────────────── */
.top{padding:56px 0 28px}
.eyebrow{
  font-family:var(--mono); font-size:11px; letter-spacing:.22em;
  text-transform:uppercase; color:var(--blue-lit); margin:0 0 14px;
}
h1{
  font-family:var(--display); font-weight:700; font-size:clamp(30px,4.4vw,46px);
  line-height:1.04; letter-spacing:-.01em; margin:0; text-wrap:balance;
}
.sub{color:var(--mute); margin:12px 0 0; max-width:62ch}
.facts{
  display:flex; flex-wrap:wrap; gap:0; margin:30px 0 0;
  border:1px solid var(--line); border-radius:2px; background:rgba(6,22,48,.6);
}
.fact{padding:14px 20px; border-right:1px solid var(--line2); flex:1 1 auto; min-width:132px}
.fact:last-child{border-right:0}
.fact dt{
  font-family:var(--mono); font-size:10px; letter-spacing:.18em;
  text-transform:uppercase; color:var(--dim); margin:0 0 5px;
}
.fact dd{
  margin:0; font-family:var(--display); font-weight:600; font-size:20px;
  font-variant-numeric:tabular-nums;
}
.fact dd .unit{font-size:12px; color:var(--mute); font-weight:500; margin-left:3px}
.ok{color:var(--green)}

/* ── sections ─────────────────────────────────────────────── */
.block{margin:44px 0 0}
.block__head{
  display:grid; grid-template-columns:1fr auto; gap:4px 16px;
  align-items:baseline; padding:0 0 12px; border-bottom:1px solid var(--line);
}
.block__head h2{
  font-family:var(--display); font-weight:600; font-size:19px;
  letter-spacing:.04em; text-transform:uppercase; margin:0;
}
.block__head p{
  grid-column:1; margin:0; font-family:var(--mono); font-size:11.5px;
  color:var(--dim); letter-spacing:.04em;
}
.playall{
  grid-row:1 / span 2; grid-column:2; align-self:center;
  font-family:var(--mono); font-size:11px; letter-spacing:.14em;
  text-transform:uppercase; color:var(--fg); background:transparent;
  border:1px solid var(--line); border-radius:2px; padding:9px 15px;
  cursor:pointer; transition:border-color .15s, color .15s, background .15s;
}
.playall:hover,.playall:focus-visible{border-color:var(--orange); color:var(--orange)}

/* ── clip rows ────────────────────────────────────────────── */
.clip{
  position:relative; display:grid; gap:8px;
  padding:16px 18px 16px 22px; border-bottom:1px solid var(--line2);
  cursor:pointer; transition:background .16s;
}
.clip:hover{background:rgba(3,77,161,.10)}
.clip:focus-visible{outline:2px solid var(--orange); outline-offset:-2px}
.clip__bar{
  position:absolute; left:0; top:16px; bottom:16px; width:3px;
  background:var(--dot); opacity:.5; transition:opacity .16s;
}
.clip:hover .clip__bar{opacity:1}
.clip__head{display:flex; flex-wrap:wrap; gap:8px 18px; align-items:baseline; justify-content:space-between}
.clip__ref{font-family:var(--mono); font-size:13px; letter-spacing:.02em; color:var(--fg)}
.clip__meta{display:flex; gap:14px; align-items:baseline}
.stat{
  font-family:var(--mono); font-size:12px; color:var(--mute);
  font-variant-numeric:tabular-nums;
}
.stat--dim{color:var(--dim)}
.stat--fast{color:var(--orange)}
.stat--slow{color:var(--blue-lit)}
.tag{
  font-family:var(--mono); font-size:9.5px; letter-spacing:.14em;
  text-transform:uppercase; color:var(--dim);
  border:1px solid var(--line); border-radius:2px; padding:2px 7px;
}
.clip__text{color:var(--mute); max-width:74ch}
.clip__text p{margin:0 0 7px}
.clip__text p:last-child{margin:0}
.clip__wave{height:2px; background:var(--line2); overflow:hidden}
.clip__wave i{display:block; height:100%; width:0; background:var(--orange)}

/* playing */
.clip.is-playing{background:rgba(240,90,34,.07)}
.clip.is-playing .clip__bar{background:var(--orange); opacity:1}
.clip.is-playing .clip__ref{color:var(--orange)}

/* ── transport ────────────────────────────────────────────── */
.transport{
  position:fixed; left:0; right:0; bottom:0; z-index:5;
  background:rgba(4,14,31,.94); border-top:1px solid var(--line);
  backdrop-filter:blur(9px);
}
.transport__in{
  max-width:1080px; margin:0 auto; padding:13px 24px;
  display:flex; align-items:center; gap:18px;
}
.tbtn{
  flex:0 0 auto; width:42px; height:42px; border-radius:50%;
  border:1px solid var(--line); background:transparent; color:var(--fg);
  cursor:pointer; display:grid; place-items:center;
  transition:border-color .15s, color .15s;
}
.tbtn:hover,.tbtn:focus-visible{border-color:var(--orange); color:var(--orange)}
.tbtn svg{width:15px; height:15px; fill:currentColor}
.tnow{flex:1 1 auto; min-width:0}
.tnow b{
  display:block; font-family:var(--mono); font-size:12.5px; font-weight:400;
  white-space:nowrap; overflow:hidden; text-overflow:ellipsis;
}
.tnow span{font-family:var(--mono); font-size:10.5px; color:var(--dim); letter-spacing:.1em; text-transform:uppercase}
.ttime{font-family:var(--mono); font-size:12px; color:var(--mute); font-variant-numeric:tabular-nums; flex:0 0 auto}
.tscrub{flex:2 1 260px; height:3px; background:var(--line2); cursor:pointer; position:relative}
.tscrub i{position:absolute; inset:0 auto 0 0; width:0; background:var(--orange)}
@media (max-width:720px){
  .tscrub{display:none}
  .clip__head{gap:6px 12px}
}
@media (prefers-reduced-motion:reduce){*{transition:none!important}}
.foot{
  padding:38px 0 46px; color:var(--dim); font-family:var(--mono);
  font-size:11.5px; line-height:1.75; border-top:1px solid var(--line2); margin-top:44px;
}
</style>

<div class="wrap">
  <header class="top">
    <p class="eyebrow">TM Submarine Cable · Kiosk narration</p>
    <h1>${esc(L.name)} narration, Sulafat</h1>
    <p class="sub">Every clip the kiosk will speak in ${esc(L.name)}, with the exact words it
    should say. Click a row to hear it, or play a whole section straight through. Each clip was
    transcribed back and word-checked against the script before it got here${
      lang === "bm"
        ? " — but the words themselves are still awaiting TM's sign-off, so the copy is under review here as much as the delivery"
        : ""
    }.</p>
    <dl class="facts">
      <div class="fact"><dt>Clips</dt><dd>${rows.length}</dd></div>
      <div class="fact"><dt>Runtime</dt><dd>${clock(totalSecs)}</dd></div>
      <div class="fact"><dt>Pace</dt><dd>${Math.round((totalWords / totalSecs) * 60)}<span class="unit">wpm</span></dd></div>
      <div class="fact"><dt>Speed</dt><dd>1.15<span class="unit">×</span></dd></div>
      <div class="fact"><dt>Level</dt><dd>−16<span class="unit">LUFS</span></dd></div>
      <div class="fact"><dt>Verified</dt><dd class="ok">${rows.length}/${rows.length}</dd></div>
    </dl>
  </header>

  ${section("Info panel", `${info.length} screens · ${clock(info.reduce((n, r) => n + r.seconds, 0))} · plays when a General Information screen is open`, info, 0)}
  ${section("Cable systems", `${cables.length} systems · ${clock(cables.reduce((n, r) => n + r.seconds, 0))} · plays when a cable is selected`, cables, info.length)}

  <p class="foot">
    Voice ${esc(manifest.voice)} · ${esc(manifest.model)} · ${esc(manifest.loudness)} · 64k mono<br>
    Roughly one take in five comes back wrong, so nothing here was accepted without being
    transcribed back and word-checked against the script.<br>
    Pace figures for cable clips run low by design — acronyms read letter by letter take
    time the word count does not show.
  </p>
</div>

<div class="transport">
  <div class="transport__in">
    <button class="tbtn" id="pp" aria-label="Play or pause">
      <svg id="ppi" viewBox="0 0 24 24"><path d="M8 5v14l11-7z"/></svg>
    </button>
    <div class="tnow"><b id="now">Nothing playing</b><span id="nowsub">Select a clip</span></div>
    <div class="tscrub" id="scrub" role="slider" aria-label="Seek" tabindex="0"><i id="scrubi"></i></div>
    <div class="ttime" id="time">0:00</div>
  </div>
</div>

<script>
(function(){
  var clips = Array.prototype.slice.call(document.querySelectorAll(".clip"));
  var audio = new Audio();
  var cur = -1, through = false, stopAt = -1;
  var now = document.getElementById("now"), sub = document.getElementById("nowsub");
  var ppi = document.getElementById("ppi"), time = document.getElementById("time");
  var scrub = document.getElementById("scrub"), scrubi = document.getElementById("scrubi");
  var PLAY = "M8 5v14l11-7z", PAUSE = "M6 5h4v14H6zM14 5h4v14h-4z";

  function fmt(s){ s = Math.max(0, s|0); return Math.floor(s/60)+":"+String(s%60).padStart(2,"0"); }
  function icon(p){ ppi.firstChild.setAttribute("d", p ? PAUSE : PLAY); }

  function play(i){
    if (i < 0 || i >= clips.length) return;
    if (cur === i && !audio.paused){ audio.pause(); return; }
    if (cur === i && audio.paused && audio.src){ audio.play(); return; }
    clips.forEach(function(c){ c.classList.remove("is-playing"); });
    cur = i;
    var el = clips[i];
    el.classList.add("is-playing");
    audio.src = el.dataset.src;
    audio.play();
    now.textContent = el.querySelector(".clip__ref").textContent;
    sub.textContent = through ? "Playing through" : "Playing";
  }

  audio.addEventListener("play",  function(){ icon(true); });
  audio.addEventListener("pause", function(){ icon(false); });
  audio.addEventListener("timeupdate", function(){
    var p = audio.duration ? (audio.currentTime / audio.duration) * 100 : 0;
    scrubi.style.width = p + "%";
    time.textContent = fmt(audio.currentTime);
    var w = clips[cur] && clips[cur].querySelector(".clip__wave i");
    if (w) w.style.width = p + "%";
  });
  audio.addEventListener("ended", function(){
    var w = clips[cur] && clips[cur].querySelector(".clip__wave i");
    if (w) w.style.width = "0";
    if (through && cur + 1 < clips.length && (stopAt < 0 || cur + 1 < stopAt)){
      play(cur + 1);
    } else {
      through = false; sub.textContent = "Finished";
      clips.forEach(function(c){ c.classList.remove("is-playing"); });
    }
  });

  clips.forEach(function(el, i){
    el.addEventListener("click", function(){ through = false; stopAt = -1; play(i); });
    el.addEventListener("keydown", function(e){
      if (e.key === "Enter" || e.key === " "){ e.preventDefault(); through = false; stopAt = -1; play(i); }
    });
  });

  Array.prototype.forEach.call(document.querySelectorAll(".playall"), function(b){
    b.addEventListener("click", function(){
      var from = +b.dataset.from;
      var block = b.closest(".block");
      through = true;
      stopAt = from + block.querySelectorAll(".clip").length;
      play(from);
    });
  });

  document.getElementById("pp").addEventListener("click", function(){
    if (cur < 0) { play(0); return; }
    if (audio.paused) audio.play(); else audio.pause();
  });

  function seek(e){
    if (!audio.duration) return;
    var r = scrub.getBoundingClientRect();
    audio.currentTime = Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)) * audio.duration;
  }
  scrub.addEventListener("click", seek);

  document.addEventListener("keydown", function(e){
    if (e.target.closest("button, [tabindex]") && e.key !== "ArrowDown" && e.key !== "ArrowUp") return;
    if (e.code === "Space"){ e.preventDefault(); if (cur < 0) play(0); else if (audio.paused) audio.play(); else audio.pause(); }
    if (e.key === "ArrowDown"){ e.preventDefault(); through = false; play(cur + 1); clips[Math.min(cur, clips.length-1)].scrollIntoView({block:"center"}); }
    if (e.key === "ArrowUp"){ e.preventDefault(); through = false; play(cur - 1); clips[Math.max(cur, 0)].scrollIntoView({block:"center"}); }
  });
})();
</script>`;

mkdirSync("temp/voiceover", { recursive: true });
const out = `temp/voiceover/audition-${lang}.html`;
writeFileSync(out, html);
console.log(`${rows.length} clips (${clock(totalSecs)}) -> ${out}  ${(html.length / 1e6).toFixed(1)} MB`);

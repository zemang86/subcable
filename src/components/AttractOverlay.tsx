"use client";

import type { CSSProperties } from "react";
import type { Language } from "@/lib/types";
import { useT } from "@/lib/i18n";

/**
 * The attract screen's copy layer — title, blurb, call to action and the
 * partner marks — over IntroSequence's looping underwater clip.
 *
 * Purely decorative: the tap that starts the app is handled by the layer
 * underneath, so nothing here takes pointer events.
 *
 * Type follows the app's own faces rather than the client's reference frame.
 * That frame is set in a rounded geometric sans we don't ship, and fonts are
 * self-hosted here (no CDN, see layout.tsx), so matching it would mean adding
 * a family to the bundle for one screen.
 */

/**
 * The title's second line. Sampled across the reference's letterforms in six
 * vertical bins, it runs #A8ECE4 → #A2E9E6 — flat within a couple of levels.
 * What reads as a gradient there is the lit cable showing through the glyphs,
 * not a fill, so a flat colour is the faithful port.
 */
const MINT = "#A5EAE5";
/** The first line is very slightly warm of pure white in the reference. */
const TITLE_WHITE = "#FAFEFF";

/** Deep-water blue the scrim tints toward — reads as depth, not as a grey box. */
const SCRIM = "2, 18, 38";

/**
 * Partner marks along the bottom.
 *
 * These are the reversed (all-white, transparent) cuts the client supplied in
 * temp/logo. That is what retires the white plates each mark used to sit on:
 * the plates weren't decoration but compliance — TM's brand sheet
 * (docs/TMGlobal_quickreference.pdf) says to use the blue logotype on white
 * "wherever possible" and its DON'Ts panel crosses out the logo sitting
 * straight on a busy photograph, which is exactly what the attract clip is. A
 * reversed cut is the sheet's own answer for imagery, so with it in hand the
 * marks belong on the clip and the plates are what would now look wrong.
 *
 * The colour cuts they replace are gone from public/ (they were the only thing
 * using them) but remain in temp/logo and in git. Note if they ever come back:
 * neither public/tm-logo.png nor the design system's assets/logo-tm-global.png
 * is a TM Global logo despite the filename — both are the plain TM corporate
 * mark, missing the GLOBAL wordmark — and of the two real cuts, the RGB one
 * (#1800E6, the sheet's digital primary) is for screen and the CMYK-derived
 * #005EAD is for print.
 *
 * `units` is each mark's own height in the export, so the row keeps the
 * relative sizing the client drew rather than the equal-ink-area heights that
 * were derived here when only the colour rasters existed. It reads differently
 * — Muzium Telegraf is nearly twice TM Global now, where it used to be 1.27x —
 * but that mark stacks a building over two lines of type where the other two
 * are single-line lockups, so it needs the height to stay legible.
 */
type Mark = { name: string; src: string; units: number };

const MARKS: Mark[] = [
  { name: "Yayasan TM", src: "/logo-yayasan-tm.svg", units: 22 },
  { name: "Muzium Telegraf Taiping", src: "/logo-muzium-telegraf.svg", units: 51 },
  { name: "TM Global", src: "/logo-tm-global.svg", units: 27 },
];

/** Stagger for the entrance — title leads, the call to action trails. */
const RISE_MS = 620;

export default function AttractOverlay({
  language = "en",
}: {
  language?: Language;
}) {
  const t = useT(language);

  return (
    <div style={wrap}>
      <div aria-hidden style={scrim} />

      <div style={stack}>
        <h1 className="v1-brand-rise" style={title}>
          <span style={{ display: "block", color: TITLE_WHITE }}>
            {t("attractTitleLead")}
          </span>
          <span style={{ display: "block", color: MINT }}>
            {t("attractTitleTail")}
          </span>
        </h1>

        <p
          className="v1-brand-rise"
          style={{ ...copy, animationDelay: `${RISE_MS * 0.35}ms` }}
        >
          {t("attractCopy")}
        </p>

        <span
          className="v1-brand-rise"
          style={{ ...ctaRise, animationDelay: `${RISE_MS * 0.7}ms` }}
        >
          <span className="v1-pulse" style={cta}>
            {t("tapToBegin")}
          </span>
        </span>
      </div>

      <div
        className="v1-brand-rise"
        style={{ ...markRow, animationDelay: `${RISE_MS}ms` }}
      >
        <span style={attribution}>{t("broughtToYouBy")}</span>
        <div style={markBand}>
          <span aria-hidden style={markGlow} />
          {MARKS.map((mark) => (
            <LogoMark key={mark.name} mark={mark} />
          ))}
        </div>
      </div>
    </div>
  );
}

function LogoMark({ mark }: { mark: Mark }) {
  return (
    /* eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer */
    <img
      src={mark.src}
      alt={mark.name}
      style={{
        ...markImage,
        height: `calc(${MARK_UNIT} * ${mark.units})`,
      }}
    />
  );
}

/* ── Styles ── */
// Sizes are viewport-relative so the layout holds on a dev screen as well as
// the 1920x1080 kiosk, clamped at both ends so it never gets silly either way.
// The proportions come off the reference frame: title cap-top at 24% of the
// height, blurb near 50%, call to action near 67%.

const wrap: CSSProperties = {
  position: "absolute",
  inset: 0,
  pointerEvents: "none",
  overflow: "hidden",
};

const scrim: CSSProperties = {
  position: "absolute",
  inset: 0,
  background: [
    // Pool of depth behind the text block — the reference's own blurb sits on
    // the brightest part of the cable and is hard to read for it.
    `radial-gradient(ellipse 62% 52% at 50% 40%, rgba(${SCRIM}, 0.62) 0%, rgba(${SCRIM}, 0.34) 45%, rgba(${SCRIM}, 0) 72%)`,
    // Seats the partner marks against the seabed.
    `linear-gradient(to top, rgba(${SCRIM}, 0.62) 0%, rgba(${SCRIM}, 0) 24%)`,
  ].join(", "),
  pointerEvents: "none",
};

const stack: CSSProperties = {
  position: "absolute",
  inset: 0,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  paddingTop: "20vh",
  textAlign: "center",
};

const title: CSSProperties = {
  margin: 0,
  fontFamily: "var(--v1-display)",
  fontWeight: 700,
  fontSize: "clamp(44px, 10.6vh, 122px)",
  lineHeight: 1.14,
  letterSpacing: "-0.01em",
  textShadow: `0 2px 28px rgba(${SCRIM}, 0.65)`,
};

const copy: CSSProperties = {
  margin: "5.5vh 0 0",
  maxWidth: "min(54vw, 1000px)",
  fontFamily: "var(--v1-heading)",
  fontWeight: 500,
  fontSize: "clamp(14px, 2.35vh, 27px)",
  lineHeight: 1.5,
  color: "var(--v1-fg)",
  textShadow: `0 1px 14px rgba(${SCRIM}, 0.9)`,
};

// The rise and the pulse are separate elements: one animation each, so the
// staggered entrance can't fight the CTA's looping breathe.
const ctaRise: CSSProperties = {
  marginTop: "9vh",
};

const cta: CSSProperties = {
  display: "inline-block",
  fontFamily: "var(--v1-heading)",
  fontWeight: 500,
  fontSize: "clamp(13px, 2.5vh, 29px)",
  letterSpacing: "0.34em",
  textTransform: "uppercase",
  // The reference sets it in a soft grey rather than full white, so it reads
  // as an invitation under the title rather than competing with it.
  color: "rgba(255, 255, 255, 0.82)",
  textShadow: `0 1px 14px rgba(${SCRIM}, 0.9)`,
};

/**
 * One export unit, in screen pixels. It sets the whole row: at the 1080p kiosk
 * this puts TM Global's 27 units at 64px, Muzium Telegraf's 51 at 121 and
 * Yayasan's 22 at 52. The lower bound is what holds TM Global over the brand
 * sheet's 56px digital floor (27 × 2.07 ≈ 56) on a short dev window.
 */
const MARK_UNIT = "clamp(2.07px, 0.22vh, 2.7px)";

const markRow: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: "5vh",
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  // Anchored at the bottom, so the attribution line grows upward off the marks
  // and they stay where they were.
  gap: "clamp(14px, 2.1vh, 24px)",
};

const attribution: CSSProperties = {
  fontFamily: "var(--v1-heading)",
  fontWeight: 500,
  fontSize: "clamp(11px, 1.7vh, 20px)",
  letterSpacing: "0.34em",
  textTransform: "uppercase",
  // A shade under the call to action's own white — it labels the row, it isn't
  // asking to be read first.
  color: "rgba(255, 255, 255, 0.76)",
  textShadow: `0 1px 14px rgba(${SCRIM}, 0.9)`,
};

const markBand: CSSProperties = {
  position: "relative",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "clamp(36px, 4vw, 84px)",
};

/**
 * The soft light bar the marks sit on, from temp/logo/blurbg-behindlogo.svg:
 * a 28.8-unit band of #83B4F9 at 67%, gaussian-blurred at sigma 25 units. It
 * does the legibility work the white plates used to, without putting a box
 * around anything — over a bright frame it disappears, over a dark one it
 * lifts the marks off the water.
 *
 * `filter`, not `backdrop-filter`: the bar blurs itself, not the clip behind
 * it, so it composites once instead of every video frame. It overhangs the row
 * because a blurred rectangle has to start outside the thing it's lighting.
 */
const markGlow: CSSProperties = {
  position: "absolute",
  left: "-11%",
  right: "-11%",
  top: "50%",
  height: `calc(${MARK_UNIT} * 28.8)`,
  transform: "translateY(-50%)",
  background: "rgba(131, 180, 249, 0.67)",
  filter: `blur(calc(${MARK_UNIT} * 25))`,
  pointerEvents: "none",
};

const markImage: CSSProperties = {
  position: "relative",
  display: "block",
  width: "auto",
  objectFit: "contain",
};

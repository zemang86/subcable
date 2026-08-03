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
 * Partner marks along the bottom. Real artwork drops in by setting `src` to a
 * path under public/; until then each falls back to its initials in the same
 * frame, so a partly-supplied set still reads as one row rather than a broken
 * one.
 *
 * Every mark sits on a white plate. That isn't only for legibility over the
 * clip: TM's brand sheet (docs/TMGlobal_quickreference.pdf) says to use the
 * blue logotype on white "wherever possible", and its DON'Ts panel crosses out
 * the logo sitting straight on a busy photograph — which is what the attract
 * clip is. The plate turns a prohibited backdrop into the sanctioned one.
 *
 * Note for whoever adds the other two: neither public/tm-logo.png nor the
 * design system's docs/.../assets/logo-tm-global.png is a TM Global logo
 * despite the filename — both are the plain TM corporate mark, missing the
 * GLOBAL wordmark. public/logo-tm-global.png is the real lockup.
 */
type Mark = { initials: string; name: string; src?: string };

const MARKS: Mark[] = [
  { initials: "YTM", name: "Yayasan TM" },
  { initials: "MT", name: "Muzium Telegraf" },
  { initials: "TMG", name: "TM Global", src: "/logo-tm-global.png" },
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
        {MARKS.map((mark) => (
          <LogoMark key={mark.name} mark={mark} />
        ))}
      </div>
    </div>
  );
}

function LogoMark({ mark }: { mark: Mark }) {
  return (
    <span style={markCell}>
      <span style={markPlate}>
        {mark.src ? (
          // eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer
          <img src={mark.src} alt={mark.name} style={markImage} />
        ) : (
          <span style={markInitials}>{mark.initials}</span>
        )}
      </span>
      {/* Only placeholders need naming — a real lockup carries its own
          wordmark, so captioning it would just say the same thing twice. */}
      {!mark.src && <span style={markName}>{mark.name}</span>}
    </span>
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
 * TM's sheet sets a 56px floor for the logo in digital and a clear space either
 * side of one 'X'. The floor is the clamp minimum rather than a mid value, so a
 * short dev window shrinks the gaps and never the mark itself; the row gap is
 * the clear space, generous because three brands sit side by side.
 */
const MARK_HEIGHT = "clamp(56px, 6.5vh, 78px)";

const markRow: CSSProperties = {
  position: "absolute",
  left: 0,
  right: 0,
  bottom: "5vh",
  display: "flex",
  alignItems: "flex-end",
  justifyContent: "center",
  gap: "clamp(40px, 6vw, 104px)",
};

const markCell: CSSProperties = {
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  gap: 10,
};

/**
 * The white plate. Square, not rounded — the brand sheet's own DO panel shows
 * the logo on a plain rectangle, and the rest of this app's chrome is
 * hard-edged. The padding is the clear space the sheet asks for; the plate
 * sizes to whatever sits inside it, so a wide lockup and a short set of
 * initials both keep the same margin.
 */
const markPlate: CSSProperties = {
  display: "inline-flex",
  alignItems: "center",
  justifyContent: "center",
  minWidth: "clamp(104px, 14vh, 164px)",
  padding: "clamp(10px, 1.4vh, 17px) clamp(16px, 2.2vh, 26px)",
  boxSizing: "border-box",
  background: "#FFFFFF",
};

const markImage: CSSProperties = {
  display: "block",
  height: MARK_HEIGHT,
  width: "auto",
  objectFit: "contain",
};

const markInitials: CSSProperties = {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  height: MARK_HEIGHT,
  fontFamily: "var(--v1-display)",
  fontWeight: 700,
  fontSize: "clamp(15px, 2.6vh, 30px)",
  letterSpacing: "0.08em",
  // Neutral slate rather than any TM blue — a placeholder shouldn't imply a
  // brand colour it hasn't been given.
  color: "#22303F",
};

const markName: CSSProperties = {
  fontFamily: "var(--v1-mono)",
  fontWeight: 400,
  fontSize: "clamp(9px, 1.35vh, 15px)",
  letterSpacing: "0.16em",
  textTransform: "uppercase",
  color: "rgba(255, 255, 255, 0.72)",
};

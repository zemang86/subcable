/**
 * /font-test — standalone typography reference page.
 *
 * Use this to verify the 5 v1.0 font families render correctly:
 *   - Chakra Petch  → --v1-display, .v1-h-display, .font-display
 *   - Rajdhani      → --v1-heading, .v1-h-heading / .v1-h-label / .v1-h-eye
 *   - IBM Plex Mono → --v1-mono, .v1-mono, body default
 *   - B612 Mono     → --v1-stat, .v1-h-stat
 *   - Space Mono    → --v1-pixel, .v1-coords
 *
 * If a row reads in something that looks like system sans (Helvetica/Arial),
 * that family failed to load — check Network tab and src/app/fonts/.
 */

import FontLoadStatus from "./FontLoadStatus";

type WeightRow = { weight: number; label: string };
type FamilySection = {
  name: string;
  cssVar: string;
  utility: string;
  fontFamily: string;
  designRole: string;
  weights: WeightRow[];
};

const FAMILIES: FamilySection[] = [
  {
    name: "Chakra Petch",
    cssVar: "--v1-display / --font-chakra",
    utility: ".v1-h-display, .font-display",
    fontFamily: "var(--v1-display)",
    designRole: "Display titlebars (56–64px), bottom titlebar, callouts",
    weights: [
      { weight: 300, label: "Light" },
      { weight: 400, label: "Regular" },
      { weight: 500, label: "Medium  (used by spec)" },
      { weight: 600, label: "SemiBold (used by spec)" },
      { weight: 700, label: "Bold    (used by spec — .v1-h-display)" },
    ],
  },
  {
    name: "Rajdhani",
    cssVar: "--v1-heading / --font-rajdhani",
    utility: ".v1-h-heading, .v1-h-label, .v1-h-eye",
    fontFamily: "var(--v1-heading)",
    designRole: "Panel titles, labels, eyebrow text, tactical UI",
    weights: [
      { weight: 300, label: "Light" },
      { weight: 400, label: "Regular (.v1-h-eye)" },
      { weight: 500, label: "Medium  (.v1-h-label)" },
      { weight: 600, label: "SemiBold (.v1-h-heading)" },
      { weight: 700, label: "Bold" },
    ],
  },
  {
    name: "IBM Plex Mono",
    cssVar: "--v1-mono / --font-plex-mono",
    utility: ".v1-mono, body default",
    fontFamily: "var(--v1-mono)",
    designRole: "Body text, descriptions, technical copy",
    weights: [
      { weight: 100, label: "Thin" },
      { weight: 200, label: "ExtraLight" },
      { weight: 300, label: "Light" },
      { weight: 400, label: "Regular" },
      { weight: 500, label: "Medium" },
      { weight: 600, label: "SemiBold" },
      { weight: 700, label: "Bold" },
    ],
  },
  {
    name: "B612 Mono",
    cssVar: "--v1-stat / --font-b612-mono",
    utility: ".v1-h-stat",
    fontFamily: "var(--v1-stat)",
    designRole: "Stat numbers (KeyStatistic 28–32px, orange-hot)",
    weights: [
      { weight: 400, label: "Regular (.v1-h-stat)" },
      { weight: 700, label: "Bold" },
    ],
  },
  {
    name: "Space Mono",
    cssVar: "--v1-pixel / --font-space-mono",
    utility: ".v1-coords",
    fontFamily: "var(--v1-pixel)",
    designRole: "Coordinates, pixel/tactical readouts (Google CDN — not local)",
    weights: [
      { weight: 400, label: "Regular (.v1-coords)" },
      { weight: 700, label: "Bold" },
    ],
  },
];

const SPECIMEN = "ABCDEFGHIJKLMNOPQRSTUVWXYZ  abcdefghijklmnopqrstuvwxyz  0123456789  []{}<>/—·";
const COORD_SAMPLE = "4.2105°N  101.9758°E    ALT 2.2    UTC+08:00";
const STAT_SAMPLE = "12,403 KM";

export default function FontTestPage() {
  return (
    <main
      style={{
        background: "var(--v1-bg)",
        color: "var(--v1-fg)",
        position: "fixed",
        inset: 0,
        overflowY: "auto",
        overflowX: "hidden",
        WebkitOverflowScrolling: "touch",
        touchAction: "pan-y",
        userSelect: "text",
        WebkitUserSelect: "text",
        padding: "48px 56px 120px",
        fontFamily: "var(--v1-mono)",
      }}
    >
      {/* Header */}
      <header style={{ borderBottom: "1px solid var(--v1-bg-line)", paddingBottom: 24, marginBottom: 40 }}>
        <div className="v1-h-eye" style={{ marginBottom: 6 }}>TM SUBMARINE CABLE · TYPE SPECIMEN</div>
        <h1 className="v1-h-display" style={{ fontSize: 48, margin: 0, color: "var(--v1-fg)" }}>
          Font Verification · v1.0 Tactical-HUD
        </h1>
        <p className="v1-mono" style={{ marginTop: 12, fontSize: 13, lineHeight: 1.6, color: "var(--v1-mute)" }}>
          Each row labels the family, weight, CSS variable, and the v1 utility class. If a row visibly differs from
          the others in shape (serifs, x-height, terminals) it&apos;s falling back to system sans — that&apos;s the bug.
        </p>
      </header>

      <FontLoadStatus />

      {/* Hero display preview block — shows the headline use of each family side-by-side */}
      <section style={{ marginBottom: 56 }}>
        <div className="v1-h-eye" style={{ marginBottom: 12 }}>HERO PREVIEWS · AS USED IN SHIPPING UI</div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr", gap: 28, padding: "24px 28px", border: "1px solid var(--v1-bg-line)", borderRadius: 2 }}>
          {/* Bottom-titlebar (Chakra Petch 56px) */}
          <div>
            <div className="v1-h-eye" style={{ marginBottom: 6 }}>BottomTitlebar · Chakra Petch 56 / 700</div>
            <div style={{ fontFamily: "var(--v1-display)", fontWeight: 700, fontSize: 56, letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1 }}>
              Submarine Cable Map
            </div>
          </div>

          {/* KeyStatistic (B612 Mono 32px orange-hot) */}
          <div>
            <div className="v1-h-eye" style={{ marginBottom: 6 }}>KeyStatistic · B612 Mono 32 / 400 / orange-hot</div>
            <div style={{ fontFamily: "var(--v1-stat)", fontWeight: 400, fontSize: 32, color: "var(--v1-orange-hot)", fontVariantNumeric: "tabular-nums" }}>
              {STAT_SAMPLE}
            </div>
          </div>

          {/* CableInformation heading (Rajdhani 24 SemiBold) */}
          <div>
            <div className="v1-h-eye" style={{ marginBottom: 6 }}>Panel Heading · Rajdhani 24 / 600</div>
            <div style={{ fontFamily: "var(--v1-heading)", fontWeight: 600, fontSize: 24, letterSpacing: "0.04em", color: "var(--v1-active)" }}>
              BATAM DUMAI MELAKA CABLE SYSTEM
            </div>
          </div>

          {/* Description body (IBM Plex Mono 13) */}
          <div>
            <div className="v1-h-eye" style={{ marginBottom: 6 }}>Body Text · IBM Plex Mono 13 / 400</div>
            <div style={{ fontFamily: "var(--v1-mono)", fontWeight: 400, fontSize: 13, lineHeight: 1.6, color: "var(--v1-fg-iceblue)", maxWidth: 720 }}>
              The Batam Dumai Melaka cable system connects Indonesia and Malaysia across the Strait of Malacca,
              landing at three sites with a total route length of 654 kilometres.
            </div>
          </div>

          {/* Coords (Space Mono 9) */}
          <div>
            <div className="v1-h-eye" style={{ marginBottom: 6 }}>Coordinates · Space Mono 9 / 400</div>
            <div style={{ fontFamily: "var(--v1-pixel)", fontWeight: 400, fontSize: 9, letterSpacing: "0.04em", color: "var(--v1-mute)" }}>
              {COORD_SAMPLE}
            </div>
            <div style={{ fontFamily: "var(--v1-pixel)", fontWeight: 400, fontSize: 14, letterSpacing: "0.04em", color: "var(--v1-mute)", marginTop: 4 }}>
              {COORD_SAMPLE}  (14px for legibility)
            </div>
          </div>
        </div>
      </section>

      {/* Utility-class sanity row — these are the same classes shipping components reference */}
      <section style={{ marginBottom: 56 }}>
        <div className="v1-h-eye" style={{ marginBottom: 12 }}>UTILITY CLASS REFERENCE · DEFINED IN globals.css</div>
        <div style={{ display: "grid", gridTemplateColumns: "260px 1fr", rowGap: 18, columnGap: 24, padding: "20px 24px", border: "1px solid var(--v1-bg-line)", borderRadius: 2 }}>
          <UtilLabel name=".v1-h-display" expected="Chakra Petch 700 + uppercase + 0.04em" />
          <div className="v1-h-display" style={{ fontSize: 28 }}>Display Heading</div>

          <UtilLabel name=".v1-h-heading" expected="Rajdhani 600 + 0.04em" />
          <div className="v1-h-heading" style={{ fontSize: 22 }}>Panel Heading</div>

          <UtilLabel name=".v1-h-label" expected="Rajdhani 500 · 11px · 0.15em uppercase · mute" />
          <div className="v1-h-label">Cable System Identifier</div>

          <UtilLabel name=".v1-h-eye" expected="Rajdhani 400 · 10px · 0.20em uppercase · mute" />
          <div className="v1-h-eye">Eyebrow Tactical Label</div>

          <UtilLabel name=".v1-h-stat" expected="B612 Mono 400 · tabular-nums · orange-hot" />
          <div className="v1-h-stat" style={{ fontSize: 28 }}>12,403 KM</div>

          <UtilLabel name=".v1-mono" expected="IBM Plex Mono — same as body default" />
          <div className="v1-mono" style={{ fontSize: 13, lineHeight: 1.6 }}>
            The quick brown fox jumps over the lazy dog · 0123456789
          </div>

          <UtilLabel name=".v1-coords" expected="Space Mono · 9px · 0.04em · mute" />
          <div className="v1-coords">{COORD_SAMPLE}</div>

          <UtilLabel name=".font-display (legacy alias)" expected="Should equal .v1-h-display family (Chakra Petch)" />
          <div className="font-display" style={{ fontSize: 22, letterSpacing: "0.04em" }}>Legacy Alias Render</div>
        </div>
      </section>

      {/* Per-family weight grids */}
      {FAMILIES.map((f) => (
        <FamilyBlock key={f.name} family={f} />
      ))}

      {/* Side-by-side fallback comparison */}
      <section style={{ marginBottom: 40 }}>
        <div className="v1-h-eye" style={{ marginBottom: 12 }}>SANITY · CUSTOM FONT vs SYSTEM SANS</div>
        <p className="v1-mono" style={{ fontSize: 13, color: "var(--v1-mute)", marginBottom: 16 }}>
          The top of each pair uses the v1 token; the bottom forces a system sans-serif. If both rows look the same,
          the custom font failed to load.
        </p>
        {FAMILIES.map((f) => (
          <div key={`cmp-${f.name}`} style={{ borderTop: "1px solid var(--v1-bg-line)", padding: "16px 0" }}>
            <div className="v1-h-label" style={{ marginBottom: 4 }}>{f.name}</div>
            <div style={{ fontFamily: f.fontFamily, fontSize: 22, fontWeight: 500 }}>{SPECIMEN}</div>
            <div style={{ fontFamily: "system-ui, -apple-system, sans-serif", fontSize: 22, fontWeight: 500, color: "var(--v1-mute)" }}>{SPECIMEN}</div>
          </div>
        ))}
      </section>

      <footer style={{ borderTop: "1px solid var(--v1-bg-line)", paddingTop: 16 }}>
        <div className="v1-coords">
          Loaded via next/font/local (4 families) + next/font/google (Space Mono). Source: src/app/fonts/ + Google CDN.
        </div>
      </footer>
    </main>
  );
}

function UtilLabel({ name, expected }: { name: string; expected: string }) {
  return (
    <div>
      <div className="v1-mono" style={{ fontSize: 12, color: "var(--v1-orange)" }}>{name}</div>
      <div className="v1-mono" style={{ fontSize: 11, color: "var(--v1-mute-dark)", marginTop: 2 }}>{expected}</div>
    </div>
  );
}

function FamilyBlock({ family }: { family: FamilySection }) {
  return (
    <section style={{ marginBottom: 48 }}>
      <div style={{ display: "flex", alignItems: "baseline", justifyContent: "space-between", gap: 16, marginBottom: 12 }}>
        <div>
          <div className="v1-h-eye">{family.designRole}</div>
          <h2 style={{ fontFamily: family.fontFamily, fontWeight: 600, fontSize: 36, margin: "4px 0 0", letterSpacing: "0.02em" }}>
            {family.name}
          </h2>
        </div>
        <div style={{ textAlign: "right" }}>
          <div className="v1-mono" style={{ fontSize: 11, color: "var(--v1-orange)" }}>{family.cssVar}</div>
          <div className="v1-mono" style={{ fontSize: 11, color: "var(--v1-mute-dark)", marginTop: 2 }}>{family.utility}</div>
        </div>
      </div>

      <div style={{ border: "1px solid var(--v1-bg-line)", borderRadius: 2 }}>
        {family.weights.map((w, i) => (
          <div
            key={w.weight}
            style={{
              display: "grid",
              gridTemplateColumns: "120px 1fr",
              alignItems: "center",
              gap: 24,
              padding: "16px 24px",
              borderTop: i === 0 ? "none" : "1px solid var(--v1-bg-line)",
            }}
          >
            <div>
              <div className="v1-mono" style={{ fontSize: 12 }}>{w.weight}</div>
              <div className="v1-mono" style={{ fontSize: 10, color: "var(--v1-mute-dark)", marginTop: 2 }}>{w.label}</div>
            </div>
            <div style={{ fontFamily: family.fontFamily, fontWeight: w.weight, fontSize: 20, lineHeight: 1.3, letterSpacing: "0.02em" }}>
              {SPECIMEN}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

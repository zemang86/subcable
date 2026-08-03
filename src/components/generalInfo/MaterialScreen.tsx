"use client";

import type { MaterialScreen as MaterialData } from "@/data/generalInfo";
import {
  CARD_BODY,
  CARD_TITLE,
  ColumnBracket,
  CopyCard,
  PANEL_PAD,
  Photo,
  SectionStrip,
  type ScreenProps,
} from "./shared";

/**
 * How It's Made — the material story.
 *
 * Two columns, each headed by a section strip with a bracket running down the
 * gutter beside it. Left: photo over a copy card. Right: the strip spans both
 * the tree's spec rail AND the tall tree photo, so the photo hangs below it
 * rather than sitting alongside — that overlap is what the export draws, and
 * it's why the photo is shorter than the column.
 *
 * Widths follow temp/funfact/howitsmade.svg's proportions: a wide outer gutter
 * (it has to hold both brackets) against a tight gap between the rail and the
 * tree photo. The export's own text columns are narrower still, but this panel
 * runs taller than the export's frame, so holding its literal column widths
 * would wrap the Malay copy far tighter than it needs.
 */
const OUTER_GAP = 64;
const INNER_GAP = 14;
/**
 * How far the Tree Information strip stops short of the tree photo's right
 * edge. The export ends the strip at x=449.07 against a photo running to
 * x=470.66 — it covers about three quarters of the photo's width, which reads
 * as a deliberate overlap where sitting flush would read as a coincidence.
 */
const STRIP_INSET = 46;
export default function MaterialScreen({
  screen,
  cycleKey,
  barRepeat,
}: { screen: MaterialData } & ScreenProps) {
  return (
    <div
      style={{
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        gap: OUTER_GAP,
        alignItems: "stretch",
        padding: `20px ${PANEL_PAD}px ${PANEL_PAD}px`,
      }}
    >
      {/* Material */}
      <div
        style={{
          position: "relative",
          flex: "0 0 38%",
          display: "flex",
          flexDirection: "column",
          gap: 14,
          minWidth: 0,
        }}
      >
        <SectionStrip label={screen.strip} mono />
        <Photo
          src={screen.image.src}
          alt={screen.image.alt}
          style={{ width: "100%", flex: "1 1 auto", minHeight: 90 }}
        />
        <CopyCard cycleKey={`${cycleKey}-material`} barRepeat={barRepeat}>
          <h2 style={{ ...CARD_TITLE, fontSize: 26, lineHeight: "34px" }}>
            {screen.title}
          </h2>
          {screen.body.map((paragraph, i) => (
            <p
              key={i}
              style={{ ...CARD_BODY, fontSize: 13, lineHeight: "20px", margin: "12px 0 0" }}
            >
              {paragraph}
            </p>
          ))}
        </CopyCard>
        <ColumnBracket side="left" width={14} bottom={79} />
      </div>

      {/* Tree information — one strip over both the spec rail and the tree */}
      <div
        style={{
          position: "relative",
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <div style={{ marginRight: STRIP_INSET }}>
          <SectionStrip label={screen.factsTitle} />
        </div>
        <div style={{ flex: 1, minHeight: 0, display: "flex", gap: INNER_GAP }}>
          <div
            style={{
              flex: 1,
              minWidth: 0,
              display: "flex",
              flexDirection: "column",
            }}
          >
            {/* The rail and the space under it share one box so the spine can
                run the whole way from the strip down to the card, the way the
                export draws it — not just between the first and last node. */}
            <div style={{ position: "relative", flex: 1, minHeight: 0 }}>
              <span
                aria-hidden
                style={{
                  position: "absolute",
                  left: RAIL_SPINE_X,
                  top: 0,
                  bottom: 4,
                  width: 1,
                  background: "#FFFFFF",
                }}
              />
              <FactRail facts={screen.facts} />
            </div>
            <CopyCard
              cycleKey={`${cycleKey}-description`}
              barRepeat={barRepeat}
            >
              <h2 style={{ ...CARD_TITLE, fontSize: 24, lineHeight: "32px" }}>
                {screen.descriptionTitle}
              </h2>
              <p
                style={{ ...CARD_BODY, fontSize: 13, lineHeight: "20px", margin: "12px 0 0" }}
              >
                {screen.description}
              </p>
            </CopyCard>
          </div>

          {/* Tree — hangs below the strip above it, so it stops short of the
              column's full height. */}
          <Photo
            src={screen.sideImage.src}
            alt={screen.sideImage.alt}
            style={{ flex: "0 0 190px", width: 190, height: "100%", minHeight: 0 }}
          />
        </div>
        <ColumnBracket side="right" width={21} bottom={49} />
      </div>
    </div>
  );
}

/**
 * The spec list — a node per row branching into a label box and its value on
 * an underline. The vertical spine the nodes sit on is drawn by the caller,
 * not here: the export runs it past both ends of this list, from the section
 * strip down to the description card.
 */
const RAIL_INDENT = 26;
const RAIL_NODE = 15;
/** Centre of the nodes, which the spine has to line up with. */
const RAIL_SPINE_X = RAIL_NODE / 2 - 0.5;

function FactRail({ facts }: { facts: { label: string; value: string }[] }) {
  return (
    <div style={{ position: "relative", paddingLeft: RAIL_INDENT }}>
      {facts.map((fact) => (
        <div
          key={fact.label}
          style={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            gap: 12,
            minHeight: 52,
          }}
        >
          <span
            aria-hidden
            style={{
              position: "absolute",
              left: -RAIL_INDENT,
              top: "50%",
              transform: "translateY(-50%)",
              width: RAIL_NODE,
              height: RAIL_NODE,
              borderRadius: "50%",
              border: "2px solid #FFFFFF",
              background: "rgba(3, 77, 161, 0.35)",
            }}
          />
          <span
            style={{
              flex: "0 0 128px",
              padding: "6px 8px",
              borderTop: "1px solid rgba(255, 255, 255, 0.75)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.75)",
              fontFamily: "var(--v1-heading)",
              fontWeight: 500,
              fontSize: 13,
              color: "var(--v1-fg)",
            }}
          >
            {fact.label}
          </span>
          <span
            style={{
              flex: 1,
              minWidth: 0,
              paddingBottom: 6,
              borderBottom: "1px solid rgba(255, 255, 255, 0.75)",
              fontFamily: "var(--v1-mono)",
              fontWeight: 400,
              fontSize: 17,
              lineHeight: "23px",
              color: "var(--v1-fg)",
            }}
          >
            {fact.value}
          </span>
        </div>
      ))}
    </div>
  );
}

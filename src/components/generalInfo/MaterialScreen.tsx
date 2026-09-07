"use client";

import type { CSSProperties } from "react";
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
 * Every width is temp/funfact/howitsmade.svg's, scaled by the panel's x2.17:
 * the left column runs 426px against the panel's 996 of usable width (42.8%),
 * the gutter between the columns is 86 — wide because it has to hold both
 * brackets — the tree is 192, and only 26 separates it from the spec rail.
 *
 * This is the one screen whose copy the export sets smaller than the rest of
 * the panel: 9.0px for the two Gutta Percha paragraphs and 10.7 for the tree's
 * description, against 12.5 everywhere else. It is not a stylistic choice — the
 * screen carries four blocks of copy where the others carry one, and at the
 * panel's own 13px the Malay text alone runs 130px past the frame. 10/15 here
 * is a compromise on the export's own numbers, not a departure from them.
 */
const OUTER_GAP = 86;
const INNER_GAP = 26;
const LEFT_COLUMN = "42.8%";
const TREE_WIDTH = 192;
const COLUMN_GAP = 18;
const BODY: CSSProperties = { fontSize: 10, lineHeight: "15px" };
/**
 * How far the Tree Information strip stops short of the tree photo's right
 * edge. The export ends the strip at x=449.07 against a photo running to
 * x=470.66 — it covers about three quarters of the photo's width, which reads
 * as a deliberate overlap where sitting flush would read as a coincidence.
 */
const STRIP_INSET = 46;
export default function MaterialScreen({
  screen,
}: { screen: MaterialData } & ScreenProps) {
  return (
    <div
      style={{
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        gap: OUTER_GAP,
        alignItems: "stretch",
        padding: `6px ${PANEL_PAD}px 24px`,
      }}
    >
      {/* Material */}
      <div
        style={{
          position: "relative",
          flex: `0 0 ${LEFT_COLUMN}`,
          display: "flex",
          flexDirection: "column",
          gap: COLUMN_GAP,
          minWidth: 0,
        }}
      >
        <SectionStrip label={screen.strip} mono />
        <Photo
          src={screen.image.src}
          alt={screen.image.alt}
          style={{ width: "100%", flex: "1 1 auto", minHeight: 90 }}
        />
        <CopyCard>
          <h2 style={{ ...CARD_TITLE, fontSize: 25, lineHeight: "33px" }}>
            {screen.title}
          </h2>
          {screen.body.map((paragraph, i) => (
            <p key={i} style={{ ...CARD_BODY, ...BODY, margin: "12px 0 0" }}>
              {paragraph}
            </p>
          ))}
        </CopyCard>
        <ColumnBracket side="left" width={21} bottom={62} />
      </div>

      {/* Tree information — one strip over both the spec rail and the tree */}
      <div
        style={{
          position: "relative",
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: COLUMN_GAP,
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
            <CopyCard>
              <h2 style={{ ...CARD_TITLE, fontSize: 25, lineHeight: "33px" }}>
                {screen.descriptionTitle}
              </h2>
              <p style={{ ...CARD_BODY, ...BODY, margin: "12px 0 0" }}>
                {screen.description}
              </p>
            </CopyCard>
          </div>

          {/* Tree — hangs below the strip above it, so it stops short of the
              column's full height. */}
          <Photo
            src={screen.sideImage.src}
            alt={screen.sideImage.alt}
            style={{
              flex: `0 0 ${TREE_WIDTH}px`,
              width: TREE_WIDTH,
              height: "100%",
              minHeight: 0,
            }}
          />
        </div>
        <ColumnBracket side="right" width={37} bottom={39} />
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
/** Label and value are the export's 4.93 and 6.16 design units, scaled x2.17. */
const RAIL_LABEL = 11;
const RAIL_VALUE = 13;
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
            minHeight: 44,
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
              flex: "0 0 112px",
              padding: "6px 8px",
              borderTop: "1px solid rgba(255, 255, 255, 0.75)",
              borderBottom: "1px solid rgba(255, 255, 255, 0.75)",
              fontFamily: "var(--v1-heading)",
              fontWeight: 500,
              fontSize: RAIL_LABEL,
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
              fontSize: RAIL_VALUE,
              lineHeight: "18px",
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

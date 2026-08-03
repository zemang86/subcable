"use client";

import type { MaterialScreen as MaterialData } from "@/data/generalInfo";
import {
  CARD_BODY,
  CARD_TITLE,
  CopyCard,
  PANEL_PAD,
  Photo,
  SectionStrip,
  type ScreenProps,
} from "./shared";

/**
 * How It's Made — the material story.
 *
 * Left column: strip header, photo, copy card. Middle column: the tree's
 * spec list on a connector rail, then the description card. Right: the tall
 * tree photo running the full height of the content area.
 */
export default function MaterialScreen({
  screen,
  cycleKey,
  counting,
}: { screen: MaterialData } & ScreenProps) {
  return (
    <div
      style={{
        display: "flex",
        gap: 26,
        alignItems: "stretch",
        padding: `20px ${PANEL_PAD}px ${PANEL_PAD}px`,
      }}
    >
      {/* Material */}
      <div
        style={{
          flex: "0 0 40%",
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
          style={{ width: "100%", height: 250 }}
        />
        <CopyCard cycleKey={`${cycleKey}-material`} counting={counting} flex>
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
      </div>

      {/* Tree information + description */}
      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        <SectionStrip label={screen.factsTitle} />
        <FactRail facts={screen.facts} />
        <CopyCard cycleKey={`${cycleKey}-description`} counting={counting} flex>
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

      {/* Tree */}
      <Photo
        src={screen.sideImage.src}
        alt={screen.sideImage.alt}
        style={{ flex: "0 0 190px", width: 190, alignSelf: "stretch" }}
      />
    </div>
  );
}

/**
 * The spec list — a vertical rail with a node per row, each branching into a
 * label box and its value on an underline.
 */
function FactRail({ facts }: { facts: { label: string; value: string }[] }) {
  return (
    <div style={{ position: "relative", paddingLeft: 26 }}>
      <span
        aria-hidden
        style={{
          position: "absolute",
          left: 7,
          top: 18,
          bottom: 18,
          width: 1,
          background: "#FFFFFF",
        }}
      />
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
              left: -26,
              top: "50%",
              transform: "translateY(-50%)",
              width: 15,
              height: 15,
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

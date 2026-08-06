"use client";

import type { OverviewScreen as OverviewData } from "@/data/generalInfo";
import {
  CARD_BODY,
  CARD_TITLE,
  CopyCard,
  PANEL_PAD,
  Photo,
  StepButton,
  type ScreenProps,
} from "./shared";

/**
 * Every measure here is overview-1.svg's, scaled by the panel's x2.22: the
 * photos are 149.744 units wide and 108.284 tall with 7.82 between them, and
 * the copy column's frame starts 14.7 clear of them. The content band itself
 * runs 44.0 to 268.4 below the panel's top edge — 97.7px to 595.7px — and the
 * tab row above it eats 83 of that first 97.7, which is what leaves 15.
 */
const IMAGE_WIDTH = 332;
const COLUMN_GAP = 32;
const PHOTO_GAP = 17;

export default function OverviewScreen({
  screen,
  index,
  count,
  onStep,
}: { screen: OverviewData } & ScreenProps) {
  return (
    <div
      style={{
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        gap: COLUMN_GAP,
        padding: `15px ${PANEL_PAD}px 24px`,
      }}
    >
      <div
        style={{
          flex: "none",
          width: IMAGE_WIDTH,
          display: "flex",
          flexDirection: "column",
          gap: PHOTO_GAP,
        }}
      >
        {screen.images.map((image) => (
          <Photo
            key={image.src}
            src={image.src}
            alt={image.alt}
            style={{ width: IMAGE_WIDTH, flex: 1, minHeight: 0 }}
          />
        ))}
      </div>

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 12,
        }}
      >
        <CopyCard>
          <h2 style={CARD_TITLE}>{screen.title}</h2>
          {screen.body.map((paragraph, i) => (
            <p key={i} style={{ ...CARD_BODY, margin: "12px 0 0" }}>
              {paragraph}
            </p>
          ))}
        </CopyCard>

        {/* Sits directly under the card rather than on the column's floor, per
            the export: the column's own 12px gap is the whole spacing, and
            flex-end lines the arrow up with the card frame's right rail, since
            the frame runs to the column edge while the copy is inset 12px. */}
        <div
          style={{
            display: "flex",
            justifyContent: "flex-end",
            gap: 10,
          }}
        >
          {index > 0 && <StepButton direction="prev" onClick={() => onStep(-1)} />}
          {index < count - 1 && (
            <StepButton direction="next" onClick={() => onStep(1)} />
          )}
        </div>
      </div>
    </div>
  );
}

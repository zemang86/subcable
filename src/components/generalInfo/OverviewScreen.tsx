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

const IMAGE_WIDTH = 320;

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
        gap: 24,
        padding: `20px ${PANEL_PAD}px ${PANEL_PAD}px`,
      }}
    >
      <div
        style={{
          flex: "none",
          width: IMAGE_WIDTH,
          display: "flex",
          flexDirection: "column",
          gap: 14,
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
            <p key={i} style={{ ...CARD_BODY, margin: "14px 0 0" }}>
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

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
const IMAGE_RATIO = 150.08 / 108.62; // from the export's image frames

export default function OverviewScreen({
  screen,
  cycleKey,
  counting,
  index,
  count,
  onStep,
}: { screen: OverviewData } & ScreenProps) {
  return (
    <div
      style={{
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
            style={{
              width: IMAGE_WIDTH,
              height: Math.round(IMAGE_WIDTH / IMAGE_RATIO),
            }}
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
        <CopyCard cycleKey={cycleKey} counting={counting}>
          <h2 style={CARD_TITLE}>{screen.title}</h2>
          {screen.body.map((paragraph, i) => (
            <p key={i} style={{ ...CARD_BODY, margin: "14px 0 0" }}>
              {paragraph}
            </p>
          ))}
        </CopyCard>

        <div style={{ display: "flex", justifyContent: "flex-end", gap: 10 }}>
          {index > 0 && <StepButton direction="prev" onClick={() => onStep(-1)} />}
          {index < count - 1 && (
            <StepButton direction="next" onClick={() => onStep(1)} />
          )}
        </div>
      </div>
    </div>
  );
}

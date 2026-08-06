"use client";

import type { CutawayScreen as CutawayData } from "@/data/generalInfo";
import {
  CARD_BODY,
  CopyCard,
  PANEL_PAD,
  type ScreenProps,
} from "./shared";

/**
 * Inside The Cable — the labelled cutaway on the left (a single asset lifted
 * from the export, labels and all), the layer table on the right, and the
 * construction note beneath it.
 */
export default function CutawayScreen({
  screen,
}: { screen: CutawayData } & ScreenProps) {
  return (
    <div
      style={{
        height: "100%",
        boxSizing: "border-box",
        display: "flex",
        gap: 20,
        alignItems: "stretch",
        padding: `20px ${PANEL_PAD}px ${PANEL_PAD}px`,
      }}
    >
      {/* The asset's own left edge is the cable's cut face — a vertical rule at
          x=0 — so it is drawn to run off the frame, not to sit inside it. The
          negative margin cancels the panel's left padding and lands that rule
          on the PanelFrame rail, where the two read as one line. It shifts the
          box rather than widening it, so the diagram translates left at the
          same size and the 20px gap to the table is unchanged. */}
      {/* eslint-disable-next-line @next/next/no-img-element -- static export, no image optimizer */}
      <img
        src={screen.diagram.src}
        alt={screen.diagram.alt}
        style={{
          flex: "0 0 54%",
          width: "54%",
          marginLeft: -PANEL_PAD,
          height: "100%",
          minHeight: 0,
          objectFit: "contain",
          objectPosition: "left center",
        }}
      />

      <div
        style={{
          flex: 1,
          minWidth: 0,
          display: "flex",
          flexDirection: "column",
          gap: 16,
        }}
      >
        <table
          style={{
            width: "100%",
            borderCollapse: "collapse",
            tableLayout: "fixed",
          }}
        >
          <tbody>
            {screen.rows.map((row) => (
              <tr key={row.layer}>
                <th
                  scope="row"
                  style={{
                    width: "38%",
                    textAlign: "left",
                    padding: "9px 12px",
                    background: "rgba(255, 255, 255, 0.16)",
                    borderTop: "1px solid rgba(255, 255, 255, 0.75)",
                    borderRight: "1px solid rgba(255, 255, 255, 0.75)",
                    fontFamily: "var(--v1-mono)",
                    fontWeight: 400,
                    fontSize: 14,
                    lineHeight: "19px",
                    color: "var(--v1-fg)",
                  }}
                >
                  {row.layer}
                </th>
                <td
                  style={{
                    padding: "9px 12px",
                    background: "rgba(255, 255, 255, 0.08)",
                    borderTop: "1px solid rgba(255, 255, 255, 0.75)",
                    fontFamily: "var(--v1-mono)",
                    fontWeight: 300,
                    fontSize: 12,
                    lineHeight: "17px",
                    color: "var(--v1-fg)",
                  }}
                >
                  {row.note}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ marginTop: "auto" }} />
        <CopyCard>
          <p style={{ ...CARD_BODY, fontSize: 13, lineHeight: "21px", margin: 0 }}>
            {screen.note}
          </p>
        </CopyCard>
      </div>
    </div>
  );
}

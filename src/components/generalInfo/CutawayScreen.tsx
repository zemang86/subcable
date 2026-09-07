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
 *
 * The table is ours: insidethecable.svg names the eight layers on the diagram
 * itself and carries nothing on the right but the note card, so the export has
 * no type scale to copy for it. Eight rows of two columns is the densest block
 * in the panel, and on the export's 634px body it is the only screen where the
 * table's own metrics — not the copy — decide whether the screen fits. They are
 * set from the fit rather than from the design: 12/16 for the layer, 11/15 for
 * the note, 6px cells. That lands the table at 308px in English and 323 in
 * Malay, whose notes run half a line longer.
 */
const LAYER_FS = 12;
const LAYER_LH = "16px";
const NOTE_FS = 11;
const NOTE_LH = "15px";
const CELL_PAD = "6px 12px";
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
        padding: `15px ${PANEL_PAD}px 24px`,
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
                    padding: CELL_PAD,
                    background: "rgba(255, 255, 255, 0.16)",
                    borderTop: "1px solid rgba(255, 255, 255, 0.75)",
                    borderRight: "1px solid rgba(255, 255, 255, 0.75)",
                    fontFamily: "var(--v1-mono)",
                    fontWeight: 400,
                    fontSize: LAYER_FS,
                    lineHeight: LAYER_LH,
                    color: "var(--v1-fg)",
                  }}
                >
                  {row.layer}
                </th>
                <td
                  style={{
                    padding: CELL_PAD,
                    background: "rgba(255, 255, 255, 0.08)",
                    borderTop: "1px solid rgba(255, 255, 255, 0.75)",
                    fontFamily: "var(--v1-mono)",
                    fontWeight: 300,
                    fontSize: NOTE_FS,
                    lineHeight: NOTE_LH,
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
          <p style={{ ...CARD_BODY, fontSize: NOTE_FS, lineHeight: "17px", margin: 0 }}>
            {screen.note}
          </p>
        </CopyCard>
      </div>
    </div>
  );
}

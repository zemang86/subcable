"use client";

import { useLayoutEffect, useState } from "react";
import type { DialogId } from "@/lib/types";

// Leader line connecting the active left-cluster button to its open dialog's
// title strip. Mirrors temp/stem_buttonleft.svg: a diagonal rising from the
// button (green end) up to a corner, then a short horizontal cap (white end)
// plugging into the title strip's left edge. Geometry is measured from the
// live DOM each time the dialog opens or the viewport resizes, so the diagonal
// and cap stretch to whatever gap the centred dialog leaves.

// Push the start point just past the button's green selection ring (the ring
// overhangs the 76px button by ~20px).
const RING_PAD = 16;
// Horizontal cap length where the line meets the title (native SVG ≈ 64px).
const CAP = 60;
const STROKE = 2;

type Geom = { bx: number; by: number; tx: number; ty: number };

export function ClusterStem({
  openDialog,
  viewport,
}: {
  openDialog: DialogId;
  viewport: { width: number; height: number };
}) {
  const [geom, setGeom] = useState<Geom | null>(null);

  useLayoutEffect(() => {
    if (!openDialog) {
      setGeom(null);
      return;
    }
    let raf = 0;
    let tries = 0;
    const measure = () => {
      const btn = document.querySelector<HTMLElement>(
        `[data-stem-btn="${openDialog}"]`,
      );
      const title = document.querySelector<HTMLElement>("[data-stem-title]");
      if (!btn || !title) {
        // Dialog title mounts a frame after openDialog flips — retry briefly.
        if (tries++ < 10) raf = requestAnimationFrame(measure);
        return;
      }
      const b = btn.getBoundingClientRect();
      const tt = title.getBoundingClientRect();
      // Leave the button at the 1:30 o'clock position (45° up-right) rather
      // than 3 o'clock, just past the selection ring.
      const r = b.width / 2 + RING_PAD;
      const cx = b.left + b.width / 2;
      const cy = b.top + b.height / 2;
      setGeom({
        bx: cx + r * Math.SQRT1_2,
        by: cy - r * Math.SQRT1_2,
        tx: tt.left,
        ty: tt.top + tt.height / 2,
      });
    };
    raf = requestAnimationFrame(measure);
    return () => cancelAnimationFrame(raf);
  }, [openDialog, viewport.width, viewport.height]);

  if (!openDialog || !geom) return null;

  const { bx, by, tx, ty } = geom;
  // Corner where the diagonal meets the horizontal cap. Keep the cap from
  // exceeding the available horizontal run on small gaps.
  const cap = Math.min(CAP, Math.max(0, (tx - bx) * 0.4));
  const cornerX = tx - cap;
  const path = `M ${bx} ${by} L ${cornerX} ${ty} L ${tx} ${ty}`;
  const gid = `cluster-stem-grad-${openDialog}`;

  return (
    <svg
      aria-hidden
      width={viewport.width}
      height={viewport.height}
      viewBox={`0 0 ${viewport.width} ${viewport.height}`}
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 49,
        pointerEvents: "none",
      }}
    >
      <defs>
        <linearGradient
          id={gid}
          x1={bx}
          y1={by}
          x2={tx}
          y2={ty}
          gradientUnits="userSpaceOnUse"
        >
          <stop offset="0" stopColor="#80FF4E" />
          <stop offset="1" stopColor="#FFFFFF" />
        </linearGradient>
      </defs>
      <path
        d={path}
        fill="none"
        stroke={`url(#${gid})`}
        strokeWidth={STROKE}
        strokeLinejoin="round"
        strokeLinecap="round"
      />
    </svg>
  );
}

"use client";

import dynamic from "next/dynamic";

// Temporary screenshot-only route — bare globe, no HUD, no cable glow.
// Delete src/app/capture/ and src/components/GlobeCapture.tsx when done.
const GlobeCapture = dynamic(() => import("@/components/GlobeCapture"), {
  ssr: false,
});

export default function CapturePage() {
  return <GlobeCapture />;
}

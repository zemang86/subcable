"use client";

import dynamic from "next/dynamic";

// Temporary alignment-only route — overlays the live globe on the emerge clip's
// final frame so the reveal pose can be matched and copied into GlobeScene.
// Delete src/app/align/ and src/components/GlobeAlign.tsx when done.
const GlobeAlign = dynamic(() => import("@/components/GlobeAlign"), {
  ssr: false,
});

export default function AlignPage() {
  return <GlobeAlign />;
}

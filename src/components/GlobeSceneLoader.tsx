"use client";
import dynamic from "next/dynamic";
import LoadingScreen from "./LoadingScreen";

// Client-side dynamic boundary for the whole globe experience. GlobeScene
// statically imports three + three-globe (~435 KB gzip) — behind this
// boundary that payload downloads/parses AFTER first paint, behind the same
// LoadingScreen that GlobeScene itself shows until the globe boots (its 3s
// minimum hold dwarfs the chunk swap, so the handoff is invisible).
const GlobeScene = dynamic(() => import("./GlobeScene"), {
  ssr: false,
  loading: () => <LoadingScreen />,
});

export default GlobeScene;

export const TM_COLORS = {
  // TM Brand
  primary: "#2362DD",
  lightBlue: "#99B6FF",
  brightBlue: "#1700E6",

  // UI Dark Theme
  bgPrimary: "#0A0E1A",
  bgSecondary: "#111827",
  bgCard: "#1A1F35",
  borderGlow: "rgba(35, 98, 221, 0.3)",
  textPrimary: "#E2E8F0",
  textSecondary: "#94A3B8",
  textAccent: "#60A5FA",

  // Status
  statusActive: "#22C55E",
  statusPlanned: "#06B6D4",
  statusRetired: "#64748B",
  statusInactive: "#475569",

  // Globe
  atmosphereColor: "#2362DD",
  landingPointDefault: "#60A5FA",
  landingPointActive: "#FFD700",
  cableHighlight: "#FFD700",
  cableMuted: "rgba(100, 100, 100, 0.18)",
  cableRetired: "rgba(100, 116, 139, 0.55)",
  cablePlanned: "#06B6D4",
} as const;

// One color per cable family. Palette designed for legibility on a dark globe;
// closely-related cables (SMW family, Stingray family) use related hues.
export const CABLE_COLORS: Record<string, string> = {
  // International — TM-owned hero cables
  smw4: "#FFB347",
  smw5: "#FF8C42",
  bbg: "#E25B7B",
  aag: "#9D4EDD",
  apcn2: "#7B68EE",
  cm: "#FF6B9D",
  bdm: "#00BCD4",
  dmcs: "#26C6DA",
  mct: "#FF6B35",
  nugate: "#A8DADC",
  "sat3-wasc-safe": "#F5A623",

  // IRU
  flag: "#84CC16",
  fa1: "#A3E635",

  // Domestic
  mdscs: "#3B82F6",
  bps: "#60A5FA",
  "langkawi-perlis": "#93C5FD",
  skr1m: "#2362DD",
  "stingray-pangkor": "#10B981",
  "stingray-tioman": "#10B981",
  "stingray-perhentian": "#10B981",
  "stingray2-ketam": "#34D399",
  "stingray2-redang": "#34D399",

  // Planned (overridden visually by status, but here for completeness)
  smw6: "#06B6D4",
  alc: "#22D3EE",
  "aug-east": "#22D3EE",
  candle: "#67E8F9",
};

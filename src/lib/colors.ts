// TM Global brand palette — per "Quick Reference to Brand Guidelines" v1/10/2022.
// Primary blues + black/white; secondary oranges + red as accents.
export const TM_COLORS = {
  // TM Global brand — primary
  cobalt: "#1800E7",
  navy: "#180092",
  darkBlue: "#06013A",
  black: "#000000",
  white: "#FFFFFF",

  // TM Global brand — secondary (accents)
  red: "#D82E00",
  accentOrange: "#FF5E00",
  orange: "#FF7A00",
  lightOrange: "#F7B986",

  // Legacy alias kept for any imports still referencing primary.
  primary: "#1800E7",

  // UI dark theme — built around darkBlue/navy, not arbitrary slate
  bgPrimary: "#06013A",
  bgSecondary: "#0B0750",
  bgCard: "#120A6B",
  borderGlow: "rgba(24, 0, 231, 0.35)",
  textPrimary: "#F5F5F5",
  textSecondary: "#A8B0D6",
  textAccent: "#7A8AFF",

  // Status — biased to brand where possible
  statusActive: "#22C55E",
  statusPlanned: "#F7B986",
  statusRetired: "#64748B",
  statusInactive: "#475569",

  // Globe
  atmosphereColor: "#1800E7",
  landingPointDefault: "#7A8AFF",
  landingPointActive: "#FF5E00",
  cableHighlight: "#FF5E00",
  cableMuted: "rgba(120, 130, 170, 0.18)",
  cableRetired: "rgba(120, 130, 170, 0.55)",
  cablePlanned: "#F7B986",
} as const;

// One color per cable family. Palette stays varied for legibility on the globe;
// retuned to lean on brand primaries + accents where it doesn't hurt distinction.
export const CABLE_COLORS: Record<string, string> = {
  // International — TM-owned hero cables
  smw4: "#FFB347",
  smw5: "#FF7A00",
  bbg: "#E25B7B",
  aag: "#9D4EDD",
  apcn2: "#7B68EE",
  cm: "#FF6B9D",
  bdm: "#00BCD4",
  dmcs: "#26C6DA",
  mct: "#FF5E00",
  nugate: "#A8DADC",
  "sat3-wasc-safe": "#F5A623",

  // IRU
  flag: "#84CC16",
  fa1: "#A3E635",

  // Domestic
  mdscs: "#1800E7",
  bps: "#7A8AFF",
  "langkawi-perlis": "#B8C4FF",
  skr1m: "#180092",
  "stingray-pangkor": "#10B981",
  "stingray-tioman": "#10B981",
  "stingray-perhentian": "#10B981",
  "stingray2-ketam": "#34D399",
  "stingray2-redang": "#34D399",

  // Planned
  smw6: "#F7B986",
  alc: "#F7B986",
  "aug-east": "#F7B986",
  candle: "#F7B986",
};

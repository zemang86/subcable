// v1.0 tactical-HUD palette — source of truth is
// docs/design_handoff_subcable_v1/tokens-v1.json. Mirrored here so TS code
// can reference values without going through CSS variables.
export const V1_COLORS = {
  // Surface
  bg:           "#040E1F",
  bgDeep:       "#061630",
  bgCobalt:     "#0A0449",

  // Brand
  blue:         "#034DA1",
  blue2:        "#0362A1",
  orange:       "#F05A22",
  orangeHot:    "#FF4D00",
  orangeDeep:   "#BC3514",

  // Status (NEW in v1)
  active:       "#8FFF3F",
  active2:      "#00FF4D",
  activeBg:     "#3F642E",
  inactive:     "#FF3F3F",
  inactive2:    "#ED1B2E",   // selected-cable hot red
  inactiveBg:   "#642E2E",

  // Text
  fg:           "#FFFFFF",
  fgCream:      "#FFF6F6",
  fgIceblue:    "#F1F7FF",
  mute:         "#C4C4C4",
  mute2:        "#D9D9D9",
  muteDark:     "#4E4F4E",

  // Globe
  atmosphere:   "#034DA1",
  cableSelected:"#ED1B2E",
  cableMuted:   "rgba(255, 255, 255, 0.30)",
  cableMutedHex:"#FFFFFF",
} as const;

// Legacy alias kept while Phase 5 (GlobeScene re-skin) is pending. Each key
// resolves to the closest v1 equivalent so the cobalt era can compile without
// leaking the old palette into visible chrome.
export const TM_COLORS = {
  cobalt:               V1_COLORS.blue,
  navy:                 V1_COLORS.bgDeep,
  darkBlue:             V1_COLORS.bg,
  black:                "#000000",
  white:                V1_COLORS.fg,
  red:                  V1_COLORS.inactive2,
  accentOrange:         V1_COLORS.orange,
  orange:               V1_COLORS.orange,
  lightOrange:          V1_COLORS.orange,
  primary:              V1_COLORS.blue,
  bgPrimary:            V1_COLORS.bg,
  bgSecondary:          V1_COLORS.bgDeep,
  bgCard:               V1_COLORS.bgDeep,
  borderGlow:           "rgba(3, 77, 161, 0.35)",
  textPrimary:          V1_COLORS.fg,
  textSecondary:        V1_COLORS.mute,
  textAccent:           V1_COLORS.orange,
  statusActive:         V1_COLORS.active,
  statusPlanned:        V1_COLORS.orange,
  statusRetired:        V1_COLORS.muteDark,
  statusInactive:       V1_COLORS.inactive,
  atmosphereColor:      V1_COLORS.atmosphere,
  landingPointDefault:  V1_COLORS.fg,
  landingPointActive:   V1_COLORS.orange,
  cableHighlight:       V1_COLORS.cableSelected,
  cableMuted:           V1_COLORS.cableMuted,
  cableRetired:         "rgba(255, 255, 255, 0.18)",
  cablePlanned:         V1_COLORS.orange,
} as const;

// One color per cable family — kept for per-cable identity in the side panel,
// even though the globe now renders selected/unselected uniformly.
export const CABLE_COLORS: Record<string, string> = {
  // International
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

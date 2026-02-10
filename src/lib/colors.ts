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

  // Cable Colors
  cableBDM: "#00BCD4",
  cableMCT: "#FF6B35",
  cableSKR1M: "#2362DD",
  cableHighlight: "#FFD700",

  // Globe
  atmosphereColor: "#2362DD",
  landingPointDefault: "#60A5FA",
  landingPointActive: "#FFD700",
} as const;

export const CABLE_COLORS: Record<string, string> = {
  bdm: TM_COLORS.cableBDM,
  mct: TM_COLORS.cableMCT,
  skr1m: TM_COLORS.cableSKR1M,
};

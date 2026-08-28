export interface LandingPoint {
  id: string;
  name: string;
  city: string;
  country: string;
  region: Region;
  lat: number;
  lng: number;
  cableIds: string[];
  /** Marks "PoP" / terrestrial-only locations from the source data. */
  kind?: "submarine" | "pop";
}

export type Region =
  | "Malaysia"
  | "Southeast Asia"
  | "South Asia"
  | "East Asia"
  | "Pacific"
  | "Middle East"
  | "Europe"
  | "Africa"
  | "Americas";

export type Classification = "international" | "iru" | "domestic";
export type Status = "active" | "retired" | "planned" | "inactive";

export interface CableSystem {
  id: string;
  name: string;
  shortName: string;
  classification: Classification;
  status: Status;
  /** Year construction started, when known. */
  buildYear?: number;
  /** Ready-for-service date or year. */
  rfs: string;
  /** Cable length, free-form (e.g. "20,000 km"). */
  length: string;
  /** Numeric distance for sorting / aggregation; in km. */
  distanceKm?: number;
  /** Design capacity for TM's portion, free-form (e.g. "698 Gbps"). */
  capacity?: string;
  /** Geographic regions the cable touches. */
  regions: Region[];
  /** Free-form route summary from source data. */
  routeSummary?: string;
  owners: string[];
  landingPointIds: string[];
  color: string;
  description: L;
}

export interface CableSegment {
  fromPoint: string;
  toPoint: string;
  coords: [number, number][]; // [lat, lng] pairs
}

export interface CableRoute {
  cableId: string;
  segments: CableSegment[];
}

export interface CableLandingStation {
  id: string;
  name: string;
  region: "Peninsular" | "East Malaysia";
  status: "existing" | "ongoing";
  cables: string[];
}

// ───────── v1.0 UI state types ─────────

export type Filter = "all" | "international" | "domestic";

export type Language = "en" | "bm";

/**
 * A string that exists in both languages. Canonical here rather than in
 * generalInfo.ts, which used to own it, because cable descriptions carry it too.
 */
export type L = { en: string; bm: string };

export type DialogId = "morse" | "funfact" | "howto" | null;

export interface MorseState {
  /** In-progress morse symbol buffer (dots and dashes). */
  buffer: string;
  /** Committed decoded text. */
  text: string;
  /** Landing-point id of the sender end. */
  from: string;
  /** Landing-point id of the recipient end. */
  to: string;
}

export interface LandingPoint {
  id: string;
  name: string;
  city: string;
  country: string;
  lat: number;
  lng: number;
  cableIds: string[];
}

export interface CableSystem {
  id: string;
  name: string;
  shortName: string;
  length: string;
  rfs: string;
  owners: string[];
  landingPointIds: string[];
  color: string;
  description: string;
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

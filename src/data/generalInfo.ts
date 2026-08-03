/**
 * Content for the General Information panel (the "i" cluster button).
 *
 * Five tabs, each with its own layout and composition — so a screen carries a
 * `kind` and the panel renders the matching layout component. Screens inside a
 * tab auto-advance every INFO_SLIDE_MS and loop back to the first; the bar
 * under the copy is that countdown. Videos opt out (`autoAdvance: false`) —
 * rotating away from a playing clip would be wrong.
 *
 * Copy transcribed from temp/funfact/*.css + the SVG exports. English-only for
 * now; the BM pass lands in a later session.
 */

export type InfoImage = { src: string; alt: string };

/** Overview: two stacked photos left, copy card right. */
export type OverviewScreen = {
  kind: "overview";
  id: string;
  title: string;
  body: string[];
  images: InfoImage[];
};

/** How It's Made: material story left, tree spec + description right. */
export type MaterialScreen = {
  kind: "material";
  id: string;
  strip: string;
  image: InfoImage;
  title: string;
  body: string[];
  factsTitle: string;
  facts: { label: string; value: string }[];
  descriptionTitle: string;
  description: string;
  sideImage: InfoImage;
};

/** Inside The Cable: labelled cutaway left, layer table + note right. */
export type CutawayScreen = {
  kind: "cutaway";
  id: string;
  diagram: InfoImage;
  rows: { layer: string; note: string }[];
  note: string;
};

/** Then And Now: photos + copy + spec grid, switched by the Then/Now toggle. */
export type EraScreen = {
  kind: "era";
  id: string;
  toggleLabel: string;
  title: string;
  body: string[];
  images: InfoImage[];
  specs: { label: string; value: string }[];
};

/** Videos: poster + player chrome. A screen with no `src` stays a still. */
export type VideoScreen = {
  kind: "video";
  id: string;
  title: string;
  poster: InfoImage;
  src?: string;
  duration: string;
};

export type InfoScreen =
  | OverviewScreen
  | MaterialScreen
  | CutawayScreen
  | EraScreen
  | VideoScreen;

export type InfoTab = {
  id: string;
  label: string;
  screens: InfoScreen[];
  /** Defaults to true; false parks the hold timer for that tab. */
  autoAdvance?: boolean;
};

/** How long one screen holds before the tab advances to its next screen. */
export const INFO_SLIDE_MS = 10_000;

export const INFO_TABS: InfoTab[] = [
  {
    id: "overview",
    label: "Overview",
    screens: [
      {
        kind: "overview",
        id: "what-is-a-submarine-cable",
        title: "What Is a Submarine Cable?",
        body: [
          "Submarine communications cable is a cable laid on the seabed between land-based stations to carry telecommunication signals across stretches of ocean.",
        ],
        images: [
          {
            src: "/textures/funfact/overview-1-top.webp",
            alt: "Submarine cables running along the seabed",
          },
          {
            src: "/textures/funfact/overview-1-bottom.webp",
            alt: "Diver inspecting a submarine cable on the seabed",
          },
        ],
      },
      {
        kind: "overview",
        id: "connecting-the-world",
        title: "Submarine Cables: Connecting the World",
        body: [
          "As early as the 1870s, Malaysia was already connected to Britain and Madras through submarine telegraph cables, enabling direct communication across oceans. Within 30 years of the invention of the telegraph, submarine cable networks expanded through the Mediterranean Sea, the Red Sea via the Suez Canal, the Indian Ocean, and across the Pacific, connecting Malaysia to the rest of the world.",
          "Over the past 150 years, submarine cable technology has evolved significantly. Early telegraph cables have been replaced by modern fibre optic cables, which transmit vast amounts of information at the speed of light. Today, TM continues this legacy by providing advanced telecommunications infrastructure that connects people, businesses, and communities, making “Life and Business Made Easier” for a better Malaysia.",
        ],
        images: [
          {
            src: "/textures/funfact/overview-2-top.webp",
            alt: "Launch of the South East Asia Commonwealth Cable (SEACOM)",
          },
          {
            src: "/textures/funfact/overview-2-bottom.webp",
            alt: "TM cable landing station",
          },
        ],
      },
    ],
  },
  {
    id: "how-its-made",
    label: "How It's Made",
    screens: [
      {
        kind: "material",
        id: "gutta-percha",
        strip: "Gutta Percha",
        image: {
          src: "/textures/funfact/howitsmade-leaves.webp",
          alt: "Nyatoh Taban Merah leaves",
        },
        title: "Gutta Percha",
        body: [
          "From the leaves of the Nyatoh Taban Merah (Palaquium gutta), a tree native to Southeast Asia, came gutta percha — a natural latex that transformed global communication. The fresh leaves were crushed using a grinder stone to extract the white latex, which was then boiled and processed into blocks for export.",
          "Due to its waterproof and electrical insulating properties, gutta percha became the key material used to insulate early submarine telegraph cables. It protected the cable core from seawater, allowing signals to travel safely across oceans and connecting countries around the world.",
        ],
        factsTitle: "Tree Information",
        facts: [
          { label: "Common Name", value: "Gutta Percha" },
          { label: "Scientific Name", value: "Palaquium gutta" },
          { label: "Local Name", value: "Nyatoh Taban Merah" },
        ],
        descriptionTitle: "Description",
        description:
          "Nyatoh Taban Merah (Palaquium gutta) is a medium-sized timber tree species, grouped under the Sapotaceae family. It naturally occurs in the lowland mixed tropical forest. The tree can grow up to 40 metres (130 feet) tall. The Gutta Percha latex is produced by crushing the Nyatoh Taban Merah’s fresh leaves.",
        sideImage: {
          src: "/textures/funfact/howitsmade-tree.webp",
          alt: "Nyatoh Taban Merah tree in the forest",
        },
      },
    ],
  },
  {
    id: "inside-the-cable",
    label: "Inside The Cable",
    screens: [
      {
        kind: "cutaway",
        id: "layers",
        diagram: {
          src: "/textures/funfact/inside-cutaway.webp",
          alt: "Cutaway of a submarine cable showing each layer",
        },
        rows: [
          {
            layer: "Optical Fibre",
            note: "Glass strands thinner than a hair — carry all data as light",
          },
          { layer: "Petroleum Jelly", note: "Waterproofs the optical core" },
          {
            layer: "Aluminium Tube",
            note: "Conducts power to repeaters every ~100km",
          },
          { layer: "Polycarbonate Copper", note: "Pressure-resistant shell" },
          { layer: "Aluminium Water Barrier", note: "Blocks seawater intrusion" },
          { layer: "Stranded Steel Wires", note: "12–14 wires for tensile strength" },
          { layer: "Mylar Tape", note: "Moisture seal beneath casing" },
          { layer: "Polyethylene Jacket", note: "Outer weatherproof casing" },
        ],
        note: "The core of the cable is covered with brass tape to protect it from marine insect borer. The jute yarn is then twisted round the core to serve as a bedding for the outer protecting wires. Finally, the cable is covered with galvanised iron wires as additional protection against corrosion.",
      },
    ],
  },
  {
    id: "then-and-now",
    label: "Then And Now",
    screens: [
      {
        kind: "era",
        id: "then",
        toggleLabel: "Then",
        title: "Then: Telegraph Cables",
        body: [
          "Early submarine cables carried electrical telegraph signals across oceans, enabling the first international communication networks. However, their limited transmission speed and capacity restricted the amount of information they could carry.",
        ],
        images: [
          {
            src: "/textures/funfact/thennow-then-top.webp",
            alt: "Shore end of an early telegraph cable being landed by hand",
          },
          {
            src: "/textures/funfact/thennow-then-bottom.webp",
            alt: "Deep sea section of the first trans-Atlantic submarine cable, made in 1858",
          },
        ],
        specs: [
          { label: "Signal Type", value: "Electrical (Copper)" },
          { label: "Use", value: "Telegraph Messages" },
          { label: "Speed", value: "Words Per Minute" },
          { label: "Reliability", value: "Often Failed" },
          { label: "Coverage", value: "Limited Routes" },
          { label: "Lifespan", value: "Short" },
        ],
      },
      {
        kind: "era",
        id: "now",
        toggleLabel: "Now",
        title: "Now: Fibre Optic Cables",
        body: [
          "Modern submarine cables use fibre optic technology to transmit data as pulses of light. They provide high-speed, reliable connections across continents and form the backbone of today’s global digital infrastructure.",
        ],
        images: [
          {
            src: "/textures/funfact/thennow-now-top.webp",
            alt: "Modern fibre optic submarine cables on the seabed",
          },
          {
            src: "/textures/funfact/thennow-now-bottom.webp",
            alt: "Cutaway of a modern fibre optic submarine cable",
          },
        ],
        specs: [
          { label: "Signal Type", value: "Light (Fibre Optics)" },
          { label: "Use", value: "Internet, Calls, Videos" },
          { label: "Speed", value: "Terabits Per Second" },
          { label: "Reliability", value: "Highly Reliable" },
          { label: "Coverage", value: "Global Network" },
          { label: "Lifespan", value: "Around 25 Years" },
        ],
      },
    ],
  },
  {
    id: "videos",
    label: "Videos",
    autoAdvance: false,
    screens: [
      {
        kind: "video",
        id: "subsea-cable-repair",
        title: "Subsea Cable Repair",
        poster: {
          src: "/textures/funfact/video-repair-poster.webp",
          alt: "Cable repair ship under way",
        },
        src: "/video/funfact-subsea-cable-repair.mp4",
        duration: "3:08",
      },
      {
        kind: "video",
        id: "seacom-first-link",
        title: "SEACOM: Malaysia’s First Submarine Cable Link",
        poster: {
          src: "/textures/funfact/video-seacom-poster.webp",
          alt: "SEACOM inauguration ceremony",
        },
        src: "/video/funfact-seacom-malaysia.mp4",
        duration: "1:05",
      },
    ],
  },
];

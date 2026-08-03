/**
 * Content for the General Information panel (the "i" cluster button).
 *
 * Five tabs; each tab holds its own screens ("infos"). A tab's screens
 * auto-advance every INFO_SLIDE_MS and loop back to the first — the timer bar
 * under the copy is the countdown. Only Overview has content so far; the other
 * four each get their own layout and composition from Figma later, so they are
 * deliberately empty rather than faked with the Overview layout.
 *
 * Copy is English-only for now — the BM pass lands in a later session.
 */

export type InfoImage = { src: string; alt: string };

export type InfoSlide = {
  id: string;
  title: string;
  /** Paragraphs, rendered in order. */
  body: string[];
  /** Left column, top to bottom. */
  images: InfoImage[];
};

export type InfoTab = {
  id: string;
  label: string;
  /** Empty until that tab's design lands — renders the holding state. */
  slides: InfoSlide[];
};

/** How long one screen holds before the tab advances to its next screen. */
export const INFO_SLIDE_MS = 10_000;

export const INFO_TABS: InfoTab[] = [
  {
    id: "overview",
    label: "Overview",
    slides: [
      {
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
  { id: "how-its-made", label: "How It's Made", slides: [] },
  { id: "inside-the-cable", label: "Inside The Cable", slides: [] },
  { id: "then-and-now", label: "Then And Now", slides: [] },
  { id: "videos", label: "Videos", slides: [] },
];

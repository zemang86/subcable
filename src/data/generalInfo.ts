/**
 * Content for the General Information panel (the "i" cluster button).
 *
 * Five tabs, each with its own layout and composition — so a screen carries a
 * `kind` and the panel renders the matching layout component. Screens inside a
 * tab auto-advance every INFO_SLIDE_MS and loop back to the first; the bar
 * under the copy is that countdown. Videos opt out (`autoAdvance: false`) —
 * rotating away from a playing clip would be wrong.
 *
 * ── Bilingual ──────────────────────────────────────────────────────────────
 * Every visible string is an `L` pair: { en, bm }. The screen components still
 * consume plain strings — `getInfoTabs(lang)` resolves the tree once per
 * language and caches it, so nothing downstream had to change.
 *
 * English copy and the BM marked `client` are transcribed from
 * temp/funfact/info-table.csv (English verified verbatim against the sheet).
 * The client's sheet left three areas untranslated; the BM for those is ours
 * and is marked `ours — pending client sign-off`:
 *
 *   1. The whole Then And Now tab (titles, both paragraphs, toggle labels and
 *      the 18 spec-table strings).
 *   2. The Inside The Cable layer table's note column.
 *   3. Tab labels, video titles, and image alt text.
 *
 * The eight layer NAMES in Inside The Cable stay English in both languages on
 * purpose: they are rendered into inside-cutaway.webp beside the table, so
 * translating the table alone would contradict the diagram. Changing them means
 * re-exporting that asset from Figma with BM labels.
 *
 * Register follows the client's own translator, notably "fiber optik" rather
 * than the DBP-standard "gentian optik" — their Overview copy uses it, and the
 * Then And Now tab sits two tabs away.
 */

import type { Language } from "@/lib/types";

/** An English / Bahasa Malaysia pair. Every visible string is one of these. */
export type L = { en: string; bm: string };

/** Identical in both languages — proper nouns, scientific names, units. */
const same = (s: string): L => ({ en: s, bm: s });

/**
 * The shape a component sees: the same tree with every `L` collapsed to the
 * string for one language. Non-copy fields (`id`, `kind`, `src`, `duration`)
 * are plain strings in the source and pass through untouched.
 */
type Resolved<T> = T extends L
  ? string
  : T extends readonly (infer U)[]
    ? Resolved<U>[]
    : T extends object
      ? { [K in keyof T]: Resolved<T[K]> }
      : T;

type InfoImageSource = { src: string; alt: L };

/** Overview: two stacked photos left, copy card right. */
type OverviewScreenSource = {
  kind: "overview";
  id: string;
  title: L;
  body: L[];
  images: InfoImageSource[];
};

/** How It's Made: material story left, tree spec + description right. */
type MaterialScreenSource = {
  kind: "material";
  id: string;
  strip: L;
  image: InfoImageSource;
  title: L;
  body: L[];
  factsTitle: L;
  facts: { label: L; value: L }[];
  descriptionTitle: L;
  description: L;
  sideImage: InfoImageSource;
};

/** Inside The Cable: labelled cutaway left, layer table + note right. */
type CutawayScreenSource = {
  kind: "cutaway";
  id: string;
  diagram: InfoImageSource;
  rows: { layer: L; note: L }[];
  note: L;
};

/** Then And Now: photos + copy + spec grid, switched by the Then/Now toggle. */
type EraScreenSource = {
  kind: "era";
  id: string;
  toggleLabel: L;
  title: L;
  body: L[];
  images: InfoImageSource[];
  specs: { label: L; value: L }[];
};

/** Videos: poster + player chrome. A screen with no `src` stays a still. */
type VideoScreenSource = {
  kind: "video";
  id: string;
  title: L;
  poster: InfoImageSource;
  src?: string;
  duration: string;
};

type InfoScreenSource =
  | OverviewScreenSource
  | MaterialScreenSource
  | CutawayScreenSource
  | EraScreenSource
  | VideoScreenSource;

type InfoTabSource = {
  id: string;
  label: L;
  screens: InfoScreenSource[];
  /** Defaults to true; false parks the hold timer for that tab. */
  autoAdvance?: boolean;
};

export type InfoImage = Resolved<InfoImageSource>;
export type OverviewScreen = Resolved<OverviewScreenSource>;
export type MaterialScreen = Resolved<MaterialScreenSource>;
export type CutawayScreen = Resolved<CutawayScreenSource>;
export type EraScreen = Resolved<EraScreenSource>;
export type VideoScreen = Resolved<VideoScreenSource>;
export type InfoScreen = Resolved<InfoScreenSource>;
export type InfoTab = Resolved<InfoTabSource>;

/** How long one screen holds before the tab advances to its next screen. */
export const INFO_SLIDE_MS = 10_000;

const INFO_TABS_SOURCE: InfoTabSource[] = [
  {
    id: "overview",
    // ours — pending client sign-off. "Pengenalan" over the literal "Gambaran
    // Keseluruhan": the tab is ~192px and the label is set at 16px uppercase.
    label: { en: "Overview", bm: "Pengenalan" },
    screens: [
      {
        kind: "overview",
        id: "what-is-a-submarine-cable",
        title: {
          en: "What Is a Submarine Cable?",
          bm: "Apakah Kabel Dasar Laut?", // client
        },
        body: [
          {
            en: "Submarine communications cable is a cable laid on the seabed between land-based stations to carry telecommunication signals across stretches of ocean.",
            // client
            bm: "Kabel komunikasi dasar laut adalah kabel yang terletak di dasar laut di antara stesen daratan bagi membawa isyarat telekomunikasi merentasi lautan.",
          },
        ],
        images: [
          {
            src: "/textures/funfact/overview-1-top.webp",
            alt: {
              en: "Submarine cables running along the seabed",
              bm: "Kabel dasar laut terbentang di dasar laut", // ours
            },
          },
          {
            src: "/textures/funfact/overview-1-bottom.webp",
            alt: {
              en: "Diver inspecting a submarine cable on the seabed",
              bm: "Penyelam memeriksa kabel dasar laut di dasar laut", // ours
            },
          },
        ],
      },
      {
        kind: "overview",
        id: "connecting-the-world",
        title: {
          en: "Submarine Cables: Connecting the World",
          bm: "Kabel Dasar Laut: Penghubung Kepada Dunia", // client
        },
        body: [
          {
            en: "As early as the 1870s, Malaysia was already connected to Britain and Madras through submarine telegraph cables, enabling direct communication across oceans. Within 30 years of the invention of the telegraph, submarine cable networks expanded through the Mediterranean Sea, the Red Sea via the Suez Canal, the Indian Ocean, and across the Pacific, connecting Malaysia to the rest of the world.",
            // client
            bm: "Sejak tahun 1870-an lagi, Malaysia telahpun boleh berkomunikasi secara langsung dengan pihak di Britain dan Madras melalui talian telegraf dasar laut. Sepanjang 30 tahun terciptanya telegraf, rangkaian kabel dasar laut telah berkembang pesat ke Laut Mediterranean, Laut Merah melalui Terusan Suez, Lautan Hindi serta merentasi Lautan Pasifik, menghubungkan Malaysia dengan seluruh dunia.",
          },
          {
            en: "Over the past 150 years, submarine cable technology has evolved significantly. Early telegraph cables have been replaced by modern fibre optic cables, which transmit vast amounts of information at the speed of light. Today, TM continues this legacy by providing advanced telecommunications infrastructure that connects people, businesses, and communities, making “Life and Business Made Easier” for a better Malaysia.",
            // client
            bm: "Banyak kemajuan telah dikecapi sejak 150 tahun terdahulu, dan kabel-kabel telegraf yang lama telah ditukarkan kepada kabel-kabel fiber optik baharu yang mampu menghantar maklumat sepantas kelajuan cahaya. Dengan perubahan berterusan sepanjang abad ini, TM akan terus menyediakan infrastruktur telekomunikasi yang termaju untuk negara dalam menjadikan “Hidup dan Perniagaan Lebih Mudah” demi kesejahteraan Malaysia.",
          },
        ],
        images: [
          {
            src: "/textures/funfact/overview-2-top.webp",
            alt: {
              en: "Launch of the South East Asia Commonwealth Cable (SEACOM)",
              bm: "Pelancaran South East Asia Commonwealth Cable (SEACOM)", // ours
            },
          },
          {
            src: "/textures/funfact/overview-2-bottom.webp",
            alt: {
              en: "TM cable landing station",
              bm: "Stesen pendaratan kabel TM", // ours
            },
          },
        ],
      },
    ],
  },
  {
    id: "how-its-made",
    label: { en: "How It's Made", bm: "Cara Ia Dibuat" }, // ours
    screens: [
      {
        kind: "material",
        id: "gutta-percha",
        strip: same("Gutta Percha"),
        image: {
          src: "/textures/funfact/howitsmade-leaves.webp",
          alt: {
            en: "Nyatoh Taban Merah leaves",
            bm: "Daun pokok Nyatoh Taban Merah", // ours
          },
        },
        title: same("Gutta Percha"),
        body: [
          {
            en: "From the leaves of the Nyatoh Taban Merah (Palaquium gutta), a tree native to Southeast Asia, came gutta percha — a natural latex that transformed global communication. The fresh leaves were crushed using a grinder stone to extract the white latex, which was then boiled and processed into blocks for export.",
            // client
            bm: "Daripada daun pokok Nyatoh Taban Merah (Palaquium gutta), iaitu sejenis pokok yang berasal dari Asia Tenggara, terhasilnya gutta percha — sejenis lateks semula jadi yang telah mengubah komunikasi global. Daun-daun segar pokok ini dihancurkan menggunakan batu pengisar untuk mengekstrak lateks berwarna putih, yang kemudiannya direbus dan diproses menjadi blok untuk dieksport.",
          },
          {
            en: "Due to its waterproof and electrical insulating properties, gutta percha became the key material used to insulate early submarine telegraph cables. It protected the cable core from seawater, allowing signals to travel safely across oceans and connecting countries around the world.",
            // client
            bm: "Disebabkan sifatnya yang kalis air dan mempunyai keupayaan penebatan elektrik, gutta percha menjadi bahan utama yang digunakan untuk menebat kabel telegraf dasar laut pada peringkat awal. Ia melindungi teras kabel daripada air laut, membolehkan isyarat dihantar dengan selamat merentasi lautan dan menghubungkan negara-negara di seluruh dunia.",
          },
        ],
        factsTitle: { en: "Tree Information", bm: "Maklumat Pokok" }, // client
        facts: [
          // Labels client-supplied; values are names, identical in both.
          {
            label: { en: "Common Name", bm: "Nama Biasa" },
            value: same("Gutta Percha"),
          },
          {
            label: { en: "Scientific Name", bm: "Nama Saintifik" },
            value: same("Palaquium gutta"),
          },
          {
            label: { en: "Local Name", bm: "Nama Tempatan" },
            value: same("Nyatoh Taban Merah"),
          },
        ],
        // Heading is ours — the sheet runs the description straight on with no
        // heading of its own. BM matches the i18n `description` key.
        descriptionTitle: { en: "Description", bm: "Penerangan" },
        description: {
          en: "Nyatoh Taban Merah (Palaquium gutta) is a medium-sized timber tree species, grouped under the Sapotaceae family. It naturally occurs in the lowland mixed tropical forest. The tree can grow up to 40 metres (130 feet) tall. The Gutta Percha latex is produced by crushing the Nyatoh Taban Merah’s fresh leaves.",
          // client
          bm: "Nyatoh Taban Merah (Palaquium gutta) adalah spesies pokok kayu yang bersaiz sederhana yang diletakkan dalam kumpulan keluarga Sapotaceae. Ia tumbuh secara semula jadi di kawasan hutan tropika campur bertanah rendah. Pokok ini boleh tumbuh sehingga mencapai ketinggian 40 meter (130 kaki). Lateks Gutta Percha dihasilkan melalui proses menghancurkan daun pokok Nyatoh Taban Merah sehingga ianya mengeluarkan bahan getah.",
        },
        sideImage: {
          src: "/textures/funfact/howitsmade-tree.webp",
          alt: {
            en: "Nyatoh Taban Merah tree in the forest",
            bm: "Pokok Nyatoh Taban Merah di dalam hutan", // ours
          },
        },
      },
    ],
  },
  {
    id: "inside-the-cable",
    label: { en: "Inside The Cable", bm: "Dalam Kabel" }, // ours
    screens: [
      {
        kind: "cutaway",
        id: "layers",
        diagram: {
          src: "/textures/funfact/inside-cutaway.webp",
          alt: {
            en: "Cutaway of a submarine cable showing each layer",
            bm: "Keratan rentas kabel dasar laut menunjukkan setiap lapisan", // ours
          },
        },
        // Layer names stay English in both languages — they are drawn into
        // inside-cutaway.webp, so a translated table would disagree with the
        // picture next to it. Notes are ours, pending client sign-off.
        rows: [
          {
            layer: same("Optical Fibre"),
            note: {
              en: "Glass strands thinner than a hair — carry all data as light",
              bm: "Helaian kaca lebih halus daripada rambut — membawa semua data sebagai cahaya",
            },
          },
          {
            layer: same("Petroleum Jelly"),
            note: {
              en: "Waterproofs the optical core",
              bm: "Menjadikan teras optik kalis air",
            },
          },
          {
            layer: same("Aluminium Tube"),
            note: {
              en: "Conducts power to repeaters every ~100km",
              bm: "Menyalurkan kuasa ke pengulang setiap ~100km",
            },
          },
          {
            layer: same("Polycarbonate Copper"),
            note: {
              en: "Pressure-resistant shell",
              bm: "Lapisan tahan tekanan",
            },
          },
          {
            layer: same("Aluminium Water Barrier"),
            note: {
              en: "Blocks seawater intrusion",
              bm: "Menghalang kemasukan air laut",
            },
          },
          {
            layer: same("Stranded Steel Wires"),
            note: {
              en: "12–14 wires for tensile strength",
              bm: "12–14 wayar untuk kekuatan tegangan",
            },
          },
          {
            layer: same("Mylar Tape"),
            note: {
              en: "Moisture seal beneath casing",
              bm: "Pengedap lembapan di bawah sarung",
            },
          },
          {
            layer: same("Polyethylene Jacket"),
            note: {
              en: "Outer weatherproof casing",
              bm: "Sarung luar kalis cuaca",
            },
          },
        ],
        note: {
          en: "The core of the cable is covered with brass tape to protect it from marine insect borer. The jute yarn is then twisted round the core to serve as a bedding for the outer protecting wires. Finally, the cable is covered with galvanised iron wires as additional protection against corrosion.",
          // client
          bm: "Teras utama kabel dilitupi dengan lilitan tembaga untuk melindunginya daripada serangga laut perosak. Kemudiannya, lapisan benang jut dipintal di sekeliling kabel sebagai pelindung wayar. Akhir sekali, seluruh kabel akan disaluti dengan besi “galvanised” untuk melindunginya daripada kakisan.",
        },
      },
    ],
  },
  {
    // The client's sheet left this whole tab in English. Every BM string below
    // is ours — pending client sign-off.
    id: "then-and-now",
    label: { en: "Then And Now", bm: "Dahulu & Kini" },
    screens: [
      {
        kind: "era",
        id: "then",
        toggleLabel: { en: "Then", bm: "Dahulu" },
        title: { en: "Then: Telegraph Cables", bm: "Dahulu: Kabel Telegraf" },
        body: [
          {
            en: "Early submarine cables carried electrical telegraph signals across oceans, enabling the first international communication networks. However, their limited transmission speed and capacity restricted the amount of information they could carry.",
            bm: "Kabel dasar laut yang terawal membawa isyarat telegraf elektrik merentasi lautan, membolehkan rangkaian komunikasi antarabangsa yang pertama. Namun, kelajuan dan kapasiti penghantarannya yang terhad mengehadkan jumlah maklumat yang boleh dibawa.",
          },
        ],
        images: [
          {
            src: "/textures/funfact/thennow-then-top.webp",
            alt: {
              en: "Shore end of an early telegraph cable being landed by hand",
              bm: "Hujung pantai kabel telegraf awal didaratkan dengan tangan",
            },
          },
          {
            src: "/textures/funfact/thennow-then-bottom.webp",
            alt: {
              en: "Deep sea section of the first trans-Atlantic submarine cable, made in 1858",
              bm: "Bahagian laut dalam kabel dasar laut trans-Atlantik pertama, dibuat pada tahun 1858",
            },
          },
        ],
        specs: [
          {
            label: { en: "Signal Type", bm: "Jenis Isyarat" },
            value: { en: "Electrical (Copper)", bm: "Elektrik (Tembaga)" },
          },
          {
            label: { en: "Use", bm: "Kegunaan" },
            value: { en: "Telegraph Messages", bm: "Mesej Telegraf" },
          },
          {
            label: { en: "Speed", bm: "Kelajuan" },
            value: { en: "Words Per Minute", bm: "Perkataan Seminit" },
          },
          {
            label: { en: "Reliability", bm: "Kebolehpercayaan" },
            value: { en: "Often Failed", bm: "Kerap Gagal" },
          },
          {
            label: { en: "Coverage", bm: "Liputan" },
            value: { en: "Limited Routes", bm: "Laluan Terhad" },
          },
          {
            label: { en: "Lifespan", bm: "Jangka Hayat" },
            value: { en: "Short", bm: "Pendek" },
          },
        ],
      },
      {
        kind: "era",
        id: "now",
        toggleLabel: { en: "Now", bm: "Kini" },
        title: { en: "Now: Fibre Optic Cables", bm: "Kini: Kabel Fiber Optik" },
        body: [
          {
            en: "Modern submarine cables use fibre optic technology to transmit data as pulses of light. They provide high-speed, reliable connections across continents and form the backbone of today’s global digital infrastructure.",
            bm: "Kabel dasar laut moden menggunakan teknologi fiber optik untuk menghantar data dalam bentuk denyutan cahaya. Ia menyediakan sambungan berkelajuan tinggi dan boleh dipercayai merentasi benua, serta menjadi tulang belakang infrastruktur digital global hari ini.",
          },
        ],
        images: [
          {
            src: "/textures/funfact/thennow-now-top.webp",
            alt: {
              en: "Modern fibre optic submarine cables on the seabed",
              bm: "Kabel dasar laut fiber optik moden di dasar laut",
            },
          },
          {
            src: "/textures/funfact/thennow-now-bottom.webp",
            alt: {
              en: "Cutaway of a modern fibre optic submarine cable",
              bm: "Keratan rentas kabel dasar laut fiber optik moden",
            },
          },
        ],
        specs: [
          {
            label: { en: "Signal Type", bm: "Jenis Isyarat" },
            value: { en: "Light (Fibre Optics)", bm: "Cahaya (Fiber Optik)" },
          },
          {
            label: { en: "Use", bm: "Kegunaan" },
            value: {
              en: "Internet, Calls, Videos",
              bm: "Internet, Panggilan, Video",
            },
          },
          {
            label: { en: "Speed", bm: "Kelajuan" },
            value: { en: "Terabits Per Second", bm: "Terabit Sesaat" },
          },
          {
            label: { en: "Reliability", bm: "Kebolehpercayaan" },
            value: { en: "Highly Reliable", bm: "Sangat Boleh Dipercayai" },
          },
          {
            label: { en: "Coverage", bm: "Liputan" },
            value: { en: "Global Network", bm: "Rangkaian Global" },
          },
          {
            label: { en: "Lifespan", bm: "Jangka Hayat" },
            value: { en: "Around 25 Years", bm: "Sekitar 25 Tahun" },
          },
        ],
      },
    ],
  },
  {
    id: "videos",
    // BM doesn't inflect for plural — "Video" covers both.
    label: { en: "Videos", bm: "Video" },
    autoAdvance: false,
    screens: [
      {
        kind: "video",
        id: "subsea-cable-repair",
        // Video titles are ours — the sheet lists them in English only.
        title: {
          en: "Subsea Cable Repair",
          bm: "Pembaikan Kabel Dasar Laut",
        },
        poster: {
          src: "/textures/funfact/video-repair-poster.webp",
          alt: {
            en: "Cable repair ship under way",
            bm: "Kapal pembaikan kabel sedang bergerak",
          },
        },
        src: "/video/funfact-subsea-cable-repair.mp4",
        duration: "3:08",
      },
      {
        kind: "video",
        id: "seacom-first-link",
        title: {
          en: "SEACOM: Malaysia’s First Submarine Cable Link",
          bm: "SEACOM: Sambungan Kabel Dasar Laut Pertama Malaysia",
        },
        poster: {
          src: "/textures/funfact/video-seacom-poster.webp",
          alt: {
            en: "SEACOM inauguration ceremony",
            bm: "Majlis perasmian SEACOM",
          },
        },
        src: "/video/funfact-seacom-malaysia.mp4",
        duration: "1:05",
      },
    ],
  },
];

function isPair(v: unknown): v is L {
  return (
    typeof v === "object" &&
    v !== null &&
    !Array.isArray(v) &&
    typeof (v as L).en === "string" &&
    typeof (v as L).bm === "string"
  );
}

function resolve(node: unknown, lang: Language): unknown {
  if (isPair(node)) return lang === "bm" ? node.bm : node.en;
  if (Array.isArray(node)) return node.map((child) => resolve(child, lang));
  if (typeof node === "object" && node !== null) {
    return Object.fromEntries(
      Object.entries(node).map(([key, value]) => [key, resolve(value, lang)]),
    );
  }
  return node;
}

// Two languages, static content — resolve once each and hand back the same
// array every render so the panel's memo and keys stay stable.
const CACHE = new Map<Language, InfoTab[]>();

/** The tab tree with every string collapsed to `lang`. */
export function getInfoTabs(lang: Language): InfoTab[] {
  let tabs = CACHE.get(lang);
  if (!tabs) {
    tabs = resolve(INFO_TABS_SOURCE, lang) as InfoTab[];
    CACHE.set(lang, tabs);
  }
  return tabs;
}

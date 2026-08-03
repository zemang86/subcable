import type { Language } from "@/lib/types";

/**
 * One screen of the Fun Fact deck.
 *
 * The deck is STANDALONE — it is not scoped to the selected cable system, so
 * it opens from the cluster button at any time and always starts at slide 0.
 */
export type FunFactSlide = {
  id: string;
  /** Bilingual copy — the deck follows the global language toggle. */
  title: Record<Language, string>;
  body: Record<Language, string>;
  /**
   * Artwork under /public (e.g. "/textures/funfact/repeater.webp"). Slides
   * without one render the numbered placeholder frame instead. Keep assets
   * local — the kiosk runs offline.
   */
  image?: string;
};

/** How long one screen holds before the deck advances. */
export const FUN_FACT_INTERVAL_MS = 10_000;

// ─── PLACEHOLDER DECK ───
// Eight screens standing in for the client's copy + artwork (8–10 expected).
// The facts are generic and true so the 10s loop demos sensibly; swap
// title/body and add `image` per slide when the real content lands. Slide
// count is free — the indicator row and the loop both read from this array.
export const FUN_FACT_SLIDES: FunFactSlide[] = [
  {
    id: "backbone",
    title: {
      en: "The Internet Lives Underwater",
      bm: "Internet Hidup di Dasar Laut",
    },
    body: {
      en: "Around 99% of the world's intercontinental data traffic travels through submarine cables on the seabed — not through satellites.",
      bm: "Kira-kira 99% trafik data antarabenua dunia bergerak melalui kabel dasar laut — bukan melalui satelit.",
    },
  },
  {
    id: "thin",
    title: {
      en: "As Thin As A Garden Hose",
      bm: "Sekecil Hos Taman",
    },
    body: {
      en: "In deep water a submarine cable is about the thickness of a garden hose. Near shore it is armoured with steel wire to survive anchors and trawlers.",
      bm: "Di laut dalam, kabel dasar laut lebih kurang sebesar hos taman. Berhampiran pantai ia dilapisi dawai keluli bagi menahan sauh dan pukat tunda.",
    },
  },
  {
    id: "glass",
    title: {
      en: "Light, Not Electricity",
      bm: "Cahaya, Bukan Elektrik",
    },
    body: {
      en: "Data crosses the ocean as pulses of light in glass fibres thinner than a human hair, each pair carrying terabits every second.",
      bm: "Data merentasi lautan sebagai denyutan cahaya dalam gentian kaca yang lebih halus daripada rambut manusia, setiap pasangan membawa terabit sesaat.",
    },
  },
  {
    id: "repeaters",
    title: {
      en: "Boosted Every 80 Kilometres",
      bm: "Dikuatkan Setiap 80 Kilometer",
    },
    body: {
      en: "Repeaters spaced along the route amplify the signal so it survives thousands of kilometres of ocean. They are powered from shore.",
      bm: "Pengulang yang ditempatkan di sepanjang laluan menguatkan isyarat supaya ia bertahan ribuan kilometer merentasi lautan. Ia dikuasakan dari darat.",
    },
  },
  {
    id: "ships",
    title: {
      en: "Laid By Purpose-Built Ships",
      bm: "Dipasang Oleh Kapal Khas",
    },
    body: {
      en: "Cable ships lay the route at walking pace, ploughing the cable into the seabed where fishing and anchoring put it at risk.",
      bm: "Kapal kabel memasang laluan pada kelajuan orang berjalan, membenamkan kabel ke dasar laut di kawasan berisiko aktiviti perikanan dan pelabuhan sauh.",
    },
  },
  {
    id: "repairs",
    title: {
      en: "Repaired At Sea",
      bm: "Dibaiki Di Tengah Laut",
    },
    body: {
      en: "When a cable breaks, a repair ship grapples it off the seabed, lifts both ends to the deck, and splices in a fresh section.",
      bm: "Apabila kabel putus, kapal pembaikan mengait kabel dari dasar laut, mengangkat kedua-dua hujung ke geladak, dan menyambung semula bahagian baharu.",
    },
  },
  {
    id: "speed",
    title: {
      en: "Faster Than Satellite",
      bm: "Lebih Pantas Daripada Satelit",
    },
    body: {
      en: "A signal through a submarine cable reaches the other side of the world in well under a second — far quicker than the round trip to orbit and back.",
      bm: "Isyarat melalui kabel dasar laut sampai ke seberang dunia dalam masa kurang satu saat — jauh lebih pantas daripada perjalanan ke orbit dan kembali.",
    },
  },
  {
    id: "malaysia",
    title: {
      en: "Malaysia Sits On The Crossroads",
      bm: "Malaysia Berada Di Persimpangan",
    },
    body: {
      en: "The Straits of Malacca is one of the busiest cable corridors on Earth, linking Asia to Europe through Malaysian landing stations.",
      bm: "Selat Melaka merupakan salah satu koridor kabel tersibuk di dunia, menghubungkan Asia ke Eropah menerusi stesen pendaratan Malaysia.",
    },
  },
];

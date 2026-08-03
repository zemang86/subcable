/**
 * Did You Know? — the ten facts the right-hand panel cycles through when no
 * cable is selected, in the order supplied (temp/funfact/funfact-didyoknow-
 * content.csv). One fact per slide, ten seconds each, looping.
 *
 * Every string is an { en, bm } pair, read as `FACTS[i][language]`. The client
 * supplied these in English only — all Bahasa Malaysia below is ours, pending
 * their sign-off. Same for At a Glance, which isn't in their sheet at all.
 *
 * Length matters: the panel's card is a fixed height, and at 9px IBM Plex Mono
 * across 361px a fact wraps at roughly 66 characters a line. Three lines fit
 * above the countdown bar, so ~198 characters is the ceiling. Malay runs a
 * little longer than English — the longest below is the BM of fact 2 at 179.
 * Anything materially longer needs the card resizing, not just adding.
 */

export const FACT_SLIDE_MS = 10_000;

export const DID_YOU_KNOW_FACTS = [
  {
    en: "The first submarine communication cables were laid in the 1850s and carried telegraph messages across oceans.",
    bm: "Kabel komunikasi dasar laut yang pertama dipasang pada tahun 1850-an dan membawa mesej telegraf merentasi lautan.",
  },
  {
    en: "Before submarine cables, messages between continents could take days or weeks by ship. Cables reduced communication time to just minutes.",
    bm: "Sebelum adanya kabel dasar laut, mesej antara benua mengambil masa berhari-hari atau berminggu-minggu melalui kapal. Kabel memendekkan masa komunikasi kepada hanya beberapa minit.",
  },
  {
    en: "In September 1851, the Brett Brothers laid the first successful submarine cable connecting England and France across 25 nautical miles.",
    bm: "Pada September 1851, Brett Brothers memasang kabel dasar laut pertama yang berjaya, menghubungkan England dan Perancis sejauh 25 batu nautika.",
  },
  {
    en: "Although submarine cables can be as thick as a garden hose, the fibre optic strands inside are thinner than a human hair.",
    bm: "Walaupun kabel dasar laut boleh setebal hos taman, helaian fiber optik di dalamnya lebih halus daripada rambut manusia.",
  },
  {
    en: "In 1858, the first successful transatlantic cable connected the United Kingdom and the United States, bringing communication across the Atlantic Ocean.",
    bm: "Pada tahun 1858, kabel transatlantik pertama yang berjaya menghubungkan United Kingdom dan Amerika Syarikat, membawa komunikasi merentasi Lautan Atlantik.",
  },
  {
    en: "The first official message sent through the transatlantic cable was from Queen Victoria of Britain to the President of the United States.",
    bm: "Mesej rasmi pertama yang dihantar melalui kabel transatlantik adalah daripada Ratu Victoria dari Britain kepada Presiden Amerika Syarikat.",
  },
  {
    en: "Modern fibre optic cables transmit data using pulses of light, carrying information across oceans at near light speed.",
    bm: "Kabel fiber optik moden menghantar data menggunakan denyutan cahaya, membawa maklumat merentasi lautan hampir sepantas kelajuan cahaya.",
  },
  {
    en: "A single submarine cable can carry enough data to support millions of users simultaneously.",
    bm: "Satu kabel dasar laut sahaja mampu membawa data yang cukup untuk menampung berjuta-juta pengguna serentak.",
  },
  {
    en: "Your messages, video calls, streaming, and online activities often travel through submarine cables before reaching their destination.",
    bm: "Mesej, panggilan video, strim dan aktiviti dalam talian anda kerap melalui kabel dasar laut sebelum sampai ke destinasinya.",
  },
  {
    en: "Some modern submarine cables can also help scientists monitor earthquakes and study marine environments.",
    bm: "Sesetengah kabel dasar laut moden turut membantu saintis memantau gempa bumi dan mengkaji persekitaran laut.",
  },
] as const;

/**
 * At a Glance — the four stat cards under the fact deck. Every value carries
 * the same orange; the old hot/mid alternation is gone.
 *
 * Labels wrap at roughly 28 characters a line (10px mono across the card's
 * 168px text box) and the card holds two lines, so keep them under ~56
 * characters. The longest below is 53 in English, 50 in Malay.
 */
export const AT_A_GLANCE = [
  {
    value: { en: "25 Years", bm: "25 Tahun" },
    label: {
      en: "Expected lifespan of modern submarine cables.",
      bm: "Jangka hayat dijangka bagi kabel dasar laut moden.",
    },
  },
  {
    value: { en: "95-99%", bm: "95-99%" },
    label: {
      en: "Of global internet traffic transmitted.",
      bm: "Daripada trafik internet global yang dihantar.",
    },
  },
  {
    value: { en: "1840s", bm: "1840-an" },
    label: {
      en: "Gutta percha revolutionised underwater communication.",
      bm: "Gutta percha mengubah komunikasi bawah air.",
    },
  },
  {
    // "M" reads as million in both here; "1.5J" would be more puzzling than
    // helpful on a wall display.
    value: { en: "1.5M km+", bm: "1.5M km+" },
    label: {
      en: "Of cables span the world’s oceans.",
      bm: "Kabel merentangi lautan dunia.",
    },
  },
] as const;

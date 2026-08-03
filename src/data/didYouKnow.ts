/**
 * Did You Know? — the ten facts the right-hand panel cycles through when no
 * cable is selected, in the order supplied (temp/funfact/funfact-didyoknow-
 * content.csv). One fact per slide, ten seconds each, looping.
 *
 * English only for now; the Bahasa Malaysia pass comes with the General
 * Information copy, which is why these live here rather than in i18n.
 *
 * Length matters: the panel's card is a fixed height, and at 9px IBM Plex Mono
 * across 361px a fact wraps at roughly 66 characters a line. Three lines fit
 * above the countdown bar — the longest below is 151 characters, or 3 lines.
 * Anything materially longer needs the card resizing, not just adding.
 */

export const FACT_SLIDE_MS = 10_000;

export const DID_YOU_KNOW_FACTS = [
  "The first submarine communication cables were laid in the 1850s and carried telegraph messages across oceans.",
  "Before submarine cables, messages between continents could take days or weeks by ship. Cables reduced communication time to just minutes.",
  "In September 1851, the Brett Brothers laid the first successful submarine cable connecting England and France across 25 nautical miles.",
  "Although submarine cables can be as thick as a garden hose, the fibre optic strands inside are thinner than a human hair.",
  "In 1858, the first successful transatlantic cable connected the United Kingdom and the United States, bringing communication across the Atlantic Ocean.",
  "The first official message sent through the transatlantic cable was from Queen Victoria of Britain to the President of the United States.",
  "Modern fibre optic cables transmit data using pulses of light, carrying information across oceans at near light speed.",
  "A single submarine cable can carry enough data to support millions of users simultaneously.",
  "Your messages, video calls, streaming, and online activities often travel through submarine cables before reaching their destination.",
  "Some modern submarine cables can also help scientists monitor earthquakes and study marine environments.",
] as const;

import { CableSystem } from "@/lib/types";

export const cables: CableSystem[] = [
  {
    id: "bdm",
    name: "Batam Dumai Melaka",
    shortName: "BDM",
    length: "~353 km",
    rfs: "November 2009",
    owners: ["Telekom Malaysia", "Moratelindo", "XL Axiata"],
    landingPointIds: ["melaka", "batam", "dumai"],
    color: "#00BCD4",
    description:
      "Submarine cable system connecting Melaka (Malaysia) to Batam and Dumai (Indonesia) across the Strait of Malacca. Two separate routes branch from Melaka — one southeast to Batam and one southwest to Dumai.",
  },
  {
    id: "mct",
    name: "Malaysia-Cambodia-Thailand",
    shortName: "MCT",
    length: "1,300 km",
    rfs: "March 2017",
    owners: ["Telekom Malaysia", "Symphony Communication", "Telcotech"],
    landingPointIds: ["cherating", "rayong", "sihanoukville"],
    color: "#FF6B35",
    description:
      "International submarine cable linking Malaysia, Thailand, and Cambodia. Runs from Cherating (Malaysia) northwest through the South China Sea to Rayong (Thailand), with a branching unit connecting to Sihanoukville (Cambodia).",
  },
  {
    id: "skr1m",
    name: "Sistem Kabel Rakyat 1Malaysia",
    shortName: "SKR1M",
    length: "~3,700 km",
    rfs: "September 2017",
    owners: ["Telekom Malaysia", "TIME dotCom"],
    landingPointIds: [
      "cherating",
      "kuantan",
      "mersing",
      "kuching",
      "bintulu",
      "miri",
      "kota-kinabalu",
    ],
    color: "#2362DD",
    description:
      "First major submarine cable directly connecting Peninsular Malaysia with East Malaysia (Sabah & Sarawak). Loops from the east coast of Peninsular Malaysia across the South China Sea to Borneo, linking 7 landing stations along the way.",
  },
];

import { CableRoute } from "@/lib/types";

export const cableRoutes: CableRoute[] = [
  // BDM - Batam Dumai Melaka
  {
    cableId: "bdm",
    segments: [
      {
        fromPoint: "Melaka",
        toPoint: "Batam",
        coords: [
          [2.196, 102.2405], // Melaka
          [2.05, 102.5],
          [1.85, 103.0],
          [1.6, 103.4],
          [1.35, 103.7],
          [1.1494, 104.0249], // Batam
        ],
      },
      {
        fromPoint: "Melaka",
        toPoint: "Dumai",
        coords: [
          [2.196, 102.2405], // Melaka
          [2.1, 102.0],
          [1.95, 101.75],
          [1.6944, 101.445], // Dumai
        ],
      },
    ],
  },

  // MCT - Malaysia-Cambodia-Thailand
  {
    cableId: "mct",
    segments: [
      {
        fromPoint: "Cherating",
        toPoint: "Rayong",
        coords: [
          [4.1259, 103.3939], // Cherating
          [4.8, 103.5],
          [5.5, 103.4],
          [6.5, 103.0],
          [7.5, 102.5],
          [8.5, 102.0],
          [9.5, 101.8],
          [10.5, 101.5],
          [11.5, 101.3],
          [12.67, 101.27], // Rayong
        ],
      },
      {
        fromPoint: "Cherating",
        toPoint: "Sihanoukville",
        coords: [
          [4.1259, 103.3939], // Cherating
          [4.8, 103.5],
          [5.5, 103.4],
          [6.5, 103.0],
          [7.5, 102.5],
          [8.5, 102.5], // Branch point area
          [9.5, 103.0],
          [10.0, 103.3],
          [10.5922, 103.5413], // Sihanoukville
        ],
      },
    ],
  },

  // SKR1M - Sistem Kabel Rakyat 1Malaysia
  {
    cableId: "skr1m",
    segments: [
      {
        fromPoint: "Cherating",
        toPoint: "Kuantan",
        coords: [
          [4.1259, 103.3939], // Cherating
          [3.95, 103.3],
          [3.7634, 103.2202], // Kuantan
        ],
      },
      {
        fromPoint: "Kuantan",
        toPoint: "Mersing",
        coords: [
          [3.7634, 103.2202], // Kuantan
          [3.3, 103.4],
          [2.9, 103.6],
          [2.4309, 103.8361], // Mersing
        ],
      },
      {
        fromPoint: "Mersing",
        toPoint: "Kuching",
        coords: [
          [2.4309, 103.8361], // Mersing
          [2.3, 104.5],
          [2.1, 105.5],
          [1.9, 106.5],
          [1.8, 107.5],
          [1.7, 108.5],
          [1.6, 109.5],
          [1.5531, 110.345], // Kuching
        ],
      },
      {
        fromPoint: "Kuching",
        toPoint: "Bintulu",
        coords: [
          [1.5531, 110.345], // Kuching
          [1.8, 110.8],
          [2.1, 111.3],
          [2.5, 111.9],
          [2.8, 112.4],
          [3.1943, 113.0953], // Bintulu
        ],
      },
      {
        fromPoint: "Bintulu",
        toPoint: "Miri",
        coords: [
          [3.1943, 113.0953], // Bintulu
          [3.5, 113.3],
          [3.9, 113.6],
          [4.3995, 113.9914], // Miri
        ],
      },
      {
        fromPoint: "Miri",
        toPoint: "Kota Kinabalu",
        coords: [
          [4.3995, 113.9914], // Miri
          [4.6, 114.3],
          [4.9, 114.8],
          [5.2, 115.2],
          [5.5, 115.6],
          [5.9804, 116.0735], // Kota Kinabalu
        ],
      },
      {
        fromPoint: "Kota Kinabalu",
        toPoint: "Cherating",
        coords: [
          [5.9804, 116.0735], // Kota Kinabalu
          [5.8, 115.0],
          [5.5, 113.5],
          [5.2, 112.0],
          [5.0, 110.5],
          [4.8, 109.0],
          [4.6, 107.5],
          [4.5, 106.0],
          [4.3, 104.5],
          [4.1259, 103.3939], // Cherating
        ],
      },
    ],
  },
];

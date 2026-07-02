import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  transpilePackages: ["react-globe.gl", "three-globe"],
  // Keep .map files out of the exported kiosk/Electron bundle.
  productionBrowserSourceMaps: false,
};

export default nextConfig;

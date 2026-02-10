import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  output: "export",
  transpilePackages: ["react-globe.gl", "three-globe"],
};

export default nextConfig;

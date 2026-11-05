import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // pdf.js (inside unpdf) must stay a plain Node module rather than being bundled.
  serverExternalPackages: ["unpdf"],
  poweredByHeader: false,
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: [
    "@remotion/bundler",
    "@remotion/renderer",
    "@remotion/media",
    "remotion",
    "music-metadata",
  ],
};

export default nextConfig;

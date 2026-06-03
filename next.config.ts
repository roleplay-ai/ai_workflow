import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },

  // Keep native packages (.node binaries) out of the bundle —
  // Node.js loads them directly at runtime instead.
  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist"],

  // Empty turbopack config silences the "webpack config ignored" warning
  turbopack: {},
};

export default nextConfig;

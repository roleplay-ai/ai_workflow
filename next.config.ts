import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "50mb",
    },
  },

  async redirects() {
    return [
      { source: "/dashboard", destination: "/apply", permanent: true },
      { source: "/dashboard/:path*", destination: "/apply/:path*", permanent: true },
      { source: "/ai-mastery", destination: "/learn", permanent: true },
      { source: "/ai-mastery/:path*", destination: "/learn/:path*", permanent: true },
      { source: "/ai-fluency", destination: "/know", permanent: true },
      { source: "/ai-fluency/:path*", destination: "/know/:path*", permanent: true },
    ];
  },

  async rewrites() {
    return [
      { source: "/know", destination: "/ai-fluency" },
      { source: "/know/:path*", destination: "/ai-fluency/:path*" },
    ];
  },

  // Keep native packages (.node binaries) out of the bundle —
  // Node.js loads them directly at runtime instead.
  serverExternalPackages: ["@napi-rs/canvas", "pdfjs-dist"],

  // Empty turbopack config silences the "webpack config ignored" warning
  turbopack: {},
};

export default nextConfig;

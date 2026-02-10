import type { NextConfig } from "next";
import withBundleAnalyzer from "@next/bundle-analyzer";

const analyze = withBundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const nextConfig: NextConfig = {
  eslint: {
    ignoreDuringBuilds: true,
  },
  async rewrites() {
    return [
      {
        source: "/api/:path*",
        destination: process.env.NODE_ENV === 'development' 
          ? "http://localhost:3002/api/:path*" // Local development (Docker mapped port)
          : "http://backend:3000/api/:path*", // Docker internal
      },
    ];
  },
};

export default analyze(nextConfig);

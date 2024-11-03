import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "probo.in"
      },
      {
        protocol: "https",
        hostname: "probo.gumlet.io"
      }
    ]
  }
};

export default nextConfig;

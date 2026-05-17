import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  async rewrites() {
    const target = process.env.API_SERVER_URL || "http://localhost:9001";

    return [
      {
        source: "/api-bridge/:path*",
        destination: `${target}/:path*`,
      },
    ];
  },
};

export default nextConfig;

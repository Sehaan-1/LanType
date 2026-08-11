import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  experimental: {
    serverActions: {
      bodySizeLimit: "4gb",
    },
    proxyClientMaxBodySize: "4gb",
  },
};

export default nextConfig;

import path from "node:path"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  turbopack: {
    root: path.resolve(__dirname),
  },
  experimental: {
    proxyClientMaxBodySize: "16mb",
    serverActions: {
      bodySizeLimit: "16mb",
    },
  },
}

export default nextConfig

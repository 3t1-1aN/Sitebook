import path from "node:path"
import type { NextConfig } from "next"

const nextConfig: NextConfig = {
  // fs reads are invisible to the file tracer, so the seed images and catalog
  // have to be named here or the serverless routes ship without them.
  outputFileTracingIncludes: {
    "/api/images/**": ["./data/images/**/*", "./data/catalog.json"],
    "/api/catalog": ["./data/images/**/*", "./data/catalog.json"],
    "/api/entries/**": ["./data/images/**/*", "./data/catalog.json"],
    "/api/ingest": ["./data/images/**/*", "./data/catalog.json"],
  },
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

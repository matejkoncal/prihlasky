import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/submit": [
      "./public/logos/*",
      "./node_modules/@formepdf/core/pkg/*.wasm",
    ],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;

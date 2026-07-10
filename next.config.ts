import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  outputFileTracingIncludes: {
    "/api/submit": ["./public/logos/*"],
  },
  turbopack: {
    root: process.cwd(),
  },
};

export default nextConfig;

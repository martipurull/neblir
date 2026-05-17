import { withSerwist } from "@serwist/turbopack";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Turbopack emits ESM @swc/helpers imports; NFT tracing only copies CJS unless we include both.
  outputFileTracingIncludes: {
    "/*": [
      "./node_modules/@swc/helpers/**/*",
      "./node_modules/next/node_modules/@swc/helpers/**/*",
    ],
  },
  serverExternalPackages: ["@swc/helpers"],
  images: {
    remotePatterns: [
      {
        protocol: "https",
        hostname: "*.r2.cloudflarestorage.com",
      },
    ],
  },
};

export default withSerwist(nextConfig);

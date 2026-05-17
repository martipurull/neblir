import { withSerwist } from "@serwist/turbopack";

/** @type {import('next').NextConfig} */
const nextConfig = {
  // Proxy/middleware NFT traces CJS helpers by default; runtime may require ESM paths too.
  outputFileTracingIncludes: {
    "/middleware": [
      "./node_modules/@swc/helpers/esm/**/*",
      "./node_modules/@swc/helpers/cjs/**/*",
      "./node_modules/@swc/helpers/package.json",
    ],
  },
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

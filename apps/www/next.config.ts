import type { NextConfig } from "next";
const path = require('path')


const nextConfig: NextConfig = {
  output: 'standalone',
  /* config options here */
  transpilePackages: ["@workspace/ui"],
  eslint: {
    // Todo: remove this when the eslint issues are fixed
    ignoreDuringBuilds: true,
  },
  typescript: {
    //todo: remove this when the typescript issues are fixed
    ignoreBuildErrors: true,
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'sxjunqrsjgomtnjxssni.supabase.co',
        pathname: '/storage/v1/object/**',
      },
    ],
  },
};

export default nextConfig;

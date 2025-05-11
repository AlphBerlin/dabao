import type { NextConfig } from "next";
const path = require('path')


const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["@workspace/ui"],
  images: {
    remotePatterns: [new URL("https://sxjunqrsjgomtnjxssni.supabase.co/storage/v1/object/public/**")],
  },
};

export default nextConfig;

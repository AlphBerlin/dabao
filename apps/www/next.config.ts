import type { NextConfig } from "next";
const path = require('path')


const nextConfig: NextConfig = {
  /* config options here */
  transpilePackages: ["@workspace/ui"],
};

export default nextConfig;

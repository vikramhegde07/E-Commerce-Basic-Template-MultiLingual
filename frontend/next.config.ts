import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  /* config options here */
  output: 'export',
  reactStrictMode: true,
  images: { unoptimized: true }, // for export if not using next/image optimizer
  trailingSlash: true, // optional; useful for static hosts
};

export default nextConfig;

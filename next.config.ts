import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow accessing the dev server from mobile devices on the local network
  allowedDevOrigins: ['192.168.59.198'],
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Allow loading dev resources (JS chunks, HMR) from the LAN IP so phones on
  // the same WiFi can run the app in dev. Not needed in production.
  allowedDevOrigins: ["192.168.100.237"],
};

export default nextConfig;

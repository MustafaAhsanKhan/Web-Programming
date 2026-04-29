import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["192.168.*.*"],
  serverExternalPackages: ["pdfkit"],
  // output: "standalone", // Recommended for Docker deployments
};

export default nextConfig;

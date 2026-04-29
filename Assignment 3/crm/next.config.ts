import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  allowedDevOrigins: ["172.16.63.73", "172.16.63.*"],
  serverExternalPackages: ["pdfkit"],
  // output: "standalone", // Recommended for Docker deployments
};

export default nextConfig;

import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin"],
  serverActions: {
    bodySizeLimit: "10mb",
  },
};

export default nextConfig;

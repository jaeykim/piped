import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  serverExternalPackages: ["firebase-admin"],
  experimental: {
    serverActionsBodySizeLimit: "10mb",
  },
};

export default nextConfig;

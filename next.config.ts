import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // standalone build copies a minimal node_modules tree into .next/standalone,
  // so we can run the server with `node .next/standalone/server.js` under
  // systemd without dragging the full repo to prod.
  output: "standalone",
  serverExternalPackages: ["firebase-admin", "@prisma/client", "@prisma/adapter-pg"],
  allowedDevOrigins: ["13.125.203.138"],
};

export default nextConfig;

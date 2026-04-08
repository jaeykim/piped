import { PrismaClient } from "@prisma/client";
import { PrismaPg } from "@prisma/adapter-pg";

// Prisma 7 requires a driver adapter — the schema no longer carries the
// connection URL, so we wire it in at PrismaClient construction time.
const url = process.env.DATABASE_URL;
if (!url) {
  throw new Error("DATABASE_URL is required to construct PrismaClient");
}

const adapter = new PrismaPg({ connectionString: url });

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const prisma =
  globalForPrisma.prisma ??
  new PrismaClient({
    adapter,
    log: process.env.NODE_ENV === "development" ? ["warn", "error"] : ["error"],
  });

if (process.env.NODE_ENV !== "production") {
  globalForPrisma.prisma = prisma;
}

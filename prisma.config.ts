// Prisma 7 does not load .env on its own.
import "dotenv/config";
import { defineConfig } from "prisma/config";

export default defineConfig({
  schema: "prisma/schema.prisma",
  migrations: {
    path: "prisma/migrations",
    seed: "tsx prisma/seed.ts",
  },
  datasource: {
    // The CLI (migrate, seed, studio) prefers a direct connection: Neon's pooled URL goes
    // through PgBouncer, which does not support the session features migrations rely on.
    // The app itself always uses DATABASE_URL (pooled) via the driver adapter in src/server/db.ts.
    // process.env (not env()) so `prisma generate` works with no database URL at all;
    // `||` (not `??`) so an empty DATABASE_URL_UNPOOLED="" in .env falls through.
    url: process.env["DATABASE_URL_UNPOOLED"] || process.env["DATABASE_URL"],
  },
});

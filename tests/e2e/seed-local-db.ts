import "dotenv/config";

import { execFileSync } from "node:child_process";

// The seed truncates every table. The e2e run reseeds before and after itself, so it must
// never point at a shared database: only a local host is accepted.

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function seedLocalDatabase(): void {
  // The same URL the Prisma CLI (and so the seed) uses: see prisma.config.ts.
  const url = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!url) {
    throw new Error("DATABASE_URL is not set. Start the local database (npm run db:up) and copy .env.example to .env.");
  }

  const host = new URL(url).hostname;
  if (!LOCAL_HOSTS.has(host)) {
    throw new Error(`Refusing to seed "${host}": the e2e tests wipe the database, so they only run against a local one.`);
  }

  execFileSync("npm", ["run", "db:seed"], { stdio: ["ignore", "ignore", "inherit"] });
}

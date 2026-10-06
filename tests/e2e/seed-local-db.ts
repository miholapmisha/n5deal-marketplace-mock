import "dotenv/config";

import { execFileSync } from "node:child_process";

const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "[::1]"]);

export function seedLocalDatabase(): void {
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

import { seedLocalDatabase } from "./seed-local-db";

/** Puts the demo data back, so the local app is not left with a suspended demo seller. */
export default function globalTeardown(): void {
  seedLocalDatabase();
}

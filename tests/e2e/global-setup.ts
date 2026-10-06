import { seedLocalDatabase } from "./seed-local-db";

/** Every run starts from the deterministic demo data (SPEC §8). */
export default function globalSetup(): void {
  seedLocalDatabase();
}

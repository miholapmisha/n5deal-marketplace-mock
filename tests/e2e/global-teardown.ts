import { seedLocalDatabase } from "./seed-local-db";

export default function globalTeardown(): void {
  seedLocalDatabase();
}

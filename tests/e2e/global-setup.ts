import { seedLocalDatabase } from "./seed-local-db";

export default function globalSetup(): void {
  seedLocalDatabase();
}

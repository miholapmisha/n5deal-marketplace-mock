// Deterministic, idempotent seed (SPEC §8): fixed IDs, fixed timestamps, and a full reset,
// so every run ends in exactly the same state. Run with `npm run db:seed`.
// WARNING: this deletes ALL marketplace data in the target database before inserting.
import "dotenv/config";

import { PrismaPg } from "@prisma/adapter-pg";
import bcrypt from "bcryptjs";

import { PrismaClient } from "../src/generated/prisma/client";
import { DEMO_ACCOUNTS, DEMO_PASSWORD } from "../src/lib/demo-accounts";
import { assets } from "./seed-data/assets";
import { moderationLogs, threads } from "./seed-data/conversations";
import { buyerProfiles, buyers, managers, sellers } from "./seed-data/users";

const BCRYPT_COST = 10;

function assertSeedData(): void {
  const tooShort = assets.filter((a) => a.description.length < 100 || a.description.length > 5000);
  if (tooShort.length > 0) {
    throw new Error(`Asset descriptions must be 100–5000 chars: ${tooShort.map((a) => a.slug).join(", ")}`);
  }
  const badThesis = buyerProfiles.filter((p) => p.thesis.length < 50 || p.thesis.length > 2000);
  if (badThesis.length > 0) {
    throw new Error(`Buyer theses must be 50–2000 chars: ${badThesis.map((p) => p.userId).join(", ")}`);
  }
}

function databaseHost(url: string): string {
  try {
    return new URL(url).host;
  } catch {
    return "(unparseable DATABASE_URL)";
  }
}

async function main(): Promise<void> {
  // Same preference as prisma.config.ts: a direct connection for bulk admin work.
  const connectionString = process.env.DATABASE_URL_UNPOOLED || process.env.DATABASE_URL;
  if (!connectionString) {
    throw new Error("DATABASE_URL is not set. Copy .env.example to .env and fill it in.");
  }
  assertSeedData();

  const db = new PrismaClient({ adapter: new PrismaPg({ connectionString }) });
  console.info(`Seeding ${databaseHost(connectionString)} …`);

  const passwordHash = await bcrypt.hash(DEMO_PASSWORD, BCRYPT_COST);
  const users = [...managers, ...sellers, ...buyers].map((u) => ({ ...u, passwordHash }));

  try {
    await db.$transaction([
      // Static SQL, no user input. CASCADE clears every table that references these.
      db.$executeRaw`TRUNCATE TABLE "Message", "Conversation", "ModerationLog", "Session", "BuyerProfile", "Asset", "User", "AiSearchUsage" CASCADE`,
      db.user.createMany({ data: users }),
      db.buyerProfile.createMany({ data: buyerProfiles }),
      db.asset.createMany({ data: assets }),
      db.conversation.createMany({ data: threads.map((t) => t.conversation) }),
      db.message.createMany({ data: threads.flatMap((t) => t.messages) }),
      db.moderationLog.createMany({ data: moderationLogs }),
    ]);

    const published = await db.asset.count({
      where: { status: "PUBLISHED", seller: { status: "ACTIVE" } },
    });
    console.info(
      [
        `✔ ${users.length} users (${managers.length} managers, ${sellers.length} sellers, ${buyers.length} buyers)`,
        `✔ ${assets.length} assets (${published} publicly visible)`,
        `✔ ${threads.length} conversations, ${moderationLogs.length} moderation log entries`,
        `Demo logins (password "${DEMO_PASSWORD}"): ${Object.values(DEMO_ACCOUNTS).join(", ")}`,
      ].join("\n"),
    );
  } finally {
    await db.$disconnect();
  }
}

main().catch((error: unknown) => {
  console.error(error);
  process.exit(1);
});

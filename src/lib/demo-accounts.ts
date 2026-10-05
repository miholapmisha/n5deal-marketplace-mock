// Demo credentials are intentionally public: the login page prints them (SPEC §5 S1).
// Shared by prisma/seed.ts and the login page so they can never drift apart.

export const DEMO_PASSWORD = "n5deal-demo";

export const DEMO_ACCOUNTS = {
  buyer: "buyer@demo.n5deal",
  seller: "seller@demo.n5deal",
  manager: "manager@demo.n5deal",
} as const;

export type DemoRole = keyof typeof DEMO_ACCOUNTS;

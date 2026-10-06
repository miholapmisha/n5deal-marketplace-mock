export const DEMO_PASSWORD = "n5deal-demo";

export const DEMO_ACCOUNTS = {
  buyer: "buyer@demo.n5deal",
  seller: "seller@demo.n5deal",
  manager: "manager@demo.n5deal",
} as const;

export type DemoRole = keyof typeof DEMO_ACCOUNTS;

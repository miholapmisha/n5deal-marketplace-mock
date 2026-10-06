import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/placeholder-page";
import { requireRole } from "@/server/auth/guards";

export const metadata: Metadata = {
  title: "Buyers",
};

export default async function Page() {
  const user = await requireRole("SELLER", "MANAGER");
  return <PlaceholderPage title="Buyers" milestone="M6" user={user} />;
}

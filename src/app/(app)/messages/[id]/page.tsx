import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/placeholder-page";
import { requireRole } from "@/server/auth/guards";

export const metadata: Metadata = {
  title: "Conversation",
};

export default async function Page() {
  const user = await requireRole("BUYER", "SELLER");
  return <PlaceholderPage title="Conversation" milestone="M5" user={user} />;
}

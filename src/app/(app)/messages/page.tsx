import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/placeholder-page";
import { requireRole } from "@/server/auth/guards";

export const metadata: Metadata = {
  title: "Messages",
};

export default async function Page() {
  const user = await requireRole("BUYER", "SELLER");
  return <PlaceholderPage title="Messages" milestone="M5" user={user} />;
}

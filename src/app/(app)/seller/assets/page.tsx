import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/placeholder-page";
import { requireRole } from "@/server/auth/guards";

export const metadata: Metadata = {
  title: "My assets",
};

export default async function Page() {
  const user = await requireRole("SELLER");
  return <PlaceholderPage title="My assets" milestone="M4" user={user} />;
}

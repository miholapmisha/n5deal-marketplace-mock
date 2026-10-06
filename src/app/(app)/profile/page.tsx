import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/placeholder-page";
import { requireRole } from "@/server/auth/guards";

export const metadata: Metadata = {
  title: "My profile",
};

export default async function Page() {
  const user = await requireRole("BUYER");
  return <PlaceholderPage title="My profile" milestone="M4" user={user} />;
}

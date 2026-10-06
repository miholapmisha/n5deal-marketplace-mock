import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/placeholder-page";
import { requireRole } from "@/server/auth/guards";

export const metadata: Metadata = {
  title: "Overview",
};

export default async function Page() {
  const user = await requireRole("MANAGER");
  return <PlaceholderPage title="Overview" milestone="M7" user={user} />;
}

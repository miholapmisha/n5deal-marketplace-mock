import type { Metadata } from "next";

import { PlaceholderPage } from "@/components/placeholder-page";
import { requireRole } from "@/server/auth/guards";

export const metadata: Metadata = {
  title: "Publish an asset",
};

export default async function Page() {
  const user = await requireRole("SELLER");
  return <PlaceholderPage title="Publish an asset" milestone="M4" user={user} />;
}

import { redirect } from "next/navigation";

import { ROLE_HOME } from "@/lib/auth-paths";
import { getCurrentUser } from "@/server/auth/session";

/** "/" is each role's home: the public catalog for visitors and buyers. */
export default async function Home() {
  const user = await getCurrentUser();
  redirect(user ? ROLE_HOME[user.role] : "/assets");
}

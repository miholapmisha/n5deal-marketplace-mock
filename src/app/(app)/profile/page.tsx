import type { Metadata } from "next";

import { ProfileForm } from "@/components/buyer/profile-form";
import { profileToFormValues } from "@/lib/buyer-profile-form";
import { COUNTRY_OPTIONS } from "@/lib/countries";
import { requireRole } from "@/server/auth/guards";
import { getOwnBuyerProfile } from "@/server/buyers/buyer.service";

export const metadata: Metadata = {
  title: "My profile",
};

export default async function ProfilePage() {
  const user = await requireRole("BUYER");
  const own = await getOwnBuyerProfile();
  const onboarding = own?.profile === null;

  return (
    <div className="flex flex-col gap-6">
      <header className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          {onboarding ? `Welcome, ${user.name}` : "My profile"}
        </h1>
        <p className="max-w-2xl text-muted-foreground">
          {onboarding
            ? "Tell sellers what you want to acquire. We use it to rank assets for you, and sellers use it to find you."
            : "Your acquisition mandate. Sellers see it in the buyer directory while it is visible."}
        </p>
      </header>
      <ProfileForm
        initialValues={profileToFormValues(own?.companyName ?? user.companyName, own?.profile ?? null)}
        onboarding={onboarding}
        countries={COUNTRY_OPTIONS}
      />
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DemoLoginCards } from "@/components/auth/demo-login-cards";
import { RegisterForm } from "@/components/auth/register-form";
import { ROLE_HOME } from "@/lib/auth-paths";
import { getCurrentUser } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Create an account",
};

export default async function RegisterPage() {
  const user = await getCurrentUser();
  if (user) redirect(ROLE_HOME[user.role]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Create your N5Deal account</h1>
        <p className="text-muted-foreground">
          Buyers find licensed businesses that fit their mandate; sellers reach qualified buyers.
        </p>
      </header>

      <DemoLoginCards next={null} />

      <section aria-labelledby="register-heading" className="mx-auto w-full max-w-xl">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
          <h2 id="register-heading" className="mb-5 text-lg font-semibold">
            Register with email
          </h2>
          <RegisterForm />
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          Already have an account?{" "}
          <Link href="/login" className="font-medium text-primary hover:underline">
            Log in
          </Link>
        </p>
      </section>
    </div>
  );
}

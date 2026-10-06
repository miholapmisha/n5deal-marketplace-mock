import type { Metadata } from "next";
import Link from "next/link";
import { redirect } from "next/navigation";

import { DemoLoginCards } from "@/components/auth/demo-login-cards";
import { LoginForm } from "@/components/auth/login-form";
import { ROLE_HOME, safeNextPath } from "@/lib/auth-paths";
import { getCurrentUser } from "@/server/auth/session";

export const metadata: Metadata = {
  title: "Log in",
};

export default async function LoginPage({ searchParams }: PageProps<"/login">) {
  const { next: rawNext } = await searchParams;
  const next = safeNextPath(rawNext);

  const user = await getCurrentUser();
  if (user) redirect(next ?? ROLE_HOME[user.role]);

  return (
    <div className="flex flex-col gap-8">
      <header className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">Log in to N5Deal</h1>
        <p className="text-muted-foreground">
          Pick a demo account for a one-click tour, or log in with your own email.
        </p>
      </header>

      <DemoLoginCards next={next} />

      <section aria-labelledby="email-login-heading" className="mx-auto w-full max-w-md">
        <div className="rounded-2xl border border-border bg-card p-6 shadow-card sm:p-8">
          <h2 id="email-login-heading" className="mb-5 text-lg font-semibold">
            Log in with email
          </h2>
          <LoginForm next={next} />
        </div>
        <p className="mt-4 text-center text-sm text-muted-foreground">
          New to N5Deal?{" "}
          <Link href="/register" className="font-medium text-primary hover:underline">
            Create an account
          </Link>
        </p>
      </section>
    </div>
  );
}

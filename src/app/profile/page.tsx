import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { UserAvatar } from "@/components/auth/user-avatar";

export default async function ProfilePage() {
  const session = await auth();

  if (!session?.user?.email) {
    redirect("/sign-in");
  }

  return (
    <main className="min-h-screen bg-background px-4 py-10 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto max-w-3xl space-y-8 rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur sm:p-8">
        <header className="flex flex-col gap-5 sm:flex-row sm:items-center">
          <UserAvatar
            image={session.user.image}
            name={session.user.name}
            className="size-18 ring-1 ring-white/10"
            textClassName="text-base"
          />

          <div className="space-y-2">
            <p className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
              Profile
            </p>
            <h1 className="text-3xl font-semibold tracking-tight text-zinc-50">
              {session.user.name || "DevStash User"}
            </h1>
            <p className="text-sm text-muted-foreground">{session.user.email}</p>
          </div>
        </header>

        <section className="grid gap-4 sm:grid-cols-2">
          <div className="rounded-2xl border border-border/70 bg-background/60 p-5">
            <p className="text-sm font-medium text-zinc-200">Account type</p>
            <p className="mt-2 text-sm leading-6 text-muted-foreground">
              Signed in with GitHub or email credentials through Auth.js.
            </p>
          </div>
          <div className="rounded-2xl border border-border/70 bg-background/60 p-5">
            <p className="text-sm font-medium text-zinc-200">User ID</p>
            <p className="mt-2 break-all font-mono text-xs text-muted-foreground">
              {session.user.id}
            </p>
          </div>
        </section>
      </div>
    </main>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronLeft } from "lucide-react";

import { auth } from "@/auth";
import { UpgradePageContent } from "@/components/upgrade/upgrade-page-content";
import { buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function UpgradePage() {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    redirect("/sign-in");
  }

  if (session.user.isPro) {
    redirect("/settings");
  }

  return (
    <main className="relative min-h-screen overflow-x-hidden bg-[linear-gradient(180deg,rgba(16,20,38,0.42),rgba(5,6,15,0.78))] px-4 py-4 text-foreground sm:px-6 lg:px-10">
      <div className="pointer-events-none absolute inset-x-0 top-0 mx-auto w-full max-w-7xl px-3 py-3 sm:px-6 lg:px-8">
        <Link
          href="/dashboard"
          className={cn(
            buttonVariants({ variant: "ghost" }),
            "pointer-events-auto w-fit rounded-xl px-2.5 text-sm text-muted-foreground hover:bg-white/[0.05] hover:text-zinc-50 lg:-translate-x-12 xl:-translate-x-20",
          )}
        >
          <ChevronLeft className="size-4" />
          Back to dashboard
        </Link>
      </div>

      <div className="mx-auto flex w-full max-w-5xl flex-col">
        <UpgradePageContent />
      </div>
    </main>
  );
}

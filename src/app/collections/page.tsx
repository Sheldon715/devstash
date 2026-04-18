import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { CollectionCard } from "@/components/dashboard/collection-card";
import { getAllDashboardCollections } from "@/lib/db/collections";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const collections = await getAllDashboardCollections();

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="transition-colors hover:text-foreground">
            Dashboard
          </Link>
          <ChevronRight className="size-4" />
          <span className="text-foreground">Collections</span>
        </nav>

        <header className="rounded-[28px] border border-border/70 bg-[#0b0b0d] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
            Workspace View
          </p>
          <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-50">
            Collections
          </h1>
          <p className="mt-3 max-w-2xl text-base text-muted-foreground">
            {collections.length} knowledge groups organized from your live dashboard data.
          </p>
        </header>

        <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {collections.map((collection) => (
            <CollectionCard key={collection.id} collection={collection} />
          ))}
        </section>
      </div>
    </main>
  );
}

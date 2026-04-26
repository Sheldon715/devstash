import { redirect } from "next/navigation";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

import { auth } from "@/auth";
import { CollectionCard } from "@/components/dashboard/collection-card";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAllDashboardCollections } from "@/lib/db/collections";
import { getUserEditorPreferences } from "@/lib/db/editor-preferences";
import { getDashboardSidebarItemTypes } from "@/lib/db/items";
import {
  getDashboardSearchItems,
  mapCollectionsToDashboardSearchRecords,
} from "@/lib/db/search";

export const dynamic = "force-dynamic";

export default async function CollectionsPage() {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    redirect("/sign-in");
  }

  const [collections, sidebarItemTypes, searchItems, editorPreferences] = await Promise.all([
    getAllDashboardCollections(session.user.id),
    getDashboardSidebarItemTypes(session.user.id),
    getDashboardSearchItems(session.user.id),
    getUserEditorPreferences(session.user.id),
  ]);
  const favoriteCollections = collections.filter((collection) => collection.isFavorite).slice(0, 4);
  const recentCollections = collections.slice(0, 4);
  const collectionOptions = collections.map((collection) => ({
    id: collection.id,
    name: collection.name,
  }));
  const searchData = {
    items: searchItems,
    collections: mapCollectionsToDashboardSearchRecords(collections),
  };

  return (
    <DashboardShell
      collectionOptions={collectionOptions}
      currentUser={{
        email: session.user.email,
        image: session.user.image,
        name: session.user.name,
      }}
      editorPreferences={editorPreferences}
      favoriteCollections={favoriteCollections}
      recentCollections={recentCollections}
      searchData={searchData}
      sidebarItemTypes={sidebarItemTypes}
    >
      <div className="mx-auto flex w-full flex-col gap-8">
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

        {collections.length ? (
          <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
            {collections.map((collection) => (
              <CollectionCard key={collection.id} collection={collection} />
            ))}
          </section>
        ) : (
          <section className="rounded-[24px] border border-white/10 bg-[#08090c] p-8 shadow-[0_16px_48px_rgba(0,0,0,0.2)]">
            <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
              Empty Workspace
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50">
              No collections yet
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Collections will appear here as soon as you create them from the top bar.
            </p>
          </section>
        )}
      </div>
    </DashboardShell>
  );
}

import Link from "next/link";
import { redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { auth } from "@/auth";
import { FavoritesList } from "@/components/favorites/favorites-list";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import {
  getAllDashboardCollections,
  getFavoriteDashboardCollections,
} from "@/lib/db/collections";
import { getUserEditorPreferences } from "@/lib/db/editor-preferences";
import {
  getDashboardSidebarItemTypes,
  getFavoriteDashboardItems,
} from "@/lib/db/items";
import {
  getDashboardSearchItems,
  mapCollectionsToDashboardSearchRecords,
} from "@/lib/db/search";

export const dynamic = "force-dynamic";

export default async function FavoritesPage() {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    redirect("/sign-in");
  }

  const [
    collections,
    favoriteCollections,
    favoriteItems,
    sidebarItemTypes,
    searchItems,
    editorPreferences,
  ] = await Promise.all([
    getAllDashboardCollections(session.user.id),
    getFavoriteDashboardCollections(session.user.id),
    getFavoriteDashboardItems(session.user.id),
    getDashboardSidebarItemTypes(session.user.id),
    getDashboardSearchItems(session.user.id),
    getUserEditorPreferences(session.user.id),
  ]);
  const sidebarFavoriteCollections = collections
    .filter((collection) => collection.isFavorite)
    .slice(0, 4);
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
        isPro: session.user.isPro,
        name: session.user.name,
      }}
      editorPreferences={editorPreferences}
      favoriteCollections={sidebarFavoriteCollections}
      recentCollections={recentCollections}
      searchData={searchData}
      sidebarItemTypes={sidebarItemTypes}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="transition-colors hover:text-foreground">
            Dashboard
          </Link>
          <ChevronRight className="size-4" />
          <span className="text-foreground">Favorites</span>
        </nav>

        <header className="border-y border-white/10 py-6">
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div className="min-w-0">
              <p className="font-mono text-xs uppercase tracking-[0.2em] text-muted-foreground">
                Quick Access
              </p>
              <h1 className="mt-2 text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
                Favorites
              </h1>
              <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
                {favoriteItems.length} {favoriteItems.length === 1 ? "item" : "items"} and{" "}
                {favoriteCollections.length}{" "}
                {favoriteCollections.length === 1 ? "collection" : "collections"} starred in your
                workspace.
              </p>
            </div>
          </div>
        </header>

        <FavoritesList collections={favoriteCollections} items={favoriteItems} />
      </div>
    </DashboardShell>
  );
}

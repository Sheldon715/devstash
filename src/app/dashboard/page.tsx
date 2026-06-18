import { redirect } from "next/navigation";

import { auth } from "@/auth";
import { CollectionsSection } from "@/components/dashboard/collections-section";
import { PinnedItems } from "@/components/dashboard/pinned-items";
import { RecentItems } from "@/components/dashboard/recent-items";
import { StatsCards } from "@/components/dashboard/stats-cards";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { getAllDashboardCollections } from "@/lib/db/collections";
import { getUserEditorPreferences } from "@/lib/db/editor-preferences";
import {
  getPinnedDashboardItems,
  getRecentDashboardItems,
  getDashboardSidebarItemTypes,
} from "@/lib/db/items";
import {
  getDashboardSearchItems,
  mapCollectionsToDashboardSearchRecords,
} from "@/lib/db/search";
import {
  DASHBOARD_COLLECTIONS_LIMIT,
  DASHBOARD_RECENT_ITEMS_LIMIT,
} from "@/lib/pagination";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    redirect("/sign-in");
  }

  const [
    collections,
    sidebarItemTypes,
    pinnedItems,
    recentItems,
    searchItems,
    editorPreferences,
  ] = await Promise.all([
    getAllDashboardCollections(session.user.id),
    getDashboardSidebarItemTypes(session.user.id),
    getPinnedDashboardItems(session.user.id),
    getRecentDashboardItems(session.user.id, DASHBOARD_RECENT_ITEMS_LIMIT),
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
        isPro: session.user.isPro,
        name: session.user.name,
      }}
      editorPreferences={editorPreferences}
      favoriteCollections={favoriteCollections}
      recentCollections={recentCollections}
      searchData={searchData}
      sidebarItemTypes={sidebarItemTypes}
    >
      <div className="mx-auto w-full space-y-8 xl:space-y-9">
        <header className="space-y-2.5">
          <h1 className="text-3xl font-semibold tracking-tight text-zinc-50 sm:text-4xl">
            Dashboard
          </h1>
          <p className="max-w-xl text-sm text-muted-foreground sm:text-base">
            Your developer knowledge hub
          </p>
        </header>

        <StatsCards userId={session.user.id} />
        <CollectionsSection collections={collections.slice(0, DASHBOARD_COLLECTIONS_LIMIT)} />
        <PinnedItems items={pinnedItems} />
        <RecentItems items={recentItems} />
      </div>
    </DashboardShell>
  );
}

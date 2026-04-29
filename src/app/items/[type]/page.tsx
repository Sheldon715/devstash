import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { auth } from "@/auth";
import { ItemCard } from "@/components/dashboard/item-card";
import { FileListView } from "@/components/items/file-list-view";
import { ImageThumbnailCard } from "@/components/items/image-thumbnail-card";
import { ProItemTypeUpgrade } from "@/components/items/pro-item-type-upgrade";
import { TypePageCreateButton } from "@/components/items/type-page-create-button";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import { PaginationControls } from "@/components/layout/pagination-controls";
import {
  DashboardNamedIcon,
  getDashboardItemTypeColor,
} from "@/lib/dashboard-icons";
import { getAllDashboardCollections } from "@/lib/db/collections";
import { getUserEditorPreferences } from "@/lib/db/editor-preferences";
import {
  getDashboardItemTypePage,
  getDashboardSidebarItemTypes,
} from "@/lib/db/items";
import {
  getDashboardSearchItems,
  mapCollectionsToDashboardSearchRecords,
} from "@/lib/db/search";
import { normalizeDashboardItemTypeRouteKey } from "@/lib/item-types";
import { normalizePage } from "@/lib/pagination";

export const dynamic = "force-dynamic";

interface ItemTypePageProps {
  params: Promise<{
    type: string;
  }>;
  searchParams: Promise<{
    page?: string | string[];
  }>;
}

export default async function ItemTypePage({ params, searchParams }: ItemTypePageProps) {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    redirect("/sign-in");
  }

  const [{ type }, resolvedSearchParams] = await Promise.all([params, searchParams]);
  const normalizedTypeKey = normalizeDashboardItemTypeRouteKey(type);

  if (!normalizedTypeKey) {
    notFound();
  }

  const page = normalizePage(resolvedSearchParams.page);
  const proOnlyType =
    normalizedTypeKey === "file" || normalizedTypeKey === "image" ? normalizedTypeKey : null;
  const shouldShowUpgradePage = Boolean(proOnlyType && !session.user.isPro);
  const [collections, sidebarItemTypes, itemTypePage, searchItems, editorPreferences] =
    await Promise.all([
      getAllDashboardCollections(session.user.id),
      getDashboardSidebarItemTypes(session.user.id),
      shouldShowUpgradePage
        ? Promise.resolve(null)
        : getDashboardItemTypePage(session.user.id, normalizedTypeKey, { page }),
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

  if (proOnlyType && shouldShowUpgradePage) {
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
        <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
          <nav className="flex items-center gap-2 text-sm text-muted-foreground">
            <Link href="/dashboard" className="transition-colors hover:text-foreground">
              Dashboard
            </Link>
            <ChevronRight className="size-4" />
            <span className="text-foreground">
              {proOnlyType === "file" ? "Files" : "Images"}
            </span>
          </nav>

          <ProItemTypeUpgrade typeKey={proOnlyType} />
        </div>
      </DashboardShell>
    );
  }

  if (!itemTypePage) {
    notFound();
  }

  const { itemType, items, pagination } = itemTypePage;
  const isFileList = itemType.typeKey === "file";
  const isImageGallery = itemType.typeKey === "image";

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
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="transition-colors hover:text-foreground">
            Dashboard
          </Link>
          <ChevronRight className="size-4" />
          <span className="text-foreground">{itemType.name}</span>
        </nav>

        <header className="rounded-[28px] border border-border/70 bg-[#0b0b0d] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-center sm:justify-between">
            <div className="flex items-center gap-4">
              <div className="flex size-14 items-center justify-center rounded-2xl border border-white/6 bg-card">
                <DashboardNamedIcon
                  iconName={itemType.icon}
                  className={`size-6 ${getDashboardItemTypeColor(itemType.typeKey)}`}
                />
              </div>
              <div>
                <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
                  Item Type
                </p>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-50">
                  {itemType.name}
                </h1>
                <p className="mt-2 text-base text-muted-foreground">
                  {itemType.totalItems} saved{" "}
                  {itemType.totalItems === 1 ? "item" : "items"} in this category
                </p>
              </div>
            </div>

            <div className="sm:self-start">
              <TypePageCreateButton
                collectionOptions={collectionOptions}
                typeKey={itemType.typeKey}
                typeName={itemType.name}
              />
            </div>
          </div>
        </header>

        {items.length ? (
          <div className="space-y-6">
            {isFileList ? (
              <FileListView items={items} />
            ) : isImageGallery ? (
              <section className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                {items.map((item) => (
                  <ImageThumbnailCard key={item.id} item={item} preserveAspectRatio />
                ))}
              </section>
            ) : (
              <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-3">
                {items.map((item) => (
                  <ItemCard key={item.id} item={item} variant="compact" />
                ))}
              </section>
            )}

            <PaginationControls basePath={`/items/${type}`} pagination={pagination} />
          </div>
        ) : (
          <section className="rounded-[24px] border border-white/10 bg-[#08090c] p-8 shadow-[0_16px_48px_rgba(0,0,0,0.2)]">
            <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
              Empty Type
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50">
              No {itemType.name.toLowerCase()} items yet
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Items of this type will appear here as soon as they are added to your workspace.
            </p>
          </section>
        )}
      </div>
    </DashboardShell>
  );
}

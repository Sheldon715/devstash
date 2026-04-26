import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRight, FolderOpen, Star } from "lucide-react";

import { auth } from "@/auth";
import { CollectionActions } from "@/components/collections/collection-actions";
import { ItemCard } from "@/components/dashboard/item-card";
import { FileListView } from "@/components/items/file-list-view";
import { ImageThumbnailCard } from "@/components/items/image-thumbnail-card";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import {
  getAllDashboardCollections,
  getDashboardCollectionItems,
} from "@/lib/db/collections";
import { getDashboardSidebarItemTypes } from "@/lib/db/items";

export const dynamic = "force-dynamic";

interface CollectionDetailPageProps {
  params: Promise<{
    id: string;
  }>;
}

export default async function CollectionDetailPage({
  params,
}: CollectionDetailPageProps) {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    redirect("/sign-in");
  }

  const { id } = await params;
  const [collections, sidebarItemTypes, items] = await Promise.all([
    getAllDashboardCollections(session.user.id),
    getDashboardSidebarItemTypes(session.user.id),
    getDashboardCollectionItems(session.user.id, id),
  ]);
  const collection = collections.find((candidate) => candidate.id === id);

  if (!collection) {
    notFound();
  }

  const favoriteCollections = collections.filter((candidate) => candidate.isFavorite).slice(0, 4);
  const recentCollections = collections.slice(0, 4);
  const collectionOptions = collections.map((candidate) => ({
    id: candidate.id,
    name: candidate.name,
  }));
  const fileItems = items.filter((item) => item.typeKey === "file");
  const imageItems = items.filter((item) => item.typeKey === "image");
  const standardItems = items.filter(
    (item) => item.typeKey !== "file" && item.typeKey !== "image",
  );

  return (
    <DashboardShell
      collectionOptions={collectionOptions}
      currentUser={{
        email: session.user.email,
        image: session.user.image,
        name: session.user.name,
      }}
      favoriteCollections={favoriteCollections}
      recentCollections={recentCollections}
      sidebarItemTypes={sidebarItemTypes}
    >
      <div className="mx-auto flex w-full flex-col gap-8">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="transition-colors hover:text-foreground">
            Dashboard
          </Link>
          <ChevronRight className="size-4" />
          <Link href="/collections" className="transition-colors hover:text-foreground">
            Collections
          </Link>
          <ChevronRight className="size-4" />
          <span className="truncate text-foreground">{collection.name}</span>
        </nav>

        <header className="rounded-[28px] border border-border/70 bg-[#0b0b0d] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:justify-between">
            <div className="flex min-w-0 gap-4">
              <div className="flex size-14 shrink-0 items-center justify-center rounded-2xl border border-white/6 bg-card text-muted-foreground">
                <FolderOpen className="size-6" />
              </div>
              <div className="min-w-0">
                <div className="flex flex-wrap items-center gap-2.5">
                  <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
                    Collection
                  </p>
                  {collection.isFavorite ? (
                    <Star className="size-4 fill-[#facc15] text-[#facc15]" />
                  ) : null}
                </div>
                <h1 className="mt-2 text-4xl font-semibold tracking-tight text-zinc-50">
                  {collection.name}
                </h1>
                <p className="mt-3 max-w-2xl text-base leading-7 text-muted-foreground">
                  {collection.description}
                </p>
              </div>
            </div>

            <div className="flex shrink-0 flex-col items-start gap-3 sm:items-end">
              <div className="rounded-2xl border border-white/10 bg-white/[0.03] px-4 py-3 text-sm text-muted-foreground">
                <span className="font-medium text-zinc-50">{items.length}</span>{" "}
                {items.length === 1 ? "item" : "items"}
              </div>
              <CollectionActions
                collection={{
                  id: collection.id,
                  name: collection.name,
                  descriptionValue: collection.descriptionValue,
                  isFavorite: collection.isFavorite,
                }}
                deleteRedirectHref="/collections"
                variant="toolbar"
              />
            </div>
          </div>
        </header>

        {items.length ? (
          <div className="space-y-5">
            {standardItems.length ? (
              <section className="grid grid-cols-1 gap-5 lg:grid-cols-2 2xl:grid-cols-3">
                {standardItems.map((item) => (
                  <ItemCard key={item.id} item={item} variant="compact" />
                ))}
              </section>
            ) : null}

            {fileItems.length ? (
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Files
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {fileItems.length} {fileItems.length === 1 ? "file" : "files"}
                  </span>
                </div>

                <FileListView items={fileItems} />
              </section>
            ) : null}

            {imageItems.length ? (
              <section className="space-y-3">
                <div className="flex items-center justify-between gap-3">
                  <h2 className="text-sm font-medium uppercase tracking-[0.18em] text-muted-foreground">
                    Images
                  </h2>
                  <span className="text-xs text-muted-foreground">
                    {imageItems.length} {imageItems.length === 1 ? "image" : "images"}
                  </span>
                </div>

                <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 2xl:grid-cols-3">
                  {imageItems.map((item) => (
                    <ImageThumbnailCard key={item.id} item={item} preserveAspectRatio />
                  ))}
                </div>
              </section>
            ) : null}
          </div>
        ) : (
          <section className="rounded-[24px] border border-white/10 bg-[#08090c] p-8 shadow-[0_16px_48px_rgba(0,0,0,0.2)]">
            <p className="text-sm uppercase tracking-[0.22em] text-muted-foreground">
              Empty Collection
            </p>
            <h2 className="mt-3 text-2xl font-semibold tracking-tight text-zinc-50">
              No items in this collection yet
            </h2>
            <p className="mt-3 max-w-2xl text-sm leading-6 text-muted-foreground sm:text-base">
              Items will appear here as soon as they are added to this collection.
            </p>
          </section>
        )}
      </div>
    </DashboardShell>
  );
}

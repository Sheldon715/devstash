import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { auth } from "@/auth";
import { ItemCard } from "@/components/dashboard/item-card";
import { FileListView } from "@/components/items/file-list-view";
import { ImageThumbnailCard } from "@/components/items/image-thumbnail-card";
import { TypePageCreateButton } from "@/components/items/type-page-create-button";
import { getAllDashboardCollections } from "@/lib/db/collections";
import { DashboardShell } from "@/components/layout/dashboard-shell";
import {
  DashboardNamedIcon,
  getDashboardItemTypeColor,
} from "@/lib/dashboard-icons";
import {
  getDashboardItemTypePage,
  getDashboardSidebarItemTypes,
} from "@/lib/db/items";

export const dynamic = "force-dynamic";

interface ItemTypePageProps {
  params: Promise<{
    type: string;
  }>;
}

export default async function ItemTypePage({ params }: ItemTypePageProps) {
  const session = await auth();

  if (!session?.user?.id || !session.user.email) {
    redirect("/sign-in");
  }

  const { type } = await params;
  const [collections, sidebarItemTypes, itemTypePage] = await Promise.all([
    getAllDashboardCollections(session.user.id),
    getDashboardSidebarItemTypes(session.user.id),
    getDashboardItemTypePage(session.user.id, type),
  ]);

  if (!itemTypePage) {
    notFound();
  }

  const { itemType, items } = itemTypePage;
  const isFileList = itemType.typeKey === "file";
  const isImageGallery = itemType.typeKey === "image";
  const favoriteCollections = collections.filter((collection) => collection.isFavorite).slice(0, 4);
  const recentCollections = collections.slice(0, 4);

  return (
    <DashboardShell
      currentUser={{
        email: session.user.email,
        image: session.user.image,
        name: session.user.name,
      }}
      favoriteCollections={favoriteCollections}
      recentCollections={recentCollections}
      sidebarItemTypes={sidebarItemTypes}
    >
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
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
                  {items.length} saved items in this category
                </p>
              </div>
            </div>

            <div className="sm:self-start">
              <TypePageCreateButton typeKey={itemType.typeKey} typeName={itemType.name} />
            </div>
          </div>
        </header>

        {items.length ? (
          isFileList ? (
            <FileListView items={items} />
          ) : (
            <section className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {items.map((item) => (
                isImageGallery ? (
                  <ImageThumbnailCard key={item.id} item={item} />
                ) : (
                  <ItemCard key={item.id} item={item} variant="compact" />
                )
              ))}
            </section>
          )
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

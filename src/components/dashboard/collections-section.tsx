import Link from "next/link";

import { CollectionCard } from "@/components/dashboard/collection-card";
import type { DashboardCollectionCardRecord } from "@/lib/db/collections";

interface CollectionsSectionProps {
  collections: DashboardCollectionCardRecord[];
}

export function CollectionsSection({ collections }: CollectionsSectionProps) {

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">
            Collections
          </h2>
        </div>

        <Link
          href="/collections"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-zinc-50 sm:text-sm"
        >
          View all
        </Link>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {collections.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
      </div>
    </section>
  );
}

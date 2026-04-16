import { CollectionCard } from "@/components/dashboard/collection-card";
import { getRecentDashboardCollections } from "@/lib/db/collections";

export async function CollectionsSection() {
  const recentCollections = await getRecentDashboardCollections();

  return (
    <section className="space-y-4">
      <div className="flex flex-wrap items-end justify-between gap-3">
        <div className="space-y-1">
          <h2 className="text-xl font-semibold tracking-tight text-zinc-50 sm:text-2xl">
            Collections
          </h2>
        </div>

        <button
          type="button"
          className="text-xs font-medium text-muted-foreground transition-colors hover:text-zinc-50 sm:text-sm"
        >
          View all
        </button>
      </div>

      <div className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
        {recentCollections.map((collection) => (
          <CollectionCard key={collection.id} collection={collection} />
        ))}
      </div>
    </section>
  );
}

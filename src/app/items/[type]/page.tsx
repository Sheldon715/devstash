import Link from "next/link";
import { notFound } from "next/navigation";
import { ChevronRight } from "lucide-react";

import { getDashboardIconByName, getDashboardItemTypeColor } from "@/lib/dashboard-icons";
import { getDashboardItemTypePage } from "@/lib/db/items";

interface ItemTypePageProps {
  params: Promise<{
    type: string;
  }>;
}

export default async function ItemTypePage({ params }: ItemTypePageProps) {
  const { type } = await params;
  const itemTypePage = await getDashboardItemTypePage(type);

  if (!itemTypePage) {
    notFound();
  }

  const { itemType, items } = itemTypePage;
  const Icon = getDashboardIconByName(itemType.icon);

  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-5xl flex-col gap-8">
        <nav className="flex items-center gap-2 text-sm text-muted-foreground">
          <Link href="/dashboard" className="transition-colors hover:text-foreground">
            Dashboard
          </Link>
          <ChevronRight className="size-4" />
          <span className="text-foreground">{itemType.name}</span>
        </nav>

        <header className="rounded-[28px] border border-border/70 bg-[#0b0b0d] p-8 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <div className="flex items-center gap-4">
            <div className="flex size-14 items-center justify-center rounded-2xl border border-white/6 bg-card">
              <Icon className={`size-6 ${getDashboardItemTypeColor(itemType.typeKey)}`} />
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
        </header>

        <section className="grid gap-4">
          {items.map((item) => (
            <article
              key={item.id}
              className="rounded-[24px] border border-border/70 bg-[#09090b] p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]"
            >
              <div className="flex items-start justify-between gap-4">
                <div>
                  <h2 className="text-xl font-semibold text-zinc-50">{item.title}</h2>
                  <p className="mt-2 text-sm leading-6 text-muted-foreground">
                    {item.description}
                  </p>
                </div>
                <p className="shrink-0 text-sm text-muted-foreground">
                  {new Intl.DateTimeFormat("en-US", {
                    month: "short",
                    day: "numeric",
                  }).format(item.updatedAt)}
                </p>
              </div>

              <div className="mt-4 flex flex-wrap gap-2">
                <span
                  className={`rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-medium ${getDashboardItemTypeColor(item.typeKey)}`}
                >
                  {item.typeLabel}
                </span>
                {item.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-full border border-border/70 bg-card px-3 py-1 text-xs font-medium text-muted-foreground"
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </article>
          ))}
        </section>
      </div>
    </main>
  );
}

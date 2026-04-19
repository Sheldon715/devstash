function DashboardCardSkeleton() {
  return <div className="h-32 animate-pulse rounded-[22px] border border-white/8 bg-[#09090c]" />;
}

export default function DashboardLoading() {
  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto flex w-full max-w-[1040px] flex-col gap-8 px-4 py-6 sm:px-6 lg:px-8 xl:px-12 2xl:px-16">
        <div className="space-y-3">
          <div className="h-10 w-52 animate-pulse rounded-xl bg-white/8" />
          <div className="h-5 w-64 animate-pulse rounded-lg bg-white/6" />
        </div>

        <section className="grid gap-3.5 sm:grid-cols-2 xl:grid-cols-4">
          {Array.from({ length: 4 }, (_, index) => (
            <DashboardCardSkeleton key={index} />
          ))}
        </section>

        <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 3 }, (_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-[24px] border border-white/10 bg-[#08090c]"
            />
          ))}
        </section>

        <section className="space-y-4">
          {Array.from({ length: 2 }, (_, index) => (
            <div
              key={index}
              className="h-44 animate-pulse rounded-[24px] border border-white/10 bg-[#08090c]"
            />
          ))}
        </section>
      </div>
    </main>
  );
}

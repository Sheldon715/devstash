export default function CollectionsLoading() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="h-5 w-40 animate-pulse rounded-lg bg-white/6" />
        <div className="h-40 animate-pulse rounded-[28px] border border-white/10 bg-[#0b0b0d]" />
        <section className="grid gap-4 lg:grid-cols-2 2xl:grid-cols-3">
          {Array.from({ length: 6 }, (_, index) => (
            <div
              key={index}
              className="h-64 animate-pulse rounded-[24px] border border-white/10 bg-[#08090c]"
            />
          ))}
        </section>
      </div>
    </main>
  );
}

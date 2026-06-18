export default function ItemTypeLoading() {
  return (
    <main className="min-h-screen bg-background px-4 py-8 text-foreground sm:px-6 lg:px-8">
      <div className="mx-auto flex w-full max-w-6xl flex-col gap-8">
        <div className="h-5 w-40 animate-pulse rounded-lg bg-white/6" />
        <div className="h-40 animate-pulse rounded-[28px] border border-white/10 bg-[#0b0b0d]" />
        <section className="grid gap-4">
          {Array.from({ length: 4 }, (_, index) => (
            <div
              key={index}
              className="h-48 animate-pulse rounded-[24px] border border-white/10 bg-[#09090b]"
            />
          ))}
        </section>
      </div>
    </main>
  );
}

import { LayoutPanelLeft } from "lucide-react";

export function Sidebar() {
  return (
    <aside className="flex min-h-screen w-full max-w-[272px] flex-col border-r border-border/70 bg-[#060607]">
      <div className="flex items-center gap-3 px-4 py-5">
        <div className="flex size-8 items-center justify-center rounded-xl bg-gradient-to-br from-[#5f7cff] via-[#6c52ff] to-[#8c4bff] text-white shadow-[0_10px_30px_rgba(99,102,241,0.35)]">
          <div className="grid gap-0.5">
            <span className="block h-0.5 w-3 rounded-full bg-white/90" />
            <span className="block h-0.5 w-3 rounded-full bg-white/75" />
            <span className="block h-0.5 w-3 rounded-full bg-white/60" />
          </div>
        </div>
        <span className="text-lg font-semibold tracking-tight">DevStash</span>
      </div>

      <div className="flex flex-1 items-start p-4">
        <section className="w-full rounded-3xl border border-border/70 bg-card/50 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.02)]">
          <div className="mb-4 flex items-center gap-3">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-[#13141a]">
              <LayoutPanelLeft className="size-4 text-muted-foreground" />
            </div>
            <div>
              <h2 className="text-lg font-semibold tracking-tight text-zinc-100">
                Sidebar
              </h2>
              <p className="text-sm text-muted-foreground">Phase 1 placeholder</p>
            </div>
          </div>

          <p className="text-sm leading-6 text-muted-foreground">
            This area will hold collections, types, favorites, and recent items
            in later dashboard phases.
          </p>
        </section>
      </div>
    </aside>
  );
}

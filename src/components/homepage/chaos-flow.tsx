"use client";

import { useEffect, useRef } from "react";
import {
  Bookmark,
  Code2,
  FileText,
  GitBranch,
  Globe2,
  MessageSquare,
  NotebookText,
  Terminal,
} from "lucide-react";

import {
  itemAccentBackgrounds,
  itemAccentClasses,
  previewCards,
} from "@/components/homepage/homepage-data";
import { cn } from "@/lib/utils";

const chaosIcons = [
  { Icon: NotebookText, label: "Notes app" },
  { Icon: GitBranch, label: "Git repository" },
  { Icon: MessageSquare, label: "Team chat" },
  { Icon: Code2, label: "Code editor" },
  { Icon: Globe2, label: "Browser tabs" },
  { Icon: Terminal, label: "Terminal" },
  { Icon: FileText, label: "Text file" },
  { Icon: Bookmark, label: "Bookmarks" },
];

export function ChaosFlow() {
  const stageRef = useRef<HTMLDivElement>(null);
  const iconRefs = useRef<Array<HTMLDivElement | null>>([]);

  useEffect(() => {
    const stage = stageRef.current;
    const icons = iconRefs.current.filter((icon): icon is HTMLDivElement => Boolean(icon));

    if (!stage || !icons.length) {
      return;
    }

    const activeStage = stage;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const setIconPosition = (element: HTMLDivElement, x: number, y: number, rotation: number) => {
      element.style.setProperty("--chaos-x", `${x}px`);
      element.style.setProperty("--chaos-y", `${y}px`);
      element.style.setProperty("--chaos-r", `${rotation}deg`);
      element.style.setProperty("--chaos-s", "1");
    };

    if (reduceMotion) {
      icons.forEach((icon, index) => {
        setIconPosition(icon, 20 + (index % 4) * 76, 22 + Math.floor(index / 4) * 96, index * 7);
      });
      return;
    }

    const pointer = { active: false, x: -9999, y: -9999 };
    const items = icons.map((icon, index) => ({
      element: icon,
      pulse: index * 0.74,
      rotation: index * 13,
      vx: 0.36 + (index % 3) * 0.18,
      vy: 0.32 + (index % 4) * 0.13,
      x: 24 + (index % 4) * 78,
      y: 24 + Math.floor(index / 4) * 100,
    }));
    let frameId = 0;

    function handlePointerMove(event: PointerEvent) {
      const rect = activeStage.getBoundingClientRect();
      pointer.active = true;
      pointer.x = event.clientX - rect.left;
      pointer.y = event.clientY - rect.top;
    }

    function handlePointerLeave() {
      pointer.active = false;
    }

    function animate() {
      const width = activeStage.clientWidth;
      const height = activeStage.clientHeight;

      items.forEach((item) => {
        const size = item.element.offsetWidth;
        item.x += item.vx;
        item.y += item.vy;
        item.rotation += item.vx * 0.44;
        item.pulse += 0.035;

        if (item.x <= 8 || item.x + size >= width - 8) {
          item.vx *= -1;
          item.x = Math.max(8, Math.min(item.x, width - size - 8));
        }

        if (item.y <= 8 || item.y + size >= height - 8) {
          item.vy *= -1;
          item.y = Math.max(8, Math.min(item.y, height - size - 8));
        }

        if (pointer.active) {
          const centerX = item.x + size / 2;
          const centerY = item.y + size / 2;
          const dx = centerX - pointer.x;
          const dy = centerY - pointer.y;
          const distance = Math.hypot(dx, dy);
          const radius = 118;

          if (distance < radius && distance > 0.01) {
            const force = (radius - distance) / radius;
            item.x += (dx / distance) * force * 7;
            item.y += (dy / distance) * force * 7;
          }
        }

        item.element.style.setProperty("--chaos-x", `${item.x}px`);
        item.element.style.setProperty("--chaos-y", `${item.y}px`);
        item.element.style.setProperty("--chaos-r", `${item.rotation}deg`);
        item.element.style.setProperty("--chaos-s", (1 + Math.sin(item.pulse) * 0.045).toFixed(3));
      });

      frameId = window.requestAnimationFrame(animate);
    }

    activeStage.addEventListener("pointermove", handlePointerMove, { passive: true });
    activeStage.addEventListener("pointerleave", handlePointerLeave);
    frameId = window.requestAnimationFrame(animate);

    return () => {
      activeStage.removeEventListener("pointermove", handlePointerMove);
      activeStage.removeEventListener("pointerleave", handlePointerLeave);
      window.cancelAnimationFrame(frameId);
    };
  }, []);

  return (
    <div
      className="mx-auto grid w-full max-w-7xl items-center gap-5 lg:grid-cols-[minmax(0,1fr)_92px_minmax(0,1fr)]"
      aria-label="Chaos to order DevStash concept"
    >
      <article className="space-y-5">
        <div className="flex items-center justify-center gap-3 text-center text-base font-extrabold tracking-[0.14em] text-zinc-50 uppercase sm:text-xl">
          <span>Your knowledge today...</span>
        </div>
        <div
          ref={stageRef}
          className="relative h-[284px] overflow-hidden rounded-3xl border border-violet-200/18 bg-[radial-gradient(circle_at_24%_18%,rgba(147,197,253,0.12),transparent_16rem),linear-gradient(135deg,rgba(255,255,255,0.08),rgba(139,92,246,0.08))] sm:h-[322px]"
        >
          {chaosIcons.map(({ Icon, label }, index) => (
            <div
              key={label}
              ref={(node) => {
                iconRefs.current[index] = node;
              }}
              aria-label={label}
              className="absolute left-0 top-0 grid size-16 place-items-center text-zinc-100/90 drop-shadow-[0_0_12px_rgba(216,200,255,0.16)] will-change-transform [transform:translate3d(var(--chaos-x,0),var(--chaos-y,0),0)_rotate(var(--chaos-r,0deg))_scale(var(--chaos-s,1))] sm:size-[72px]"
            >
              <Icon className="size-11 stroke-[1.8] sm:size-14" aria-hidden="true" />
            </div>
          ))}
        </div>
      </article>

      <div className="grid h-14 place-items-center lg:h-[72px]">
        <div className="relative h-1 w-17 rounded-full bg-gradient-to-r from-blue-400 to-violet-400 motion-safe:animate-pulse lg:w-[70px]">
          <span className="absolute right-0 top-1/2 size-4 -translate-y-1/2 rotate-45 border-r-4 border-t-4 border-violet-400" />
        </div>
      </div>

      <article className="overflow-hidden rounded-3xl border border-white/10 bg-[linear-gradient(145deg,rgba(96,165,250,0.1),transparent_34%),linear-gradient(180deg,rgba(15,18,34,0.96),rgba(7,9,22,0.96))] shadow-[0_24px_70px_rgba(0,0,0,0.35)]">
        <div className="flex min-h-14 items-center justify-between gap-3 border-b border-white/10 px-4 font-extrabold text-zinc-50">
          <span>...with DevStash</span>
          <span className="rounded-full border border-violet-200/25 bg-violet-200/10 px-2.5 py-1 text-[11px] font-black text-violet-200 uppercase">
            Organized
          </span>
        </div>
        <div className="grid h-[284px] grid-cols-[64px_minmax(0,1fr)] bg-[#070916] sm:h-[322px] sm:grid-cols-[86px_minmax(0,1fr)]">
          <aside className="flex flex-col gap-3 border-r border-white/10 bg-[#090c1a] px-3 py-5 sm:px-5">
            <span className="h-3 w-8 rounded-full bg-blue-400" />
            <span className="h-3 w-8 rounded-full bg-white/15" />
            <span className="h-3 w-8 rounded-full bg-white/15" />
            <span className="mt-1 h-3 w-10 rounded-full bg-white/15 sm:w-12" />
            <span className="h-3 w-7 rounded-full bg-white/15 sm:w-8" />
          </aside>
          <div className="min-w-0 p-3 sm:p-5">
            <div className="mb-4 flex justify-between gap-4">
              <span className="h-4 w-[46%] rounded-full bg-white/14" />
              <span className="h-4 w-[24%] rounded-full bg-white/14" />
            </div>
            <div className="grid grid-cols-2 gap-2.5 sm:gap-3">
              {previewCards.map((card) => (
                <div
                  key={card.title}
                  className={cn(
                    "min-h-17 rounded-2xl border border-t-2 bg-gradient-to-b p-3 sm:min-h-19",
                    itemAccentClasses[card.accent],
                    itemAccentBackgrounds[card.accent],
                  )}
                >
                  <strong className="block truncate text-sm font-bold text-zinc-50">
                    {card.title}
                  </strong>
                  <span className="mt-1 block truncate text-[11px] font-bold tracking-[0.12em] text-zinc-400 uppercase">
                    {card.label}
                  </span>
                </div>
              ))}
            </div>
          </div>
        </div>
      </article>
    </div>
  );
}

import Link from "next/link";

import { footerGroups } from "@/components/homepage/homepage-data";

export function HomepageFooter() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="border-t border-white/8 bg-[#05060f] px-4 py-10 sm:px-6 lg:px-12">
      <div className="mx-auto grid max-w-7xl gap-9 lg:grid-cols-[1fr_auto]">
        <Link
          href="/"
          aria-label="DevStash home"
          className="flex w-fit items-center gap-2.5 rounded-md focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:outline-none"
        >
          <span className="grid size-9 place-items-center rounded-lg border border-white/12 bg-gradient-to-br from-blue-500/90 via-indigo-500/85 to-violet-500/85 text-xs font-black text-white">
            DS
          </span>
          <span className="text-sm font-extrabold tracking-tight text-zinc-50 sm:text-base">
            DevStash
          </span>
        </Link>

        <div className="grid gap-7 sm:grid-cols-3">
          {footerGroups.map((group) => (
            <div key={group.title} className="grid gap-2">
              <strong className="text-sm font-bold text-zinc-100">{group.title}</strong>
              {group.links.map((link) => (
                <Link
                  key={`${group.title}-${link.href}`}
                  href={link.href}
                  className="text-sm text-zinc-400 transition-colors hover:text-zinc-100"
                >
                  {link.label}
                </Link>
              ))}
            </div>
          ))}
        </div>

        <p className="text-sm text-zinc-500 lg:col-span-2">
          &copy; {currentYear} DevStash. All rights reserved.
        </p>
      </div>
    </footer>
  );
}

"use client";

import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { LogOut, Settings2, UserCircle2 } from "lucide-react";

import { signOutAction } from "@/actions/auth";
import { UserAvatar } from "@/components/auth/user-avatar";
import { Button, buttonVariants } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export interface SidebarCurrentUser {
  email: string;
  image?: string | null;
  isPro: boolean;
  name?: string | null;
}

interface SidebarUserMenuProps {
  currentUser: SidebarCurrentUser;
  isCollapsed: boolean;
}

export function SidebarUserMenu({ currentUser, isCollapsed }: SidebarUserMenuProps) {
  const [isOpen, setIsOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handlePointerDown(event: MouseEvent) {
      if (!menuRef.current?.contains(event.target as Node)) {
        setIsOpen(false);
      }
    }

    function handleEscape(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    document.addEventListener("mousedown", handlePointerDown);
    document.addEventListener("keydown", handleEscape);

    return () => {
      document.removeEventListener("mousedown", handlePointerDown);
      document.removeEventListener("keydown", handleEscape);
    };
  }, []);

  return (
    <div
      ref={menuRef}
      className="relative"
    >
      <Button
        type="button"
        variant="outline"
        className={cn(
          "group h-auto min-w-0 rounded-2xl border-transparent bg-transparent text-left text-inherit hover:bg-white/[0.04] hover:text-inherit",
          isCollapsed
            ? "flex w-full justify-center p-1.5"
            : "flex w-full items-center gap-[clamp(6px,0.9vh,10px)] px-1.5 py-1.5",
          isOpen && "bg-white/[0.05]",
        )}
        onClick={() => setIsOpen((current) => !current)}
      >
        <UserAvatar
          image={currentUser.image}
          name={currentUser.name}
          fallbackLabel={currentUser.email}
          className="size-[clamp(30px,3.6vh,40px)] shrink-0 ring-1 ring-white/10 transition-transform group-hover:scale-[1.02]"
          textClassName="text-[clamp(9px,1.1vh,10px)]"
        />

        <div
          className={cn(
            "min-w-0 flex-1 overflow-hidden transition-all duration-400 ease-[cubic-bezier(0.22,1,0.36,1)]",
            isCollapsed
              ? "pointer-events-none w-0 max-w-0 -translate-x-2 opacity-0"
              : "w-auto max-w-[160px] translate-x-0 opacity-100",
          )}
        >
          <p className="truncate text-[clamp(11px,1.45vh,13px)] font-semibold text-zinc-50">
            {currentUser.name || "DevStash User"}
          </p>
          <p className="truncate text-[clamp(10px,1.2vh,11px)] text-muted-foreground">
            {currentUser.email}
          </p>
        </div>
      </Button>

      <div
        aria-hidden={!isOpen}
        className={cn(
          "absolute z-20 min-w-[196px] rounded-2xl border border-white/10 bg-[#0d0d11] p-2 shadow-[0_18px_40px_rgba(0,0,0,0.42)] transition-all duration-200 ease-out",
          isCollapsed
            ? "bottom-0 left-[calc(100%+12px)] origin-left"
            : "right-0 bottom-[calc(100%+12px)] origin-bottom-right",
          isOpen
            ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
            : "pointer-events-none translate-y-2 scale-[0.98] opacity-0",
        )}
      >
          <div className="border-b border-white/8 px-3 py-2.5">
            <p className="truncate text-sm font-medium text-white">
              {currentUser.name || "DevStash User"}
            </p>
            <p className="truncate text-xs text-zinc-400">{currentUser.email}</p>
          </div>

          <div className="space-y-1 pt-2">
            <Link
              href="/profile"
              onClick={() => setIsOpen(false)}
              tabIndex={isOpen ? 0 : -1}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-10 w-full justify-start rounded-xl border-transparent bg-transparent px-3 text-sm text-zinc-200 transition-all duration-200 hover:bg-white/[0.05] hover:text-white",
                isOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
              )}
              style={{ transitionDelay: isOpen ? "40ms" : "0ms" }}
            >
              <UserCircle2 className="size-4" />
              Profile
            </Link>

            <Link
              href="/settings"
              onClick={() => setIsOpen(false)}
              tabIndex={isOpen ? 0 : -1}
              className={cn(
                buttonVariants({ variant: "outline" }),
                "h-10 w-full justify-start rounded-xl border-transparent bg-transparent px-3 text-sm text-zinc-200 transition-all duration-200 hover:bg-white/[0.05] hover:text-white",
                isOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
              )}
              style={{ transitionDelay: isOpen ? "80ms" : "0ms" }}
            >
              <Settings2 className="size-4" />
              Settings
            </Link>

            <form action={signOutAction}>
              <Button
                type="submit"
                variant="outline"
                tabIndex={isOpen ? 0 : -1}
                className={cn(
                  "h-10 w-full justify-start rounded-xl border-transparent bg-transparent px-3 text-sm text-zinc-200 transition-all duration-200 hover:bg-white/[0.05] hover:text-white",
                  isOpen ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0",
                )}
                style={{ transitionDelay: isOpen ? "120ms" : "0ms" }}
              >
                <LogOut className="size-4" />
                Sign out
              </Button>
            </form>
          </div>
      </div>
    </div>
  );
}

"use client";

import {
  type ReactNode,
  createContext,
  startTransition,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  Clock3,
  Copy,
  FileText,
  Pencil,
  Pin,
  Star,
  Trash2,
  X,
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { DashboardItemTypeIcon, getDashboardItemTypeColor } from "@/lib/dashboard-icons";
import type { DashboardItemDetailRecord } from "@/lib/db/items";

type SerializedDashboardItemDetailRecord = Omit<
  DashboardItemDetailRecord,
  "createdAt" | "lastAccessedAt" | "updatedAt"
> & {
  createdAt: string;
  lastAccessedAt: string | null;
  updatedAt: string;
};

interface ItemDetailResponseBody {
  error?: string;
  success?: boolean;
  data?: SerializedDashboardItemDetailRecord;
}

interface ItemDrawerContextValue {
  openItem: (itemId: string) => void;
}

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null);

function useItemDrawerContext() {
  const context = useContext(ItemDrawerContext);

  if (!context) {
    throw new Error("Item drawer components must be used within ItemDrawerProvider.");
  }

  return context;
}

export function ItemDrawerProvider({ children }: { children: ReactNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const [detailsById, setDetailsById] = useState<Record<string, SerializedDashboardItemDetailRecord>>(
    {},
  );
  const copyResetTimeoutRef = useRef<number | null>(null);

  const selectedItem = selectedItemId ? detailsById[selectedItemId] ?? null : null;
  const isLoadingSelectedItem = selectedItemId !== null && loadingItemId === selectedItemId;

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  useEffect(() => {
    if (!isOpen || !selectedItemId || detailsById[selectedItemId]) {
      return;
    }

    const itemId = selectedItemId;
    const abortController = new AbortController();

    async function loadItemDetail() {
      setLoadingItemId(itemId);
      setError(null);

      try {
        const response = await fetch(`/api/items/${itemId}`, {
          signal: abortController.signal,
        });
        const responseBody = (await response.json()) as ItemDetailResponseBody;

        if (!response.ok || !responseBody.success || !responseBody.data) {
          throw new Error(responseBody.error ?? "We couldn't load this item right now.");
        }

        setDetailsById((current) => ({
          ...current,
          [itemId]: responseBody.data as SerializedDashboardItemDetailRecord,
        }));
      } catch (caughtError) {
        if (abortController.signal.aborted) {
          return;
        }

        setError(
          caughtError instanceof Error
            ? caughtError.message
            : "We couldn't load this item right now.",
        );
      } finally {
        if (!abortController.signal.aborted) {
          setLoadingItemId((current) => (current === itemId ? null : current));
        }
      }
    }

    void loadItemDetail();

    return () => {
      abortController.abort();
    };
  }, [detailsById, isOpen, selectedItemId]);

  const contextValue = useMemo<ItemDrawerContextValue>(
    () => ({
      openItem(itemId: string) {
        startTransition(() => {
          setSelectedItemId(itemId);
          setLoadingItemId((current) =>
            detailsById[itemId] || current === itemId ? current : itemId,
          );
          setError(null);
          setIsOpen(true);
        });
      },
    }),
    [detailsById],
  );

  function handleRetry() {
    if (!selectedItemId) {
      return;
    }

    setDetailsById((current) => {
      const nextState = { ...current };

      delete nextState[selectedItemId];

      return nextState;
    });
  }

  async function handleCopy() {
    if (!selectedItemId || !selectedItem) {
      return;
    }

    const copyValue = getItemCopyValue(selectedItem);

    if (!copyValue) {
      return;
    }

    try {
      await navigator.clipboard.writeText(copyValue);
      setCopiedItemId(selectedItemId);

      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }

      copyResetTimeoutRef.current = window.setTimeout(() => {
        setCopiedItemId((current) => (current === selectedItemId ? null : current));
      }, 1600);
    } catch {}
  }

  return (
    <ItemDrawerContext.Provider value={contextValue}>
      {children}

      <Sheet
        open={isOpen}
        onOpenChange={(nextOpen) => {
          setIsOpen(nextOpen);

          if (!nextOpen) {
            setError(null);
            setCopiedItemId(null);
          }
        }}
      >
        <SheetContent side="right" className="max-w-[46rem]">
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="border-b border-white/8 px-5 py-5 sm:px-6">
              <div className="flex items-start justify-between gap-4">
                <div className="space-y-1.5">
                  <p className="text-xs font-medium uppercase tracking-[0.26em] text-zinc-500">
                    Item Details
                  </p>
                  <p className="text-sm text-zinc-400">
                    Full item data without leaving the page.
                  </p>
                </div>

                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex size-10 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white"
                >
                  <X className="size-4" />
                  <span className="sr-only">Close item drawer</span>
                </button>
              </div>

              {selectedItem ? (
                <SheetHeader className="mt-5">
                  <div className="flex flex-wrap items-center gap-2">
                    <span
                      className={`inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.05] px-3 py-1.5 text-xs font-medium ${getDashboardItemTypeColor(selectedItem.typeKey)}`}
                    >
                      <DashboardItemTypeIcon typeKey={selectedItem.typeKey} className="size-3.5" />
                      {selectedItem.typeLabel}
                    </span>
                    <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-300">
                      {formatContentModeLabel(selectedItem.contentMode)}
                    </span>
                    <span className="rounded-full border border-white/8 bg-white/[0.03] px-3 py-1.5 text-xs font-medium text-zinc-400">
                      Updated {formatDetailTimestamp(selectedItem.updatedAt)}
                    </span>
                  </div>
                  <SheetTitle className="text-3xl sm:text-[2rem]">{selectedItem.title}</SheetTitle>
                  <SheetDescription className="max-w-3xl text-sm leading-7 text-zinc-300 sm:text-base">
                    {selectedItem.description}
                  </SheetDescription>
                </SheetHeader>
              ) : isLoadingSelectedItem ? (
                <DrawerHeaderSkeleton />
              ) : null}
            </div>

            <div className="border-b border-white/8 px-5 py-4 sm:px-6">
              {selectedItem ? (
                <div className="flex flex-wrap items-center gap-3">
                  <DrawerActionButton
                    icon={Star}
                    label="Favorite"
                    active={selectedItem.isFavorite}
                    activeClassName="border-[#facc15]/30 bg-[#facc15]/10 text-[#facc15]"
                  />
                  <DrawerActionButton
                    icon={Pin}
                    label="Pin"
                    active={selectedItem.isPinned}
                    activeClassName="border-sky-300/30 bg-sky-300/10 text-sky-200"
                  />
                  <DrawerActionButton
                    icon={Copy}
                    label={
                      copiedItemId === selectedItem.id && getItemCopyValue(selectedItem)
                        ? "Copied"
                        : "Copy"
                    }
                    onClick={handleCopy}
                    disabled={!getItemCopyValue(selectedItem)}
                  />
                  <DrawerActionButton icon={Pencil} label="Edit" disabled />
                  <div className="ml-auto">
                    <DrawerActionButton icon={Trash2} label="Delete" danger disabled />
                  </div>
                </div>
              ) : (
                <DrawerActionBarSkeleton />
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              {selectedItem ? (
                <ItemDrawerBody item={selectedItem} />
              ) : isLoadingSelectedItem ? (
                <DrawerBodySkeleton />
              ) : error ? (
                <div className="rounded-[1.75rem] border border-rose-400/20 bg-rose-400/10 p-5">
                  <p className="text-sm font-semibold text-rose-100">We couldn&apos;t load this item.</p>
                  <p className="mt-2 text-sm leading-6 text-rose-100/80">{error}</p>
                  <Button
                    type="button"
                    variant="outline"
                    className="mt-4 h-11 rounded-2xl border-white/10 bg-white/[0.04] px-5 text-zinc-100 hover:bg-white/[0.08]"
                    onClick={handleRetry}
                  >
                    Try again
                  </Button>
                </div>
              ) : (
                <div className="rounded-[1.75rem] border border-white/8 bg-white/[0.03] p-5 text-sm text-zinc-400">
                  Select an item to view its details.
                </div>
              )}
            </div>
          </div>
        </SheetContent>
      </Sheet>
    </ItemDrawerContext.Provider>
  );
}

export function useItemDrawer() {
  return useItemDrawerContext();
}

function ItemDrawerBody({ item }: { item: SerializedDashboardItemDetailRecord }) {
  return (
    <div className="space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        <DetailStat
          label="Type"
          value={item.typeLabel}
          icon={
            <DashboardItemTypeIcon
              typeKey={item.typeKey}
              className={`size-4 ${getDashboardItemTypeColor(item.typeKey)}`}
            />
          }
        />
        <DetailStat label="Content mode" value={formatContentModeLabel(item.contentMode)} />
        <DetailStat label="Language" value={item.language ?? "Not set"} />
        <DetailStat label="Created" value={formatDetailTimestamp(item.createdAt)} />
        <DetailStat
          label="Last opened"
          value={item.lastAccessedAt ? formatDetailTimestamp(item.lastAccessedAt) : "Not tracked yet"}
          icon={<Clock3 className="size-4 text-zinc-400" />}
        />
        <DetailStat label="Updated" value={formatDetailTimestamp(item.updatedAt)} />
      </div>

      <DrawerMetaSection label="Tags">
        {item.tags.length ? (
          <div className="flex flex-wrap gap-2">
            {item.tags.map((tag) => (
              <span
                key={tag.name}
                className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-sm text-zinc-100"
              >
                {tag.name}
              </span>
            ))}
          </div>
        ) : (
          <EmptyMetaCopy label="No tags assigned yet." />
        )}
      </DrawerMetaSection>

      <DrawerMetaSection label="Collections">
        {item.collectionNames.length ? (
          <div className="flex flex-wrap gap-2">
            {item.collectionNames.map((collectionName) => (
              <span
                key={collectionName}
                className="rounded-full border border-white/8 bg-white/[0.04] px-3 py-1.5 text-sm text-zinc-100"
              >
                {collectionName}
              </span>
            ))}
          </div>
        ) : (
          <EmptyMetaCopy label="This item is not attached to a collection yet." />
        )}
      </DrawerMetaSection>

      {item.aiSummary ? (
        <DrawerMetaSection label="AI Summary">
          <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-4 text-sm leading-7 text-zinc-200">
            {item.aiSummary}
          </div>
        </DrawerMetaSection>
      ) : null}

      <DrawerMetaSection label={getPrimaryContentSectionLabel(item.contentMode)}>
        <PrimaryContentCard item={item} />
      </DrawerMetaSection>
    </div>
  );
}

function PrimaryContentCard({ item }: { item: SerializedDashboardItemDetailRecord }) {
  if (item.contentMode === "URL") {
    if (!item.url) {
      return <EmptyMetaCopy label="No URL was saved for this item." />;
    }

    return (
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        className="block rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-4 transition-colors hover:border-white/15 hover:bg-white/[0.06]"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Saved URL</p>
        <p className="mt-3 break-all text-sm leading-7 text-sky-200">{item.url}</p>
      </a>
    );
  }

  if (item.contentMode === "FILE") {
    return (
      <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/8 bg-[#0e1218]">
            <FileText className="size-5 text-zinc-100" />
          </div>
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-semibold text-zinc-50">
              {item.fileName ?? "No file uploaded yet"}
            </p>
            <p className="text-sm text-zinc-300">
              {item.fileMimeType ?? "Unknown file type"}
              {item.fileSizeBytes ? ` • ${formatFileSize(item.fileSizeBytes)}` : ""}
            </p>
            {item.fileUrl ? (
              <a
                href={item.fileUrl}
                target="_blank"
                rel="noreferrer"
                className="inline-flex text-sm font-medium text-sky-200 transition-colors hover:text-sky-100"
              >
                Open file URL
              </a>
            ) : (
              <p className="text-sm text-zinc-500">A file URL has not been saved yet.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!item.content) {
    return <EmptyMetaCopy label="No text content saved for this item yet." />;
  }

  return (
    <div className="overflow-hidden rounded-[1.5rem] border border-white/8 bg-[#05070b]">
      <div className="border-b border-white/8 px-4 py-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
        {item.language ?? "text"}
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-sm leading-7 whitespace-pre-wrap text-zinc-100">
        {item.content}
      </pre>
    </div>
  );
}

function DrawerMetaSection({
  children,
  label,
}: {
  children: ReactNode;
  label: string;
}) {
  return (
    <section className="space-y-3">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">{label}</p>
      {children}
    </section>
  );
}

function DetailStat({
  icon,
  label,
  value,
}: {
  icon?: ReactNode;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-4">
      <div className="flex items-center gap-2 text-xs uppercase tracking-[0.18em] text-zinc-500">
        {icon}
        <span>{label}</span>
      </div>
      <p className="mt-3 text-sm font-medium leading-6 text-zinc-100">{value}</p>
    </div>
  );
}

function EmptyMetaCopy({ label }: { label: string }) {
  return (
    <div className="rounded-[1.5rem] border border-dashed border-white/10 bg-white/[0.025] p-4 text-sm text-zinc-500">
      {label}
    </div>
  );
}

function DrawerActionButton({
  active = false,
  activeClassName,
  danger = false,
  disabled = false,
  icon: Icon,
  label,
  onClick,
}: {
  active?: boolean;
  activeClassName?: string;
  danger?: boolean;
  disabled?: boolean;
  icon: typeof Star;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      className={[
        "inline-flex h-11 items-center gap-2 rounded-2xl border px-4 text-sm font-medium transition-colors",
        "border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]",
        disabled ? "cursor-not-allowed opacity-50 hover:bg-white/[0.04]" : "",
        active && activeClassName ? activeClassName : "",
        danger && !disabled ? "text-rose-200 hover:border-rose-300/30 hover:bg-rose-400/10" : "",
      ].join(" ")}
    >
      <Icon className={`size-4 ${active && Icon === Star ? "fill-current" : ""}`} />
      <span>{label}</span>
    </button>
  );
}

function DrawerHeaderSkeleton() {
  return (
    <div className="mt-5 animate-pulse space-y-3">
      <div className="flex gap-2">
        <div className="h-8 w-28 rounded-full bg-white/[0.08]" />
        <div className="h-8 w-24 rounded-full bg-white/[0.08]" />
        <div className="h-8 w-36 rounded-full bg-white/[0.08]" />
      </div>
      <div className="h-10 w-3/4 rounded-2xl bg-white/[0.08]" />
      <div className="h-4 w-full rounded-full bg-white/[0.08]" />
      <div className="h-4 w-5/6 rounded-full bg-white/[0.08]" />
    </div>
  );
}

function DrawerActionBarSkeleton() {
  return (
    <div className="flex flex-wrap gap-3 animate-pulse">
      <div className="h-11 w-28 rounded-2xl bg-white/[0.08]" />
      <div className="h-11 w-20 rounded-2xl bg-white/[0.08]" />
      <div className="h-11 w-24 rounded-2xl bg-white/[0.08]" />
      <div className="ml-auto h-11 w-24 rounded-2xl bg-white/[0.08]" />
    </div>
  );
}

function DrawerBodySkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      <div className="grid gap-3 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="rounded-[1.5rem] border border-white/8 bg-white/[0.04] p-4">
            <div className="h-3 w-20 rounded-full bg-white/[0.08]" />
            <div className="mt-4 h-5 w-3/4 rounded-full bg-white/[0.08]" />
          </div>
        ))}
      </div>
      <div className="space-y-3">
        <div className="h-3 w-16 rounded-full bg-white/[0.08]" />
        <div className="h-[4.5rem] rounded-[1.5rem] bg-white/[0.05]" />
      </div>
      <div className="space-y-3">
        <div className="h-3 w-20 rounded-full bg-white/[0.08]" />
        <div className="h-48 rounded-[1.5rem] bg-white/[0.05]" />
      </div>
    </div>
  );
}

function getItemCopyValue(item: SerializedDashboardItemDetailRecord) {
  return item.content ?? item.url ?? item.fileUrl ?? item.description ?? item.title;
}

function formatContentModeLabel(contentMode: SerializedDashboardItemDetailRecord["contentMode"]) {
  switch (contentMode) {
    case "TEXT":
      return "Text";
    case "FILE":
      return "File";
    case "URL":
      return "URL";
    default:
      return "Item";
  }
}

function getPrimaryContentSectionLabel(
  contentMode: SerializedDashboardItemDetailRecord["contentMode"],
) {
  switch (contentMode) {
    case "TEXT":
      return "Content";
    case "FILE":
      return "File";
    case "URL":
      return "Link";
    default:
      return "Details";
  }
}

function formatDetailTimestamp(value: string) {
  return new Intl.DateTimeFormat("en-US", {
    month: "short",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
  }).format(new Date(value));
}

function formatFileSize(fileSizeBytes: number) {
  if (fileSizeBytes < 1024) {
    return `${fileSizeBytes} B`;
  }

  if (fileSizeBytes < 1024 * 1024) {
    return `${(fileSizeBytes / 1024).toFixed(1)} KB`;
  }

  return `${(fileSizeBytes / (1024 * 1024)).toFixed(1)} MB`;
}

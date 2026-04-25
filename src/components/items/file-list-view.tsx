"use client";

import {
  Download,
  File,
  FileArchive,
  FileCode,
  FileImage,
  FileSpreadsheet,
  FileText,
  FileType,
  Pin,
  Star,
  type LucideIcon,
} from "lucide-react";
import { createElement, type KeyboardEvent } from "react";

import { useItemDrawer } from "@/components/items/item-drawer-provider";
import type { DashboardItemRecord } from "@/lib/db/items";
import { formatDashboardDate } from "@/lib/date";
import { formatFileSize } from "@/lib/file-size";

interface FileListViewProps {
  items: DashboardItemRecord[];
}

export function FileListView({ items }: FileListViewProps) {
  return (
    <section className="overflow-hidden rounded-[24px] border border-white/10 bg-[#08090c] shadow-[0_16px_48px_rgba(0,0,0,0.2)]">
      <div className="hidden grid-cols-[minmax(0,1fr)_8rem_8rem_3.5rem] gap-4 border-b border-white/8 px-5 py-3 text-xs font-medium uppercase tracking-[0.18em] text-zinc-500 md:grid">
        <span>Name</span>
        <span>Size</span>
        <span>Uploaded</span>
        <span className="sr-only">Download</span>
      </div>

      <div className="divide-y divide-white/8">
        {items.map((item) => (
          <FileListRow key={item.id} item={item} />
        ))}
      </div>
    </section>
  );
}

function FileListRow({ item }: { item: DashboardItemRecord }) {
  const { openItem } = useItemDrawer();
  const displayFileName = item.fileName ?? item.title;
  const extension = getFileExtension(displayFileName);
  const fileIcon = getFileIcon(extension, item.fileMimeType);

  function handleOpen() {
    openItem(item.id);
  }

  function handleKeyDown(event: KeyboardEvent<HTMLDivElement>) {
    if (event.key !== "Enter" && event.key !== " ") {
      return;
    }

    event.preventDefault();
    handleOpen();
  }

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={handleOpen}
      onKeyDown={handleKeyDown}
      className="group grid cursor-pointer grid-cols-[auto_minmax(0,1fr)_auto] gap-3 px-4 py-4 text-left transition-colors duration-200 hover:bg-white/[0.04] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 focus-visible:ring-inset md:grid-cols-[minmax(0,1fr)_8rem_8rem_3.5rem] md:items-center md:gap-4 md:px-5"
    >
      <div className="flex min-w-0 items-start gap-3 md:items-center">
        <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-[#111522] text-zinc-200 transition-colors duration-200 group-hover:bg-[#151a29]">
          {createElement(fileIcon, { className: "size-5" })}
        </div>

        <div className="min-w-0 space-y-1">
          <div className="flex min-w-0 flex-wrap items-center gap-x-2 gap-y-1">
            <h3 className="max-w-full truncate text-sm font-semibold text-zinc-50 transition-colors duration-200 group-hover:text-white sm:text-base">
              {item.title}
            </h3>
            <div className="flex shrink-0 items-center gap-1.5 text-muted-foreground">
              {item.isPinned ? <Pin className="size-3.5 fill-current" /> : null}
              {item.isFavorite ? (
                <Star className="size-3.5 fill-[#facc15] text-[#facc15]" />
              ) : null}
            </div>
          </div>

          <div className="flex min-w-0 flex-col gap-1 text-xs leading-5 text-muted-foreground sm:text-sm md:flex-row md:items-center md:gap-2">
            <span className="truncate">{displayFileName}</span>
            {extension ? (
              <span className="w-fit rounded-full border border-white/8 bg-white/[0.04] px-2 py-0.5 text-[0.7rem] font-medium uppercase tracking-normal text-zinc-300">
                {extension}
              </span>
            ) : null}
          </div>
        </div>
      </div>

      <div className="col-start-2 text-xs text-zinc-400 sm:text-sm md:col-start-auto">
        {formatFileSize(item.fileSizeBytes)}
      </div>

      <div className="col-start-2 text-xs text-zinc-400 sm:text-sm md:col-start-auto">
        {formatDashboardDate(item.createdAt)}
      </div>

      <a
        href={`/api/uploads/${item.id}?download=1`}
        onClick={(event) => event.stopPropagation()}
        onKeyDown={(event) => event.stopPropagation()}
        className="col-start-3 row-span-3 row-start-1 inline-flex size-10 items-center justify-center self-center rounded-xl border border-white/10 bg-white/[0.04] text-zinc-200 transition-colors hover:border-sky-200/30 hover:bg-sky-300/10 hover:text-sky-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70 md:col-start-auto md:row-auto"
        aria-label={`Download ${displayFileName}`}
      >
        <Download className="size-4" />
      </a>
    </div>
  );
}

function getFileExtension(fileName: string) {
  const extension = fileName.split(".").pop();

  if (!extension || extension === fileName) {
    return "";
  }

  return extension.toLowerCase();
}

function getFileIcon(extension: string, mimeType: string | null): LucideIcon {
  if (mimeType?.startsWith("image/")) {
    return FileImage;
  }

  if (mimeType?.includes("spreadsheet") || ["csv", "numbers", "ods", "xls", "xlsx"].includes(extension)) {
    return FileSpreadsheet;
  }

  if (mimeType?.includes("zip") || ["7z", "gz", "rar", "tar", "zip"].includes(extension)) {
    return FileArchive;
  }

  if (["css", "html", "js", "json", "jsx", "mdx", "ts", "tsx", "xml", "yaml", "yml"].includes(extension)) {
    return FileCode;
  }

  if (["doc", "docx", "md", "pdf", "rtf", "txt"].includes(extension)) {
    return FileText;
  }

  if (["otf", "ttf", "woff", "woff2"].includes(extension)) {
    return FileType;
  }

  return File;
}


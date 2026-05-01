"use client";

import { useState, type ReactNode } from "react";
import { Clock3, Download, FileText, ImageIcon } from "lucide-react";
import Image from "next/image";

import { explainCode } from "@/actions/ai";
import { CodeEditor } from "@/components/items/code-editor";
import { MarkdownEditor } from "@/components/items/markdown-editor";
import type { SerializedDashboardItemDetailRecord } from "@/components/items/item-drawer-types";
import {
  formatCollectionSummary,
  formatContentModeLabel,
  formatDetailTimestamp,
  getPrimaryContentSectionLabel,
  isCodeEditorItemType,
  isMarkdownEditorItemType,
} from "@/components/items/item-drawer-utils";
import { DashboardItemTypeIcon, getDashboardItemTypeColor } from "@/lib/dashboard-icons";
import { formatFileSize } from "@/lib/file-size";

export function ItemDrawerBody({
  isPro,
  item,
  onAiExplainError,
}: {
  isPro: boolean;
  item: SerializedDashboardItemDetailRecord;
  onAiExplainError: (message: string) => void;
}) {
  return (
    <div className="flex min-w-0 flex-col gap-4 pb-2">
      <DrawerMetaSection className="min-w-0" label={getPrimaryContentSectionLabel(item.contentMode)}>
        <PrimaryContentCard
          isPro={isPro}
          item={item}
          onAiExplainError={onAiExplainError}
        />
      </DrawerMetaSection>

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

      <ItemDrawerCompactMeta item={item} />

      {item.aiSummary ? (
        <DrawerMetaSection label="AI Summary">
          <div className="max-h-24 overflow-hidden rounded-xl border border-white/8 bg-white/[0.035] p-3 text-sm leading-6 text-zinc-200">
            {item.aiSummary}
          </div>
        </DrawerMetaSection>
      ) : null}

      <ItemDrawerFooterMeta item={item} />
    </div>
  );
}

export function ItemDrawerCompactMeta({ item }: { item: SerializedDashboardItemDetailRecord }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/8 pt-4 text-xs text-zinc-500">
      <span className="inline-flex items-center gap-1.5">
        <DashboardItemTypeIcon
          typeKey={item.typeKey}
          className={`size-3.5 ${getDashboardItemTypeColor(item.typeKey)}`}
        />
        {item.typeLabel}
      </span>
      <span>{formatContentModeLabel(item.contentMode)}</span>
      {item.language ? <span>{item.language}</span> : null}
      <span>{formatCollectionSummary(item.collectionNames)}</span>
    </div>
  );
}

export function ItemDrawerFooterMeta({ item }: { item: SerializedDashboardItemDetailRecord }) {
  return (
    <div className="flex flex-wrap items-center gap-x-4 gap-y-2 border-t border-white/8 pt-4 text-xs leading-5 text-zinc-600">
      <span>Created {formatDetailTimestamp(item.createdAt)}</span>
      <span>Updated {formatDetailTimestamp(item.updatedAt)}</span>
      {item.lastAccessedAt ? (
        <span className="inline-flex items-center gap-1.5">
          <Clock3 className="size-3.5" />
          Last opened {formatDetailTimestamp(item.lastAccessedAt)}
        </span>
      ) : null}
    </div>
  );
}

function ReadonlyMarkdownContent({ value }: { value: string }) {
  return (
    <MarkdownEditor
      heightClassName="h-[clamp(14rem,36dvh,30rem)] min-[1400px]:h-[clamp(16rem,42dvh,34rem)]"
      maxHeight={480}
      minHeight={224}
      readOnly
      value={value}
    />
  );
}

function PrimaryContentCard({
  isPro,
  item,
  onAiExplainError,
}: {
  isPro: boolean;
  item: SerializedDashboardItemDetailRecord;
  onAiExplainError: (message: string) => void;
}) {
  if (item.contentMode === "URL") {
    if (!item.url) {
      return <EmptyMetaCopy label="No URL was saved for this item." />;
    }

    return (
      <a
        href={item.url}
        target="_blank"
        rel="noreferrer"
        className="block rounded-xl border border-white/8 bg-white/[0.035] p-4 transition-colors hover:border-white/15 hover:bg-white/[0.06]"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Saved URL</p>
        <p className="mt-3 break-all text-sm leading-7 text-sky-200">{item.url}</p>
      </a>
    );
  }

  if (item.contentMode === "FILE") {
    const isImage = item.typeKey === "image";

    return (
      <div className="rounded-xl border border-white/8 bg-white/[0.035] p-4">
        {isImage && item.fileName ? (
          <div className="mb-4 overflow-hidden rounded-xl border border-white/8 bg-[#05070b]">
            <Image
              src={`/api/uploads/${item.id}`}
              alt=""
              width={800}
              height={520}
              unoptimized
              className="max-h-[clamp(14rem,36dvh,30rem)] w-full object-contain min-[1400px]:max-h-[clamp(16rem,42dvh,34rem)]"
            />
          </div>
        ) : null}
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-[#0e1218]">
            {isImage ? (
              <ImageIcon className="size-5 text-zinc-100" />
            ) : (
              <FileText className="size-5 text-zinc-100" />
            )}
          </div>
          <div className="min-w-0 space-y-2">
            <p className="text-sm font-semibold text-zinc-50">
              {item.fileName ?? "No file uploaded yet"}
            </p>
            <p className="text-sm text-zinc-300">
              {item.fileMimeType ?? "Unknown file type"}
              {item.fileSizeBytes ? ` - ${formatFileSize(item.fileSizeBytes)}` : ""}
            </p>
            {item.fileName ? (
              <a
                href={`/api/uploads/${item.id}?download=1`}
                className="inline-flex h-9 items-center gap-2 rounded-xl border border-sky-300/20 bg-sky-300/10 px-3 text-sm font-medium text-sky-100 transition-colors hover:border-sky-200/30 hover:bg-sky-300/15"
              >
                <Download className="size-4" />
                Download file
              </a>
            ) : (
              <p className="text-sm text-zinc-500">A file has not been uploaded yet.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  if (!item.content) {
    return <EmptyMetaCopy label="No text content saved for this item yet." />;
  }

  if (isCodeEditorItemType(item.typeKey)) {
    return (
      <ReadonlyCodeContent
        key={`${item.id}:${item.updatedAt}`}
        isPro={isPro}
        item={item}
        onAiExplainError={onAiExplainError}
      />
    );
  }

  if (isMarkdownEditorItemType(item.typeKey)) {
    return <ReadonlyMarkdownContent value={item.content} />;
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/8 bg-[#05070b]">
      <div className="border-b border-white/8 px-4 py-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
        {item.language ?? "text"}
      </div>
      <pre className="devstash-scrollbar max-h-[clamp(14rem,36dvh,30rem)] overflow-auto px-4 py-4 font-mono text-sm leading-7 whitespace-pre-wrap text-zinc-100 min-[1400px]:max-h-[clamp(16rem,42dvh,34rem)]">
        {item.content}
      </pre>
    </div>
  );
}

function ReadonlyCodeContent({
  isPro,
  item,
  onAiExplainError,
}: {
  isPro: boolean;
  item: SerializedDashboardItemDetailRecord;
  onAiExplainError: (message: string) => void;
}) {
  const [explanation, setExplanation] = useState<string | null>(null);
  const [isExplaining, setIsExplaining] = useState(false);

  async function handleExplain() {
    if (isExplaining) {
      return;
    }

    setIsExplaining(true);

    let result: Awaited<ReturnType<typeof explainCode>>;

    try {
      result = await explainCode({
        title: item.title,
        content: item.content,
        itemType: item.typeKey,
        language: item.language,
      });
    } catch {
      result = {
        success: false,
        data: null,
        error: "We couldn't explain this code right now.",
      };
    }

    setIsExplaining(false);

    if (!result.success) {
      onAiExplainError(result.error);
      return;
    }

    setExplanation(result.data.explanation);
  }

  return (
    <CodeEditor
      explanation={explanation}
      explanationHeightClassName="h-[clamp(14rem,36dvh,30rem)] min-[1400px]:h-[clamp(16rem,42dvh,34rem)]"
      height="clamp(14rem, 36dvh, 30rem)"
      isExplaining={isExplaining}
      language={item.language}
      maxHeight={480}
      minHeight={224}
      onExplain={isPro ? handleExplain : undefined}
      onExplainUnavailable={() => onAiExplainError("AI features require Pro subscription.")}
      readOnly
      showExplain
      value={item.content ?? ""}
    />
  );
}

function DrawerMetaSection({
  children,
  className,
  label,
}: {
  children: ReactNode;
  className?: string;
  label: string;
}) {
  return (
    <section className={["space-y-2.5", className ?? ""].join(" ")}>
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">{label}</p>
      {children}
    </section>
  );
}

function EmptyMetaCopy({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.025] p-3 text-sm text-zinc-500">
      {label}
    </div>
  );
}

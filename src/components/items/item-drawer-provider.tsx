"use client";

import {
  type ReactNode,
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from "react";
import {
  AlertTriangle,
  Clock3,
  Copy,
  FileText,
  LoaderCircle,
  type LucideIcon,
  Pencil,
  Pin,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { deleteItem, updateItem } from "@/actions/items";
import { CodeEditor } from "@/components/items/code-editor";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Button } from "@/components/ui/button";
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from "@/components/ui/sheet";
import { SuccessToast } from "@/components/ui/success-toast";
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

interface EditItemFormState {
  title: string;
  description: string;
  tags: string;
  content: string;
  language: string;
  url: string;
}

interface ItemDrawerToastState {
  message: string;
  title: string;
  variant: "error" | "success";
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
  const router = useRouter();
  const [isOpen, setIsOpen] = useState(false);
  const [selectedItemId, setSelectedItemId] = useState<string | null>(null);
  const [loadingItemId, setLoadingItemId] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);
  const [toastState, setToastState] = useState<ItemDrawerToastState | null>(null);
  const [editFormState, setEditFormState] = useState<EditItemFormState | null>(null);
  const [detailsById, setDetailsById] = useState<Record<string, SerializedDashboardItemDetailRecord>>(
    {},
  );
  const copyResetTimeoutRef = useRef<number | null>(null);

  const selectedItem = selectedItemId ? detailsById[selectedItemId] ?? null : null;
  const isLoadingSelectedItem = selectedItemId !== null && loadingItemId === selectedItemId;

  const handleSheetOpenChange = useCallback((nextOpen: boolean) => {
    setIsOpen(nextOpen);

    if (!nextOpen) {
      setError(null);
      setCopiedItemId(null);
      setEditError(null);
      setIsEditing(false);
      setIsDeleteDialogOpen(false);
    }
  }, []);

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

  useEffect(() => {
    if (!selectedItem) {
      setEditFormState(null);
      setIsEditing(false);
      setEditError(null);
      return;
    }

    setEditFormState(createEditItemFormState(selectedItem));
    setIsEditing(false);
    setEditError(null);
    setIsDeleteDialogOpen(false);
  }, [selectedItem]);

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
        onOpenChange={handleSheetOpenChange}
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
                  <div className="flex items-center gap-3">
                    <span className="flex size-11 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                      <DashboardItemTypeIcon
                        typeKey={selectedItem.typeKey}
                        className={`size-5 ${getDashboardItemTypeColor(selectedItem.typeKey)}`}
                      />
                    </span>
                    <SheetTitle className="text-3xl sm:text-[2rem]">
                      {selectedItem.title}
                    </SheetTitle>
                  </div>
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
                isEditing ? (
                  <div className="flex flex-wrap items-center gap-3">
                    <DrawerActionButton
                      icon={Save}
                      label={isSaving ? "Saving" : "Save"}
                      onClick={handleSave}
                      disabled={isSaving || !editFormState?.title.trim()}
                    />
                    <DrawerActionButton
                      icon={X}
                      label="Cancel"
                      onClick={handleCancelEdit}
                      disabled={isSaving}
                    />
                  </div>
                ) : (
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
                    <DrawerActionButton icon={Pencil} label="Edit" onClick={handleEdit} />
                    <div className="ml-auto">
                      <DrawerActionButton
                        icon={Trash2}
                        label="Delete"
                        onClick={() => setIsDeleteDialogOpen(true)}
                        danger
                      />
                    </div>
                  </div>
                )
              ) : (
                <DrawerActionBarSkeleton />
              )}
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              {selectedItem && isEditing && editFormState ? (
                <ItemDrawerEditBody
                  editError={editError}
                  formState={editFormState}
                  item={selectedItem}
                  onChange={updateEditFormField}
                />
              ) : selectedItem ? (
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

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!isDeleting) {
            setIsDeleteDialogOpen(nextOpen);
          }
        }}
      >
        <AlertDialogContent>
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-400/12 text-rose-200">
              <AlertTriangle className="size-5" />
            </div>

            <AlertDialogHeader>
              <AlertDialogTitle>Delete item?</AlertDialogTitle>
              <AlertDialogDescription>
                {selectedItem
                  ? `This will permanently delete "${selectedItem.title}" from your stash. This action cannot be undone.`
                  : "This will permanently delete the selected item. This action cannot be undone."}
              </AlertDialogDescription>
            </AlertDialogHeader>
          </div>

          <AlertDialogFooter>
            <AlertDialogCancel disabled={isDeleting}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleDelete} disabled={isDeleting}>
              {isDeleting ? (
                <LoaderCircle className="size-4 animate-spin" />
              ) : (
                <Trash2 className="size-4" />
              )}
              Delete item
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {toastState ? (
        <SuccessToast
          message={toastState.message}
          onDone={() => setToastState(null)}
          title={toastState.title}
          variant={toastState.variant}
        />
      ) : null}
    </ItemDrawerContext.Provider>
  );

  function handleEdit() {
    if (!selectedItem) {
      return;
    }

    setEditFormState(createEditItemFormState(selectedItem));
    setEditError(null);
    setIsEditing(true);
  }

  function handleCancelEdit() {
    if (selectedItem) {
      setEditFormState(createEditItemFormState(selectedItem));
    }

    setEditError(null);
    setIsEditing(false);
  }

  function updateEditFormField(field: keyof EditItemFormState, value: string) {
    setEditFormState((current) =>
      current
        ? {
            ...current,
            [field]: value,
          }
        : current,
    );
    setEditError(null);
  }

  async function handleSave() {
    if (!selectedItem || !editFormState || isSaving) {
      return;
    }

    setIsSaving(true);
    setEditError(null);

    let result: Awaited<ReturnType<typeof updateItem>>;

    try {
      result = await updateItem(selectedItem.id, {
        title: editFormState.title,
        description: editFormState.description,
        content: editFormState.content,
        language: editFormState.language,
        url: editFormState.url,
        tags: parseTagsInput(editFormState.tags),
      });
    } catch {
      const message = "We couldn't save this item right now.";

      setEditError(message);
      setToastState({
        message,
        title: "Save failed",
        variant: "error",
      });
      setIsSaving(false);
      return;
    }

    setIsSaving(false);

    if (!result.success) {
      setEditError(result.error);
      setToastState({
        message: result.error,
        title: "Save failed",
        variant: "error",
      });
      return;
    }

    setDetailsById((current) => ({
      ...current,
      [result.data.id]: result.data,
    }));
    setEditFormState(createEditItemFormState(result.data));
    setIsEditing(false);
    setToastState({
      message: "Item updated.",
      title: "Saved",
      variant: "success",
    });
    router.refresh();
  }

  async function handleDelete() {
    if (!selectedItem || isDeleting) {
      return;
    }

    setIsDeleting(true);

    let result: Awaited<ReturnType<typeof deleteItem>>;

    try {
      result = await deleteItem(selectedItem.id);
    } catch {
      const message = "We couldn't delete this item right now.";

      setToastState({
        message,
        title: "Delete failed",
        variant: "error",
      });
      setIsDeleting(false);
      return;
    }

    if (!result.success) {
      setToastState({
        message: result.error,
        title: "Delete failed",
        variant: "error",
      });
      setIsDeleting(false);
      return;
    }

    setDetailsById((current) => {
      const nextState = { ...current };

      delete nextState[result.data.id];

      return nextState;
    });
    setSelectedItemId(null);
    setIsEditing(false);
    setIsOpen(false);
    setIsDeleteDialogOpen(false);
    setIsDeleting(false);
    setToastState({
      message: "Item deleted.",
      title: "Deleted",
      variant: "success",
    });
    router.refresh();
  }
}

export function useItemDrawer() {
  return useItemDrawerContext();
}

function ItemDrawerBody({ item }: { item: SerializedDashboardItemDetailRecord }) {
  return (
    <div className="space-y-6">
      <DrawerMetaSection label={getPrimaryContentSectionLabel(item.contentMode)}>
        <PrimaryContentCard item={item} />
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
          <div className="rounded-xl border border-white/8 bg-white/[0.035] p-4 text-sm leading-7 text-zinc-200">
            {item.aiSummary}
          </div>
        </DrawerMetaSection>
      ) : null}

      <ItemDrawerFooterMeta item={item} />
    </div>
  );
}

function ItemDrawerEditBody({
  editError,
  formState,
  item,
  onChange,
}: {
  editError: string | null;
  formState: EditItemFormState;
  item: SerializedDashboardItemDetailRecord;
  onChange: (field: keyof EditItemFormState, value: string) => void;
}) {
  const showContentField = ["command", "note", "prompt", "snippet"].includes(item.typeKey);
  const showCodeEditor = isCodeEditorItemType(item.typeKey);
  const showLanguageField = ["command", "snippet"].includes(item.typeKey);
  const showUrlField = item.typeKey === "link";

  return (
    <div className="space-y-6">
      {editError ? (
        <div className="rounded-[1.5rem] border border-rose-400/20 bg-rose-400/10 p-4 text-sm leading-6 text-rose-100">
          {editError}
        </div>
      ) : null}

      <div className="grid gap-4">
        <EditTextField
          label="Title"
          required
          value={formState.title}
          onChange={(value) => onChange("title", value)}
        />
        <EditTextareaField
          label="Description"
          value={formState.description}
          onChange={(value) => onChange("description", value)}
        />
      </div>

      {showLanguageField ? (
        <EditTextField
          label="Language"
          value={formState.language}
          onChange={(value) => onChange("language", value)}
        />
      ) : null}

      {showUrlField ? (
        <EditTextField
          label="URL"
          value={formState.url}
          onChange={(value) => onChange("url", value)}
        />
      ) : null}

      {showContentField ? (
        showCodeEditor ? (
          <EditCodeField
            label="Content"
            language={formState.language}
            value={formState.content}
            onChange={(value) => onChange("content", value)}
          />
        ) : (
          <EditTextareaField
            label="Content"
            minHeightClassName="min-h-64"
            value={formState.content}
            onChange={(value) => onChange("content", value)}
          />
        )
      ) : null}

      <EditTextField
        label="Tags"
        value={formState.tags}
        onChange={(value) => onChange("tags", value)}
      />

      <ItemDrawerCompactMeta item={item} />
      <ItemDrawerFooterMeta item={item} />
    </div>
  );
}

function EditTextField({
  label,
  onChange,
  required = false,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
        {label}
        {required ? <span className="text-rose-300"> *</span> : null}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-sky-300/35 focus:bg-white/[0.06]"
      />
    </label>
  );
}

function EditTextareaField({
  label,
  minHeightClassName = "min-h-32",
  onChange,
  value,
}: {
  label: string;
  minHeightClassName?: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${minHeightClassName} w-full resize-y rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-sky-300/35 focus:bg-white/[0.06]`}
      />
    </label>
  );
}

function EditCodeField({
  label,
  language,
  onChange,
  value,
}: {
  label: string;
  language: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">{label}</p>
      <CodeEditor
        language={language}
        maxHeight={400}
        minHeight={260}
        value={value}
        onChange={onChange}
      />
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
        className="block rounded-xl border border-white/8 bg-white/[0.035] p-4 transition-colors hover:border-white/15 hover:bg-white/[0.06]"
      >
        <p className="text-xs uppercase tracking-[0.2em] text-zinc-500">Saved URL</p>
        <p className="mt-3 break-all text-sm leading-7 text-sky-200">{item.url}</p>
      </a>
    );
  }

  if (item.contentMode === "FILE") {
    return (
      <div className="rounded-xl border border-white/8 bg-white/[0.035] p-4">
        <div className="flex items-start gap-3">
          <div className="flex size-11 shrink-0 items-center justify-center rounded-xl border border-white/8 bg-[#0e1218]">
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

  if (isCodeEditorItemType(item.typeKey)) {
    return (
      <CodeEditor
        language={item.language}
        maxHeight={400}
        minHeight={220}
        readOnly
        value={item.content}
      />
    );
  }

  return (
    <div className="overflow-hidden rounded-xl border border-white/8 bg-[#05070b]">
      <div className="border-b border-white/8 px-4 py-3 text-xs uppercase tracking-[0.2em] text-zinc-500">
        {item.language ?? "text"}
      </div>
      <pre className="overflow-x-auto px-4 py-4 font-mono text-sm leading-7 whitespace-pre-wrap text-zinc-100">
        {item.content}
      </pre>
    </div>
  );
}

function ItemDrawerCompactMeta({ item }: { item: SerializedDashboardItemDetailRecord }) {
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

function ItemDrawerFooterMeta({ item }: { item: SerializedDashboardItemDetailRecord }) {
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

function EmptyMetaCopy({ label }: { label: string }) {
  return (
    <div className="rounded-xl border border-dashed border-white/10 bg-white/[0.025] p-4 text-sm text-zinc-500">
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
  icon: LucideIcon;
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

function isCodeEditorItemType(typeKey: string) {
  return typeKey === "command" || typeKey === "snippet";
}

function createEditItemFormState(
  item: SerializedDashboardItemDetailRecord,
): EditItemFormState {
  return {
    title: item.title,
    description: item.description === "No description yet." ? "" : item.description,
    tags: item.tags.map((tag) => tag.name).join(", "),
    content: item.content ?? "",
    language: item.language ?? "",
    url: item.url ?? "",
  };
}

function parseTagsInput(value: string) {
  return [
    ...new Set(
      value
        .split(",")
        .map((tag) => tag.trim())
        .filter(Boolean),
    ),
  ];
}

function formatCollectionSummary(collectionNames: string[]) {
  if (!collectionNames.length) {
    return "None";
  }

  return collectionNames.join(", ");
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

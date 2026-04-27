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
  Copy,
  LoaderCircle,
  Pencil,
  Pin,
  Save,
  Star,
  Trash2,
  X,
} from "lucide-react";
import { useRouter } from "next/navigation";

import { deleteItem, toggleItemFavorite, toggleItemPin, updateItem } from "@/actions/items";
import type { CollectionOption } from "@/components/items/collection-multi-select";
import { ItemDrawerEditBody } from "@/components/items/item-drawer-edit-form";
import {
  DrawerActionBarSkeleton,
  DrawerActionButton,
  DrawerBodySkeleton,
  DrawerHeaderSkeleton,
} from "@/components/items/item-drawer-parts";
import { ItemDrawerBody } from "@/components/items/item-drawer-readonly-content";
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
import type {
  EditItemFormState,
  ItemDrawerToastState,
  SerializedDashboardItemDetailRecord,
} from "@/components/items/item-drawer-types";
import {
  createEditItemFormState,
  formatContentModeLabel,
  formatDetailTimestamp,
  getItemCopyValue,
  parseTagsInput,
} from "@/components/items/item-drawer-utils";

interface ItemDetailResponseBody {
  error?: string;
  success?: boolean;
  data?: SerializedDashboardItemDetailRecord;
}

interface ItemDrawerContextValue {
  openItem: (itemId: string) => void;
}

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null);
type EditItemTextField = Exclude<keyof EditItemFormState, "collectionIds">;

function useItemDrawerContext() {
  const context = useContext(ItemDrawerContext);

  if (!context) {
    throw new Error("Item drawer components must be used within ItemDrawerProvider.");
  }

  return context;
}

export function ItemDrawerProvider({
  children,
  collectionOptions,
}: {
  children: ReactNode;
  collectionOptions: CollectionOption[];
}) {
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
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isTogglingPin, setIsTogglingPin] = useState(false);
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
                      icon={isTogglingFavorite ? LoaderCircle : Star}
                      label={
                        isTogglingFavorite
                          ? "Saving"
                          : selectedItem.isFavorite
                            ? "Favorited"
                            : "Favorite"
                      }
                      onClick={handleFavoriteToggle}
                      disabled={isTogglingFavorite}
                      active={selectedItem.isFavorite}
                      activeClassName="border-[#facc15]/30 bg-[#facc15]/10 text-[#facc15]"
                    />
                    <DrawerActionButton
                      icon={isTogglingPin ? LoaderCircle : Pin}
                      label={
                        isTogglingPin
                          ? "Saving"
                          : selectedItem.isPinned
                            ? "Pinned"
                            : "Pin"
                      }
                      onClick={handlePinToggle}
                      disabled={isTogglingPin}
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

            <div className="devstash-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-5 sm:px-6 sm:py-6">
              {selectedItem && isEditing && editFormState ? (
                <ItemDrawerEditBody
                  collectionOptions={collectionOptions}
                  editError={editError}
                  formState={editFormState}
                  item={selectedItem}
                  onCollectionIdsChange={updateEditCollectionIds}
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

  function updateEditFormField(field: EditItemTextField, value: string) {
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

  function updateEditCollectionIds(collectionIds: string[]) {
    setEditFormState((current) =>
      current
        ? {
            ...current,
            collectionIds,
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
        collectionIds: editFormState.collectionIds,
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

  async function handleFavoriteToggle() {
    if (!selectedItem || isTogglingFavorite) {
      return;
    }

    setIsTogglingFavorite(true);

    let result: Awaited<ReturnType<typeof toggleItemFavorite>>;

    try {
      result = await toggleItemFavorite(selectedItem.id);
    } catch {
      const message = "We couldn't update this favorite right now.";

      setToastState({
        message,
        title: "Favorite failed",
        variant: "error",
      });
      setIsTogglingFavorite(false);
      return;
    }

    setIsTogglingFavorite(false);

    if (!result.success) {
      setToastState({
        message: result.error,
        title: "Favorite failed",
        variant: "error",
      });
      return;
    }

    setDetailsById((current) => ({
      ...current,
      [result.data.id]: result.data,
    }));
    setToastState({
      message: result.data.isFavorite
        ? "Item added to favorites."
        : "Item removed from favorites.",
      title: result.data.isFavorite ? "Favorited" : "Unfavorited",
      variant: "success",
    });
    router.refresh();
  }

  async function handlePinToggle() {
    if (!selectedItem || isTogglingPin) {
      return;
    }

    const itemBeforeToggle = selectedItem;

    setIsTogglingPin(true);
    setDetailsById((current) => ({
      ...current,
      [itemBeforeToggle.id]: {
        ...itemBeforeToggle,
        isPinned: !itemBeforeToggle.isPinned,
      },
    }));

    let result: Awaited<ReturnType<typeof toggleItemPin>>;

    try {
      result = await toggleItemPin(itemBeforeToggle.id);
    } catch {
      const message = "We couldn't update this pin right now.";

      setDetailsById((current) => ({
        ...current,
        [itemBeforeToggle.id]: itemBeforeToggle,
      }));
      setToastState({
        message,
        title: "Pin failed",
        variant: "error",
      });
      setIsTogglingPin(false);
      return;
    }

    setIsTogglingPin(false);

    if (!result.success) {
      setDetailsById((current) => ({
        ...current,
        [itemBeforeToggle.id]: itemBeforeToggle,
      }));
      setToastState({
        message: result.error,
        title: "Pin failed",
        variant: "error",
      });
      return;
    }

    setDetailsById((current) => ({
      ...current,
      [result.data.id]: result.data,
    }));
    setToastState({
      message: result.data.isPinned
        ? "Item pinned to the top of listings."
        : "Item removed from pinned items.",
      title: result.data.isPinned ? "Pinned" : "Unpinned",
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


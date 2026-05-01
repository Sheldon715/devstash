"use client";

import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
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
const DRAWER_WIDTH_MIN = 520;
const DRAWER_WIDTH_MAX = 1248;
const DRAWER_WIDTH_KEYBOARD_STEP = 48;
const ITEM_DRAWER_OPEN_EVENT = "devstash:item-drawer-open";

function useItemDrawerContext() {
  const context = useContext(ItemDrawerContext);

  if (context) {
    return context;
  }

  return {
    openItem(itemId: string) {
      if (typeof window === "undefined") {
        return;
      }

      window.dispatchEvent(
        new CustomEvent<string>(ITEM_DRAWER_OPEN_EVENT, {
          detail: itemId,
        }),
      );
    },
  };
}

export function ItemDrawerProvider({
  children,
  collectionOptions,
  isPro,
}: {
  children: ReactNode;
  collectionOptions: CollectionOption[];
  isPro: boolean;
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
  const [isResizingDrawer, setIsResizingDrawer] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState<number | null>(null);
  const [editError, setEditError] = useState<string | null>(null);
  const [toastState, setToastState] = useState<ItemDrawerToastState | null>(null);
  const [editFormState, setEditFormState] = useState<EditItemFormState | null>(null);
  const [detailsById, setDetailsById] = useState<Record<string, SerializedDashboardItemDetailRecord>>(
    {},
  );
  const copyResetTimeoutRef = useRef<number | null>(null);

  const selectedItem = selectedItemId ? detailsById[selectedItemId] ?? null : null;
  const isLoadingSelectedItem = selectedItemId !== null && loadingItemId === selectedItemId;
  const drawerWidthValue = drawerWidth ?? 896;

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

  const openItemDetail = useCallback((itemId: string) => {
    startTransition(() => {
      setSelectedItemId(itemId);
      setLoadingItemId((current) =>
        detailsById[itemId] || current === itemId ? current : itemId,
      );
      setError(null);
      setIsOpen(true);
    });
  }, [detailsById]);

  const contextValue = useMemo<ItemDrawerContextValue>(
    () => ({
      openItem(itemId: string) {
        openItemDetail(itemId);
      },
    }),
    [openItemDetail],
  );

  useEffect(() => {
    function handleGlobalOpen(event: Event) {
      if (!(event instanceof CustomEvent) || typeof event.detail !== "string") {
        return;
      }

      openItemDetail(event.detail);
    }

    window.addEventListener(ITEM_DRAWER_OPEN_EVENT, handleGlobalOpen);

    return () => {
      window.removeEventListener(ITEM_DRAWER_OPEN_EVENT, handleGlobalOpen);
    };
  }, [openItemDetail]);

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

  function getDrawerWidthBounds() {
    const viewportWidth = window.innerWidth;
    const minWidth = Math.min(DRAWER_WIDTH_MIN, viewportWidth);
    const maxWidth = Math.max(
      minWidth,
      Math.min(DRAWER_WIDTH_MAX, Math.max(minWidth, viewportWidth - 24)),
    );

    return { maxWidth, minWidth };
  }

  function applyDrawerWidth(nextWidth: number) {
    const { maxWidth, minWidth } = getDrawerWidthBounds();
    const clampedWidth = Math.min(maxWidth, Math.max(minWidth, nextWidth));

    document.documentElement.style.setProperty("--item-drawer-width", `${clampedWidth}px`);
    setDrawerWidth(clampedWidth);
  }

  function handleDrawerResizePointerDown(event: ReactPointerEvent<HTMLDivElement>) {
    if (window.innerWidth < 640) {
      return;
    }

    event.preventDefault();
    setIsResizingDrawer(true);

    const previousCursor = document.body.style.cursor;
    const previousUserSelect = document.body.style.userSelect;

    document.body.style.cursor = "ew-resize";
    document.body.style.userSelect = "none";

    function handlePointerMove(pointerEvent: PointerEvent) {
      applyDrawerWidth(window.innerWidth - pointerEvent.clientX);
    }

    function handlePointerUp() {
      setIsResizingDrawer(false);
      document.body.style.cursor = previousCursor;
      document.body.style.userSelect = previousUserSelect;
      window.removeEventListener("pointermove", handlePointerMove);
      window.removeEventListener("pointerup", handlePointerUp);
      window.removeEventListener("pointercancel", handlePointerUp);
    }

    window.addEventListener("pointermove", handlePointerMove);
    window.addEventListener("pointerup", handlePointerUp);
    window.addEventListener("pointercancel", handlePointerUp);
  }

  function handleDrawerResizeKeyDown(event: ReactKeyboardEvent<HTMLDivElement>) {
    if (event.key !== "ArrowLeft" && event.key !== "ArrowRight" && event.key !== "Home") {
      return;
    }

    event.preventDefault();

    if (event.key === "Home") {
      document.documentElement.style.removeProperty("--item-drawer-width");
      setDrawerWidth(null);
      return;
    }

    const currentWidth = drawerWidth ?? Math.min(window.innerWidth * 0.92, 896);
    const direction = event.key === "ArrowLeft" ? 1 : -1;

    applyDrawerWidth(currentWidth + direction * DRAWER_WIDTH_KEYBOARD_STEP);
  }

  return (
    <ItemDrawerContext.Provider value={contextValue}>
      {children}

      <Sheet
        open={isOpen}
        onOpenChange={handleSheetOpenChange}
      >
        <SheetContent
          side="right"
          className="max-w-none sm:w-[var(--item-drawer-width,min(92vw,56rem))]"
        >
          <div
            aria-label="Resize item drawer"
            aria-orientation="vertical"
            aria-valuemax={DRAWER_WIDTH_MAX}
            aria-valuemin={DRAWER_WIDTH_MIN}
            aria-valuenow={drawerWidthValue}
            role="separator"
            tabIndex={0}
            title="Drag to resize drawer"
            onKeyDown={handleDrawerResizeKeyDown}
            onPointerDown={handleDrawerResizePointerDown}
            className={[
              "absolute left-0 top-0 z-10 hidden h-full w-3 -translate-x-1/2 cursor-ew-resize touch-none items-center justify-center outline-none sm:flex",
              "after:h-16 after:w-1 after:rounded-full after:bg-white/12 after:opacity-0 after:transition-opacity hover:after:opacity-100 focus-visible:after:opacity-100",
              isResizingDrawer ? "after:opacity-100" : "",
            ].join(" ")}
          />
          <div className="flex min-h-0 flex-1 flex-col">
            <div className="relative border-b border-white/8 px-4 py-4 pr-14 sm:px-5 sm:py-5 sm:pr-16">
              <div className="absolute right-4 top-4 sm:right-5 sm:top-5">
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="inline-flex size-9 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04] text-zinc-300 transition-colors hover:bg-white/[0.08] hover:text-white"
                >
                  <X className="size-4" />
                  <span className="sr-only">Close item drawer</span>
                </button>
              </div>

              {selectedItem ? (
                <SheetHeader className="space-y-3">
                  <div className="flex items-start gap-3">
                    <span className="flex size-10 shrink-0 items-center justify-center rounded-2xl border border-white/10 bg-white/[0.04]">
                      <DashboardItemTypeIcon
                        typeKey={selectedItem.typeKey}
                        className={`size-5 ${getDashboardItemTypeColor(selectedItem.typeKey)}`}
                      />
                    </span>
                    <div className="min-w-0 space-y-2 pt-1">
                      <SheetTitle className="flex flex-wrap items-center gap-x-3 gap-y-2 text-xl leading-tight sm:text-2xl">
                        {selectedItem.title}
                        <span
                          className={`inline-flex shrink-0 items-center rounded-full border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-medium ${getDashboardItemTypeColor(selectedItem.typeKey)}`}
                        >
                          {selectedItem.typeLabel}
                        </span>
                      </SheetTitle>
                    </div>
                  </div>
                  <SheetDescription className="max-w-3xl text-sm leading-6 text-zinc-300 max-[480px]:truncate">
                    {selectedItem.description}
                  </SheetDescription>
                </SheetHeader>
              ) : isLoadingSelectedItem ? (
                <DrawerHeaderSkeleton />
              ) : null}
            </div>

            <div className="border-b border-white/8 px-4 py-3 sm:px-5">
              {selectedItem ? (
                isEditing ? (
                  <div className="flex flex-wrap items-center gap-2">
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
                  <div className="flex flex-wrap items-center gap-2">
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

            <div
              className={[
                "min-h-0 flex-1 px-4 py-4 sm:px-5",
                selectedItem ? "devstash-scrollbar overflow-y-auto" : "overflow-hidden",
              ].join(" ")}
            >
              {selectedItem && isEditing && editFormState ? (
                <ItemDrawerEditBody
                  collectionOptions={collectionOptions}
                  disabled={isSaving}
                  editError={editError}
                  formState={editFormState}
                  isPro={isPro}
                  item={selectedItem}
                  onAcceptSuggestedTag={handleAcceptSuggestedTag}
                  onAiDescriptionError={handleAiDescriptionError}
                  onAiTagError={handleAiTagError}
                  onCollectionIdsChange={updateEditCollectionIds}
                  onChange={updateEditFormField}
                  onGeneratedDescription={handleGeneratedDescription}
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

  function handleAiTagError(message: string) {
    setToastState({
      message,
      title: "Tag suggestions failed",
      variant: "error",
    });
  }

  function handleAiDescriptionError(message: string) {
    setToastState({
      message,
      title: "Description failed",
      variant: "error",
    });
  }

  function handleGeneratedDescription(description: string) {
    setEditFormState((current) =>
      current
        ? {
            ...current,
            description,
          }
        : current,
    );
    setEditError(null);
  }

  function handleAcceptSuggestedTag(tag: string) {
    setEditFormState((current) => {
      if (!current) {
        return current;
      }

      const currentTags = parseTagsInput(current.tags);

      if (currentTags.includes(tag)) {
        return current;
      }

      return {
        ...current,
        tags: [...currentTags, tag].join(", "),
      };
    });
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


"use client";

import {
  type ReactNode,
  createContext,
  startTransition,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { useRouter } from "next/navigation";

import { deleteItem, toggleItemFavorite, toggleItemPin, updateItem } from "@/actions/items";
import type { CollectionOption } from "@/components/items/collection-multi-select";
import { useCopiedItem, useDrawerResize, useEditItemForm } from "@/components/items/item-drawer-hooks";
import { ItemDrawerPanel } from "@/components/items/item-drawer-panel";
import type {
  ItemDrawerToastState,
  SerializedDashboardItemDetailRecord,
} from "@/components/items/item-drawer-types";
import { createEditItemFormState, parseTagsInput } from "@/components/items/item-drawer-utils";
import { Sheet } from "@/components/ui/sheet";
import { useToastState } from "@/components/ui/use-toast-state";

interface ItemDetailResponseBody {
  error?: string;
  success?: boolean;
  data?: SerializedDashboardItemDetailRecord;
}

interface ItemDrawerContextValue {
  openItem: (itemId: string) => void;
}

const ItemDrawerContext = createContext<ItemDrawerContextValue | null>(null);
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
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleteDialogOpen, setIsDeleteDialogOpen] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [isTogglingPin, setIsTogglingPin] = useState(false);
  const [detailsById, setDetailsById] = useState<Record<string, SerializedDashboardItemDetailRecord>>(
    {},
  );
  const { copiedItemId, copyItem, resetCopiedItem } = useCopiedItem();
  const {
    drawerWidthValue,
    handleDrawerResizeKeyDown,
    handleDrawerResizePointerDown,
    isResizingDrawer,
  } = useDrawerResize();
  const { clearToast, setToastState, toastState } = useToastState();

  const selectedItem = selectedItemId ? detailsById[selectedItemId] ?? null : null;
  const isLoadingSelectedItem = selectedItemId !== null && loadingItemId === selectedItemId;
  const {
    editError,
    editFormState,
    handleAcceptSuggestedTag,
    handleCancelEdit,
    handleEdit,
    handleGeneratedDescription,
    isEditing,
    setEditError,
    setEditFormState,
    setIsEditing,
    updateEditCollectionIds,
    updateEditFormField,
  } = useEditItemForm(selectedItem);

  const showToast = useCallback((nextToast: ItemDrawerToastState) => {
    setToastState(nextToast);
  }, [setToastState]);

  const handleSheetOpenChange = useCallback((nextOpen: boolean) => {
    setIsOpen(nextOpen);

    if (!nextOpen) {
      setError(null);
      resetCopiedItem();
      setEditError(null);
      setIsEditing(null);
      setIsDeleteDialogOpen(false);
    }
  }, [resetCopiedItem, setEditError, setIsEditing]);

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
      setIsDeleteDialogOpen(false);
    }
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

  const handleRetry = useCallback(() => {
    if (!selectedItemId) {
      return;
    }

    setDetailsById((current) => {
      const nextState = { ...current };

      delete nextState[selectedItemId];

      return nextState;
    });
  }, [selectedItemId]);

  const handleCopy = useCallback(async () => {
    await copyItem(selectedItem);
  }, [copyItem, selectedItem]);

  function handleAiTagError(message: string) {
    showToast({
      message,
      title: "Tag suggestions failed",
      variant: "error",
    });
  }

  function handleAiDescriptionError(message: string) {
    showToast({
      message,
      title: "Description failed",
      variant: "error",
    });
  }

  function handleAiPromptError(message: string) {
    showToast({
      message,
      title: "Prompt optimization failed",
      variant: "error",
    });
  }

  function handleAiExplainError(message: string) {
    showToast({
      message,
      title: "Explain failed",
      variant: "error",
    });
  }

  function handleAiItemUpdated(item: SerializedDashboardItemDetailRecord) {
    setDetailsById((current) => ({
      ...current,
      [item.id]: item,
    }));
    setEditFormState(createEditItemFormState(item));
    showToast({
      message: "Prompt updated.",
      title: "Saved",
      variant: "success",
    });
    router.refresh();
  }

  async function handleAcceptOptimizedPromptFromEdit(optimizedPrompt: string) {
    if (!selectedItem || !editFormState) {
      return;
    }

    const nextFormState = {
      ...editFormState,
      content: optimizedPrompt,
    };

    setEditError(null);
    setEditFormState(nextFormState);

    let result: Awaited<ReturnType<typeof updateItem>>;

    try {
      result = await updateItem(selectedItem.id, {
        title: nextFormState.title,
        description: nextFormState.description,
        content: nextFormState.content,
        language: nextFormState.language,
        url: nextFormState.url,
        tags: parseTagsInput(nextFormState.tags),
        collectionIds: nextFormState.collectionIds,
      });
    } catch {
      const message = "We couldn't save the optimized prompt right now.";

      setEditError(message);
      showToast({
        message,
        title: "Prompt update failed",
        variant: "error",
      });
      throw new Error(message);
    }

    if (!result.success) {
      setEditError(result.error);
      showToast({
        message: result.error,
        title: "Prompt update failed",
        variant: "error",
      });
      throw new Error(result.error);
    }

    setDetailsById((current) => ({
      ...current,
      [result.data.id]: result.data,
    }));
    setEditFormState(createEditItemFormState(result.data));
    setIsEditing(null);
    showToast({
      message: "Prompt updated.",
      title: "Saved",
      variant: "success",
    });
    router.refresh();
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
      showToast({
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
      showToast({
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
    setIsEditing(null);
    showToast({
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
      showToast({
        message: "We couldn't update this favorite right now.",
        title: "Favorite failed",
        variant: "error",
      });
      setIsTogglingFavorite(false);
      return;
    }

    setIsTogglingFavorite(false);

    if (!result.success) {
      showToast({
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
    showToast({
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
      setDetailsById((current) => ({
        ...current,
        [itemBeforeToggle.id]: itemBeforeToggle,
      }));
      showToast({
        message: "We couldn't update this pin right now.",
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
      showToast({
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
    showToast({
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
      showToast({
        message: "We couldn't delete this item right now.",
        title: "Delete failed",
        variant: "error",
      });
      setIsDeleting(false);
      return;
    }

    if (!result.success) {
      showToast({
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
    setIsEditing(null);
    setIsOpen(false);
    setIsDeleteDialogOpen(false);
    setIsDeleting(false);
    showToast({
      message: "Item deleted.",
      title: "Deleted",
      variant: "success",
    });
    router.refresh();
  }

  return (
    <ItemDrawerContext.Provider value={contextValue}>
      {children}

      <Sheet open={isOpen} onOpenChange={handleSheetOpenChange}>
        <ItemDrawerPanel
          collectionOptions={collectionOptions}
          copiedItemId={copiedItemId}
          drawerWidthValue={drawerWidthValue}
          editError={editError}
          editFormState={editFormState}
          error={error}
          isDeleteDialogOpen={isDeleteDialogOpen}
          isDeleting={isDeleting}
          isEditing={isEditing}
          isLoadingSelectedItem={isLoadingSelectedItem}
          isPro={isPro}
          isResizingDrawer={isResizingDrawer}
          isSaving={isSaving}
          isTogglingFavorite={isTogglingFavorite}
          isTogglingPin={isTogglingPin}
          selectedItem={selectedItem}
          toastState={toastState}
          onAcceptOptimizedPrompt={handleAcceptOptimizedPromptFromEdit}
          onAcceptSuggestedTag={handleAcceptSuggestedTag}
          onAiDescriptionError={handleAiDescriptionError}
          onAiExplainError={handleAiExplainError}
          onAiItemUpdated={handleAiItemUpdated}
          onAiPromptError={handleAiPromptError}
          onAiTagError={handleAiTagError}
          onCancelEdit={handleCancelEdit}
          onClearToast={clearToast}
          onClose={() => setIsOpen(false)}
          onCollectionIdsChange={updateEditCollectionIds}
          onCopy={handleCopy}
          onDelete={handleDelete}
          onDrawerResizeKeyDown={handleDrawerResizeKeyDown}
          onDrawerResizePointerDown={handleDrawerResizePointerDown}
          onEdit={handleEdit}
          onFavoriteToggle={handleFavoriteToggle}
          onGeneratedDescription={handleGeneratedDescription}
          onOpenDeleteDialog={setIsDeleteDialogOpen}
          onPinToggle={handlePinToggle}
          onRetry={handleRetry}
          onSave={handleSave}
          onUpdateEditField={updateEditFormField}
        />
      </Sheet>
    </ItemDrawerContext.Provider>
  );
}

export function useItemDrawer() {
  return useItemDrawerContext();
}

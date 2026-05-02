"use client";

import {
  type KeyboardEvent as ReactKeyboardEvent,
  type PointerEvent as ReactPointerEvent,
  useCallback,
  useEffect,
  useRef,
  useState,
} from "react";

import { createEditItemFormState, getItemCopyValue, parseTagsInput } from "@/components/items/item-drawer-utils";
import type {
  EditItemFormState,
  SerializedDashboardItemDetailRecord,
} from "@/components/items/item-drawer-types";

export type EditItemTextField = Exclude<keyof EditItemFormState, "collectionIds">;

const DRAWER_WIDTH_MIN = 520;
const DRAWER_WIDTH_MAX = 1248;
const DRAWER_WIDTH_KEYBOARD_STEP = 48;

export function useDrawerResize() {
  const [isResizingDrawer, setIsResizingDrawer] = useState(false);
  const [drawerWidth, setDrawerWidth] = useState<number | null>(null);
  const drawerWidthValue = drawerWidth ?? 896;

  const getDrawerWidthBounds = useCallback(() => {
    const viewportWidth = window.innerWidth;
    const minWidth = Math.min(DRAWER_WIDTH_MIN, viewportWidth);
    const maxWidth = Math.max(
      minWidth,
      Math.min(DRAWER_WIDTH_MAX, Math.max(minWidth, viewportWidth - 24)),
    );

    return { maxWidth, minWidth };
  }, []);

  const applyDrawerWidth = useCallback((nextWidth: number) => {
    const { maxWidth, minWidth } = getDrawerWidthBounds();
    const clampedWidth = Math.min(maxWidth, Math.max(minWidth, nextWidth));

    document.documentElement.style.setProperty("--item-drawer-width", `${clampedWidth}px`);
    setDrawerWidth(clampedWidth);
  }, [getDrawerWidthBounds]);

  const handleDrawerResizePointerDown = useCallback((event: ReactPointerEvent<HTMLDivElement>) => {
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
  }, [applyDrawerWidth]);

  const handleDrawerResizeKeyDown = useCallback((event: ReactKeyboardEvent<HTMLDivElement>) => {
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
  }, [applyDrawerWidth, drawerWidth]);

  return {
    drawerWidthValue,
    handleDrawerResizeKeyDown,
    handleDrawerResizePointerDown,
    isResizingDrawer,
  };
}

export function useCopiedItem() {
  const [copiedItemId, setCopiedItemId] = useState<string | null>(null);
  const copyResetTimeoutRef = useRef<number | null>(null);

  useEffect(() => {
    return () => {
      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }
    };
  }, []);

  const copyItem = useCallback(async (item: SerializedDashboardItemDetailRecord | null) => {
    if (!item) {
      return null;
    }

    const copyValue = getItemCopyValue(item);

    if (!copyValue) {
      return null;
    }

    try {
      await navigator.clipboard.writeText(copyValue);
      setCopiedItemId(item.id);

      if (copyResetTimeoutRef.current !== null) {
        window.clearTimeout(copyResetTimeoutRef.current);
      }

      copyResetTimeoutRef.current = window.setTimeout(() => {
        setCopiedItemId((current) => (current === item.id ? null : current));
      }, 1600);
    } catch {
      return null;
    }

    return item.id;
  }, []);

  return {
    copiedItemId,
    copyItem,
    resetCopiedItem() {
      setCopiedItemId(null);
    },
  };
}

export function useEditItemForm(selectedItem: SerializedDashboardItemDetailRecord | null) {
  const selectedItemId = selectedItem?.id ?? null;
  const [draftState, setDraftState] = useState<{
    form: EditItemFormState | null;
    itemId: string | null;
  }>(() => ({
    form: selectedItem ? createEditItemFormState(selectedItem) : null,
    itemId: selectedItemId,
  }));
  const [editError, setEditError] = useState<string | null>(null);
  const [editingItemId, setEditingItemId] = useState<string | null>(null);

  const editFormState =
    draftState.itemId === selectedItemId
      ? draftState.form
      : selectedItem
        ? createEditItemFormState(selectedItem)
        : null;
  const isEditing = editingItemId === selectedItemId && selectedItemId !== null;

  const handleEdit = useCallback(() => {
    if (!selectedItem) {
      return;
    }

    setDraftState({
      form: createEditItemFormState(selectedItem),
      itemId: selectedItem.id,
    });
    setEditError(null);
    setEditingItemId(selectedItem.id);
  }, [selectedItem]);

  const handleCancelEdit = useCallback(() => {
    if (selectedItem) {
      setDraftState({
        form: createEditItemFormState(selectedItem),
        itemId: selectedItem.id,
      });
    }

    setEditError(null);
    setEditingItemId(null);
  }, [selectedItem]);

  const updateEditFormField = useCallback((field: EditItemTextField, value: string) => {
    setDraftState((current) => {
      const baseForm =
        current.itemId === selectedItemId
          ? current.form
          : selectedItem
            ? createEditItemFormState(selectedItem)
            : null;

      return baseForm
        ? {
            form: {
              ...baseForm,
              [field]: value,
            },
            itemId: selectedItemId,
          }
        : current;
    });
    setEditError(null);
  }, [selectedItem, selectedItemId]);

  const updateEditCollectionIds = useCallback((collectionIds: string[]) => {
    setDraftState((current) => {
      const baseForm =
        current.itemId === selectedItemId
          ? current.form
          : selectedItem
            ? createEditItemFormState(selectedItem)
            : null;

      return baseForm
        ? {
            form: {
              ...baseForm,
              collectionIds,
            },
            itemId: selectedItemId,
          }
        : current;
    });
    setEditError(null);
  }, [selectedItem, selectedItemId]);

  const handleGeneratedDescription = useCallback((description: string) => {
    setDraftState((current) => {
      const baseForm =
        current.itemId === selectedItemId
          ? current.form
          : selectedItem
            ? createEditItemFormState(selectedItem)
            : null;

      return baseForm
        ? {
            form: {
              ...baseForm,
              description,
            },
            itemId: selectedItemId,
          }
        : current;
    });
    setEditError(null);
  }, [selectedItem, selectedItemId]);

  const handleAcceptSuggestedTag = useCallback((tag: string) => {
    setDraftState((current) => {
      const baseForm =
        current.itemId === selectedItemId
          ? current.form
          : selectedItem
            ? createEditItemFormState(selectedItem)
            : null;

      if (!baseForm) {
        return current;
      }

      const currentTags = parseTagsInput(baseForm.tags);

      if (currentTags.includes(tag)) {
        return current;
      }

      return {
        form: {
          ...baseForm,
          tags: [...currentTags, tag].join(", "),
        },
        itemId: selectedItemId,
      };
    });
    setEditError(null);
  }, [selectedItem, selectedItemId]);

  const setEditFormState = useCallback((nextState: EditItemFormState | null) => {
    setDraftState({
      form: nextState,
      itemId: selectedItemId,
    });
  }, [selectedItemId]);

  return {
    editError,
    editFormState,
    handleAcceptSuggestedTag,
    handleCancelEdit,
    handleEdit,
    handleGeneratedDescription,
    isEditing,
    setEditError,
    setEditFormState,
    setIsEditing: setEditingItemId,
    updateEditCollectionIds,
    updateEditFormField,
  };
}

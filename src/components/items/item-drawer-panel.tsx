"use client";

import { AlertTriangle, Copy, LoaderCircle, Pencil, Pin, Save, Star, Trash2, X } from "lucide-react";

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
import { getItemCopyValue } from "@/components/items/item-drawer-utils";
import type { EditItemTextField } from "@/components/items/item-drawer-hooks";

interface ItemDrawerPanelProps {
  collectionOptions: CollectionOption[];
  copiedItemId: string | null;
  drawerWidthValue: number;
  editError: string | null;
  editFormState: EditItemFormState | null;
  error: string | null;
  isDeleteDialogOpen: boolean;
  isDeleting: boolean;
  isEditing: boolean;
  isLoadingSelectedItem: boolean;
  isPro: boolean;
  isResizingDrawer: boolean;
  isSaving: boolean;
  isTogglingFavorite: boolean;
  isTogglingPin: boolean;
  selectedItem: SerializedDashboardItemDetailRecord | null;
  toastState: ItemDrawerToastState | null;
  onAcceptOptimizedPrompt: (optimizedPrompt: string) => Promise<void> | void;
  onAcceptSuggestedTag: (tag: string) => void;
  onAiDescriptionError: (message: string) => void;
  onAiExplainError: (message: string) => void;
  onAiItemUpdated: (item: SerializedDashboardItemDetailRecord) => void;
  onAiPromptError: (message: string) => void;
  onAiTagError: (message: string) => void;
  onClearToast: () => void;
  onClose: () => void;
  onCollectionIdsChange: (collectionIds: string[]) => void;
  onCopy: () => void;
  onDelete: () => void;
  onEdit: () => void;
  onFavoriteToggle: () => void;
  onGeneratedDescription: (description: string) => void;
  onOpenDeleteDialog: (open: boolean) => void;
  onPinToggle: () => void;
  onRetry: () => void;
  onSave: () => void;
  onUpdateEditField: (field: EditItemTextField, value: string) => void;
  onCancelEdit: () => void;
  onDrawerResizeKeyDown: React.KeyboardEventHandler<HTMLDivElement>;
  onDrawerResizePointerDown: React.PointerEventHandler<HTMLDivElement>;
}

export function ItemDrawerPanel({
  collectionOptions,
  copiedItemId,
  drawerWidthValue,
  editError,
  editFormState,
  error,
  isDeleteDialogOpen,
  isDeleting,
  isEditing,
  isLoadingSelectedItem,
  isPro,
  isResizingDrawer,
  isSaving,
  isTogglingFavorite,
  isTogglingPin,
  selectedItem,
  toastState,
  onAcceptOptimizedPrompt,
  onAcceptSuggestedTag,
  onAiDescriptionError,
  onAiExplainError,
  onAiItemUpdated,
  onAiPromptError,
  onAiTagError,
  onCancelEdit,
  onClearToast,
  onClose,
  onCollectionIdsChange,
  onCopy,
  onDelete,
  onDrawerResizeKeyDown,
  onDrawerResizePointerDown,
  onEdit,
  onFavoriteToggle,
  onGeneratedDescription,
  onOpenDeleteDialog,
  onPinToggle,
  onRetry,
  onSave,
  onUpdateEditField,
}: ItemDrawerPanelProps) {
  return (
    <>
      <SheetContent
        side="right"
        className="max-w-none sm:w-[var(--item-drawer-width,min(92vw,56rem))]"
      >
        <div
          aria-label="Resize item drawer"
          aria-orientation="vertical"
          aria-valuemax={1248}
          aria-valuemin={520}
          aria-valuenow={drawerWidthValue}
          role="separator"
          tabIndex={0}
          title="Drag to resize drawer"
          onKeyDown={onDrawerResizeKeyDown}
          onPointerDown={onDrawerResizePointerDown}
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
                onClick={onClose}
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
                    onClick={onSave}
                    disabled={isSaving || !editFormState?.title.trim()}
                  />
                  <DrawerActionButton
                    icon={X}
                    label="Cancel"
                    onClick={onCancelEdit}
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
                    onClick={onFavoriteToggle}
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
                    onClick={onPinToggle}
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
                    onClick={onCopy}
                    disabled={!getItemCopyValue(selectedItem)}
                  />
                  <DrawerActionButton icon={Pencil} label="Edit" onClick={onEdit} />
                  <div className="ml-auto">
                    <DrawerActionButton
                      icon={Trash2}
                      label="Delete"
                      onClick={() => onOpenDeleteDialog(true)}
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
                onAcceptSuggestedTag={onAcceptSuggestedTag}
                onAiDescriptionError={onAiDescriptionError}
                onAiPromptError={onAiPromptError}
                onAiTagError={onAiTagError}
                onAcceptOptimizedPrompt={onAcceptOptimizedPrompt}
                onCollectionIdsChange={onCollectionIdsChange}
                onChange={onUpdateEditField}
                onGeneratedDescription={onGeneratedDescription}
              />
            ) : selectedItem ? (
              <ItemDrawerBody
                isPro={isPro}
                item={selectedItem}
                onAiExplainError={onAiExplainError}
                onAiPromptError={onAiPromptError}
                onItemUpdated={onAiItemUpdated}
              />
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
                  onClick={onRetry}
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

      <AlertDialog
        open={isDeleteDialogOpen}
        onOpenChange={(nextOpen) => {
          if (!isDeleting) {
            onOpenDeleteDialog(nextOpen);
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
            <AlertDialogAction onClick={onDelete} disabled={isDeleting}>
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
          onDone={onClearToast}
          title={toastState.title}
          variant={toastState.variant}
        />
      ) : null}
    </>
  );
}

"use client";

import {
  type FormEvent,
  useEffect,
  useRef,
  useState,
} from "react";
import { useRouter } from "next/navigation";
import {
  type LucideIcon,
  AlertTriangle,
  FolderPen,
  LoaderCircle,
  MoreHorizontal,
  Pencil,
  Star,
  Trash2,
  X,
} from "lucide-react";

import {
  deleteCollection,
  toggleCollectionFavorite,
  updateCollection,
} from "@/actions/collections";
import { RedirectLoadingOverlay } from "@/components/layout/redirect-loading-overlay";
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
  Dialog,
  DialogClose,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { SuccessToast } from "@/components/ui/success-toast";

export interface CollectionActionModel {
  id: string;
  name: string;
  descriptionValue: string | null;
  isFavorite: boolean;
}

interface CollectionActionsProps {
  collection: CollectionActionModel;
  deleteRedirectHref?: string;
  variant: "menu" | "toolbar";
}

interface CollectionFormState {
  description: string;
  name: string;
}

interface CollectionToastState {
  message: string;
  title: string;
  variant: "error" | "success";
}

function createFormState(collection: CollectionActionModel): CollectionFormState {
  return {
    description: collection.descriptionValue ?? "",
    name: collection.name,
  };
}

export function CollectionActions({
  collection,
  deleteRedirectHref,
  variant,
}: CollectionActionsProps) {
  const router = useRouter();
  const menuRef = useRef<HTMLDivElement>(null);
  const [formState, setFormState] = useState<CollectionFormState>(() =>
    createFormState(collection),
  );
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [isDeleteOpen, setIsDeleteOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [redirectMessage, setRedirectMessage] = useState<string | null>(null);
  const [isFavorite, setIsFavorite] = useState(collection.isFavorite);
  const [isTogglingFavorite, setIsTogglingFavorite] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toastState, setToastState] = useState<CollectionToastState | null>(null);
  const canSubmit = Boolean(formState.name.trim());

  useEffect(() => {
    setFormState(createFormState(collection));
    setIsFavorite(collection.isFavorite);
  }, [collection]);

  useEffect(() => {
    if (!isMenuOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (
        menuRef.current &&
        event.target instanceof Node &&
        !menuRef.current.contains(event.target)
      ) {
        setIsMenuOpen(false);
      }
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsMenuOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isMenuOpen]);

  function openEditDialog() {
    setFormState(createFormState(collection));
    setError(null);
    setIsMenuOpen(false);
    setIsEditOpen(true);
  }

  function openDeleteDialog() {
    setIsMenuOpen(false);
    setIsDeleteOpen(true);
  }

  function updateFormField(field: keyof CollectionFormState, value: string) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
    setError(null);
  }

  async function handleEditSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || isSaving) {
      return;
    }

    setIsSaving(true);
    setError(null);

    let result: Awaited<ReturnType<typeof updateCollection>>;

    try {
      result = await updateCollection(collection.id, {
        name: formState.name,
        description: formState.description,
      });
    } catch {
      result = {
        success: false,
        data: null,
        error: "We couldn't save this collection right now.",
      };
    }

    setIsSaving(false);

    if (!result.success) {
      setError(result.error);
      setToastState({
        message: result.error,
        title: "Save failed",
        variant: "error",
      });
      return;
    }

    setIsEditOpen(false);
    setToastState({
      message: "Collection updated.",
      title: "Saved",
      variant: "success",
    });
    router.refresh();
  }

  async function handleDelete() {
    if (isDeleting) {
      return;
    }

    setIsDeleting(true);

    let result: Awaited<ReturnType<typeof deleteCollection>>;

    try {
      result = await deleteCollection(collection.id);
    } catch {
      result = {
        success: false,
        data: null,
        error: "We couldn't delete this collection right now.",
      };
    }

    if (!result.success) {
      setIsDeleting(false);
      setToastState({
        message: result.error,
        title: "Delete failed",
        variant: "error",
      });
      return;
    }

    setIsDeleting(false);
    setIsDeleteOpen(false);
    setToastState({
      message: "Collection removed. Items remain in your stash.",
      title: "Deleted",
      variant: "success",
    });

    if (deleteRedirectHref) {
      setRedirectMessage("Opening your collections.");
      router.push(deleteRedirectHref);
      return;
    }

    router.refresh();
  }

  async function handleToggleFavorite() {
    if (isTogglingFavorite) {
      return;
    }

    const previousFavorite = isFavorite;

    setIsFavorite(!previousFavorite);
    setIsTogglingFavorite(true);
    setIsMenuOpen(false);

    let result: Awaited<ReturnType<typeof toggleCollectionFavorite>>;

    try {
      result = await toggleCollectionFavorite(collection.id);
    } catch {
      result = {
        success: false,
        data: null,
        error: "We couldn't update this favorite right now.",
      };
    }

    setIsTogglingFavorite(false);

    if (!result.success) {
      setIsFavorite(previousFavorite);
      setToastState({
        message: result.error,
        title: "Favorite failed",
        variant: "error",
      });
      return;
    }

    setIsFavorite(result.data.isFavorite);
    setToastState({
      message: result.data.isFavorite
        ? "Collection added to favorites."
        : "Collection removed from favorites.",
      title: result.data.isFavorite ? "Favorited" : "Unfavorited",
      variant: "success",
    });
    router.refresh();
  }

  return (
    <div className={variant === "menu" ? "relative z-20" : "relative"}>
      {variant === "menu" ? (
        <div ref={menuRef} className="relative">
          <button
            type="button"
            aria-expanded={isMenuOpen}
            aria-label={`Open actions for ${collection.name}`}
            onClick={() => setIsMenuOpen((current) => !current)}
            className={[
              "inline-flex size-10 items-center justify-center rounded-xl border border-white/8 bg-white/[0.04] text-muted-foreground transition-all duration-200 hover:bg-white/[0.08] hover:text-zinc-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/70",
              isMenuOpen
                ? "translate-y-0 opacity-100"
                : "translate-y-1 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 focus-visible:translate-y-0 focus-visible:opacity-100",
            ].join(" ")}
          >
            <MoreHorizontal className="size-4.5" />
          </button>

          {isMenuOpen ? (
            <div className="collection-action-menu-enter absolute right-0 top-12 z-30 w-44 overflow-hidden rounded-2xl border border-white/10 bg-[#0c0d12] p-1.5 shadow-[0_20px_70px_rgba(0,0,0,0.48)]">
              <MenuAction icon={Pencil} label="Edit" onClick={openEditDialog} />
              <MenuAction icon={Trash2} label="Delete" onClick={openDeleteDialog} danger />
            </div>
          ) : null}
        </div>
      ) : (
        <div className="flex flex-wrap items-center gap-3">
          <ActionButton
            icon={isTogglingFavorite ? LoaderCircle : Star}
            label={isFavorite ? "Unfavorite" : "Favorite"}
            active={isFavorite}
            disabled={isTogglingFavorite}
            onClick={handleToggleFavorite}
            iconOnly
          />
          <ActionButton
            icon={FolderPen}
            label="Edit"
            onClick={openEditDialog}
            iconOnly
          />
          <ActionButton
            icon={Trash2}
            label="Delete"
            onClick={openDeleteDialog}
            danger
            iconOnly
          />
        </div>
      )}

      <Dialog
        open={isEditOpen}
        onOpenChange={(nextOpen) => {
          if (!isSaving) {
            setError(null);
            setIsEditOpen(nextOpen);
          }
        }}
      >
        <DialogContent className="max-w-md">
          <form onSubmit={handleEditSubmit} className="flex flex-col">
            <div className="border-b border-white/8 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <DialogHeader>
                  <DialogTitle>Edit Collection</DialogTitle>
                  <DialogDescription>
                    Update the collection name and description.
                  </DialogDescription>
                </DialogHeader>

                <DialogClose disabled={isSaving} className="size-10 shrink-0 rounded-xl p-0">
                  <X className="size-4" />
                  <span className="sr-only">Close edit collection dialog</span>
                </DialogClose>
              </div>
            </div>

            <div className="space-y-4 px-5 py-4">
              {error ? (
                <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm leading-6 text-rose-100">
                  {error}
                </div>
              ) : null}

              <label className="space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
                  Name <span className="text-rose-300">*</span>
                </span>
                <input
                  type="text"
                  disabled={isSaving}
                  placeholder="Collection name"
                  value={formState.name}
                  onChange={(event) => updateFormField("name", event.target.value)}
                  className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-sky-300/35 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>

              <label className="space-y-1.5">
                <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
                  Description
                </span>
                <textarea
                  disabled={isSaving}
                  placeholder="Optional description"
                  value={formState.description}
                  onChange={(event) => updateFormField("description", event.target.value)}
                  className="min-h-28 w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm leading-5 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-sky-300/35 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
                />
              </label>
            </div>

            <DialogFooter className="border-t border-white/8 px-5 py-4">
              <DialogClose disabled={isSaving}>Cancel</DialogClose>
              <Button
                type="submit"
                disabled={!canSubmit || isSaving}
                className="h-10 rounded-xl bg-zinc-50 px-4 text-zinc-950 hover:bg-white"
              >
                {isSaving ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <FolderPen className="size-4" />
                )}
                Save changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      <AlertDialog
        open={isDeleteOpen}
        onOpenChange={(nextOpen) => {
          if (!isDeleting) {
            setIsDeleteOpen(nextOpen);
          }
        }}
      >
        <AlertDialogContent>
          <div className="flex items-start gap-4">
            <div className="flex size-11 shrink-0 items-center justify-center rounded-2xl bg-rose-400/12 text-rose-200">
              <AlertTriangle className="size-5" />
            </div>

            <AlertDialogHeader>
              <AlertDialogTitle>Delete collection?</AlertDialogTitle>
              <AlertDialogDescription>
                This removes &quot;{collection.name}&quot; from your collections.
                Items in this collection will stay in your stash.
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
              Delete collection
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

      {redirectMessage ? (
        <RedirectLoadingOverlay title="Collection deleted" message={redirectMessage} />
      ) : null}
    </div>
  );
}

function ActionButton({
  active = false,
  danger = false,
  disabled = false,
  iconOnly = false,
  icon: Icon,
  label,
  onClick,
}: {
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  icon: LucideIcon;
  iconOnly?: boolean;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={label}
      aria-label={label}
      className={[
        "inline-flex h-11 items-center justify-center gap-2 rounded-2xl border text-sm font-medium transition-colors",
        iconOnly ? "w-11 px-0" : "px-4",
        "border-white/10 bg-white/[0.04] text-zinc-200 hover:bg-white/[0.08]",
        active ? "border-[#facc15]/30 bg-[#facc15]/10 text-[#facc15]" : "",
        danger && !disabled ? "text-rose-200 hover:border-rose-300/30 hover:bg-rose-400/10" : "",
        disabled ? "cursor-not-allowed opacity-60 hover:bg-white/[0.04]" : "",
      ].join(" ")}
    >
      <Icon
        className={[
          "size-4",
          active && Icon === Star ? "fill-current" : "",
          Icon === LoaderCircle ? "animate-spin" : "",
        ].join(" ")}
      />
      <span className={iconOnly ? "sr-only" : undefined}>{label}</span>
    </button>
  );
}

function MenuAction({
  active = false,
  danger = false,
  disabled = false,
  icon: Icon,
  label,
  onClick,
}: {
  active?: boolean;
  danger?: boolean;
  disabled?: boolean;
  icon: LucideIcon;
  label: string;
  onClick?: () => void;
}) {
  return (
    <button
      type="button"
      disabled={disabled}
      onClick={onClick}
      title={label}
      className={[
        "collection-action-menu-item",
        "flex h-10 w-full items-center gap-2 rounded-xl px-3 text-left text-sm transition-colors",
        "text-zinc-300 hover:bg-white/[0.06] hover:text-zinc-50",
        danger && !disabled ? "text-rose-200 hover:bg-rose-400/10" : "",
        active ? "text-[#facc15]" : "",
        disabled ? "cursor-not-allowed opacity-60 hover:bg-transparent" : "",
      ].join(" ")}
    >
      <Icon
        className={[
          "size-4",
          active && Icon === Star ? "fill-current" : "",
          Icon === LoaderCircle ? "animate-spin" : "",
        ].join(" ")}
      />
      <span>{label}</span>
    </button>
  );
}

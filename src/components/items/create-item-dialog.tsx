"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { Check, ChevronDown, LoaderCircle, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { createItem } from "@/actions/items";
import { CodeEditor } from "@/components/items/code-editor";
import { FileUpload } from "@/components/items/file-upload";
import { MarkdownEditor } from "@/components/items/markdown-editor";
import { Badge } from "@/components/ui/badge";
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
import { DashboardItemTypeIcon, getDashboardItemTypeColor } from "@/lib/dashboard-icons";
import type { DashboardItemTypeKey } from "@/lib/mock-data";
import { deleteTemporaryUpload, queueTemporaryUploadCleanup } from "@/lib/upload-cleanup";
import type { UploadedFileMetadata, UploadItemType } from "@/lib/uploads";
import { cn } from "@/lib/utils";

type CreatableItemTypeKey = DashboardItemTypeKey;

interface CreateItemDialogProps {
  initialType?: CreatableItemTypeKey;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CreateItemFormState {
  title: string;
  description: string;
  tags: string;
  content: string;
  language: string;
  url: string;
}

interface CreateItemToastState {
  message: string;
  title: string;
  variant: "error" | "success";
}

const createItemTypes = [
  {
    key: "snippet",
    label: "Snippet",
  },
  {
    key: "prompt",
    label: "Prompt",
  },
  {
    key: "command",
    label: "Command",
  },
  {
    key: "note",
    label: "Note",
  },
  {
    key: "link",
    label: "Link",
  },
  {
    key: "file",
    label: "File",
  },
  {
    key: "image",
    label: "Image",
  },
] as const satisfies readonly { key: CreatableItemTypeKey; label: string }[];

const emptyFormState: CreateItemFormState = {
  title: "",
  description: "",
  tags: "",
  content: "",
  language: "",
  url: "",
};

export function CreateItemDialog({ initialType = "snippet", onOpenChange, open }: CreateItemDialogProps) {
  const router = useRouter();
  const defaultType = useMemo(() => normalizeCreatableItemType(initialType), [initialType]);
  const [selectedType, setSelectedType] = useState<CreatableItemTypeKey>(defaultType);
  const [formState, setFormState] = useState<CreateItemFormState>(emptyFormState);
  const [error, setError] = useState<string | null>(null);
  const [isTypeMenuOpen, setIsTypeMenuOpen] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastState, setToastState] = useState<CreateItemToastState | null>(null);
  const [uploadedFile, setUploadedFile] = useState<UploadedFileMetadata | null>(null);
  const isSubmittingRef = useRef(isSubmitting);
  const uploadedFileRef = useRef(uploadedFile);

  const showContentField = ["command", "note", "prompt", "snippet"].includes(selectedType);
  const showCodeEditor = isCodeEditorItemType(selectedType);
  const showFileUpload = isUploadItemType(selectedType);
  const showMarkdownEditor = isMarkdownEditorItemType(selectedType);
  const showLanguageField = ["command", "snippet"].includes(selectedType);
  const showUrlField = selectedType === "link";
  const canSubmit =
    Boolean(formState.title.trim()) &&
    (!showUrlField || Boolean(formState.url.trim())) &&
    (!showFileUpload || Boolean(uploadedFile));
  const selectedTypeOption =
    createItemTypes.find((itemType) => itemType.key === selectedType) ?? createItemTypes[0];

  useEffect(() => {
    isSubmittingRef.current = isSubmitting;
  }, [isSubmitting]);

  useEffect(() => {
    uploadedFileRef.current = uploadedFile;
  }, [uploadedFile]);

  useEffect(() => {
    function cleanupPendingUpload() {
      const pendingUpload = uploadedFileRef.current;

      if (!pendingUpload || isSubmittingRef.current) {
        return;
      }

      queueTemporaryUploadCleanup(pendingUpload.fileKey);
      uploadedFileRef.current = null;
    }

    window.addEventListener("pagehide", cleanupPendingUpload);
    window.addEventListener("beforeunload", cleanupPendingUpload);

    return () => {
      window.removeEventListener("pagehide", cleanupPendingUpload);
      window.removeEventListener("beforeunload", cleanupPendingUpload);
    };
  }, []);

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (isSubmitting) {
      return;
    }

    if (!nextOpen && uploadedFile) {
      void cleanupUploadedFile(uploadedFile);
      setUploadedFile(null);
    }

    setIsTypeMenuOpen(false);
    setError(null);
    onOpenChange(nextOpen);
  }, [isSubmitting, onOpenChange, uploadedFile]);

  useEffect(() => {
    if (!showFileUpload) {
      if (uploadedFile) {
        void cleanupUploadedFile(uploadedFile);
      }
      setUploadedFile(null);
    }
  }, [showFileUpload, uploadedFile]);

  function updateFormField(field: keyof CreateItemFormState, value: string) {
    setFormState((current) => ({
      ...current,
      [field]: value,
    }));
    setError(null);
  }

  async function handleSubmit(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();

    if (!canSubmit || isSubmitting) {
      return;
    }

    setIsSubmitting(true);
    setError(null);

    let result: Awaited<ReturnType<typeof createItem>>;

    try {
      result = await createItem({
        typeKey: selectedType,
        title: formState.title,
        description: formState.description,
        content: formState.content,
        file: uploadedFile,
        language: formState.language,
        url: formState.url,
        tags: parseTagsInput(formState.tags),
      });
    } catch {
      const message = "We couldn't create this item right now.";

      setError(message);
      setToastState({
        message,
        title: "Create failed",
        variant: "error",
      });
      setIsSubmitting(false);
      return;
    }

    setIsSubmitting(false);

    if (!result.success) {
      setError(result.error);
      setToastState({
        message: result.error,
        title: "Create failed",
        variant: "error",
      });
      return;
    }

    setFormState(emptyFormState);
    setUploadedFile(null);
    setSelectedType(defaultType);
    setToastState({
      message: "Item created.",
      title: "Created",
      variant: "success",
    });
    onOpenChange(false);
    router.refresh();
  }

  return (
    <>
      <Dialog open={open} onOpenChange={handleOpenChange}>
        <DialogContent className="max-w-lg">
          <form onSubmit={handleSubmit} className="flex max-h-[calc(100vh-3rem)] flex-col">
            <div className="shrink-0 border-b border-white/8 px-5 py-4">
              <div className="flex items-start justify-between gap-4">
                <DialogHeader>
                  <DialogTitle>New Item</DialogTitle>
                  <DialogDescription>
                    Save a reusable developer resource to your stash.
                  </DialogDescription>
                </DialogHeader>

                <DialogClose
                  disabled={isSubmitting}
                  className="size-10 shrink-0 rounded-xl p-0"
                >
                  <X className="size-4" />
                  <span className="sr-only">Close create item dialog</span>
                </DialogClose>
              </div>
            </div>

            <div className="devstash-scrollbar min-h-0 flex-1 overflow-y-auto px-5 py-4">
              <div className="w-full space-y-4">
                {error ? (
                  <div className="rounded-2xl border border-rose-400/20 bg-rose-400/10 p-4 text-sm leading-6 text-rose-100">
                    {error}
                  </div>
                ) : null}

                <section className="space-y-3">
                  <CreateItemSectionLabel label="Type" />
                  <div className="relative">
                    <button
                      type="button"
                      aria-expanded={isTypeMenuOpen}
                      aria-haspopup="listbox"
                      disabled={isSubmitting}
                      onClick={() => setIsTypeMenuOpen((current) => !current)}
                      className="flex h-10 w-full items-center gap-3 rounded-xl border border-white/10 bg-white/[0.04] px-4 text-left text-sm font-medium text-zinc-100 outline-none transition-colors hover:border-white/18 hover:bg-white/[0.06] focus:border-sky-300/35 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
                    >
                      <DashboardItemTypeIcon
                        typeKey={selectedTypeOption.key as DashboardItemTypeKey}
                        className={cn(
                          "size-4",
                          getDashboardItemTypeColor(selectedTypeOption.key as DashboardItemTypeKey),
                        )}
                      />
                      <span className="flex-1">{selectedTypeOption.label}</span>
                      {isProItemType(selectedTypeOption.key) ? <ProBadge /> : null}
                      <ChevronDown
                        className={cn(
                          "size-4 text-zinc-500 transition-transform",
                          isTypeMenuOpen ? "rotate-180" : "",
                        )}
                      />
                    </button>

                    {isTypeMenuOpen ? (
                      <div
                        role="listbox"
                        className="create-type-menu-enter absolute top-[calc(100%+0.5rem)] left-0 z-20 w-full rounded-2xl border border-white/10 bg-[#0b0d12] p-1.5 shadow-[0_18px_60px_rgba(0,0,0,0.45)]"
                      >
                        {createItemTypes.map((itemType) => {
                          const isSelected = itemType.key === selectedType;
                          const isProType = isProItemType(itemType.key);

                          return (
                            <button
                              key={itemType.key}
                              type="button"
                              role="option"
                              aria-selected={isSelected}
                              className={cn(
                                "create-type-menu-item flex h-9 w-full items-center gap-3 rounded-xl px-3 text-left text-sm font-medium text-zinc-300 transition-colors",
                                "hover:bg-white/[0.06] hover:text-zinc-50",
                                isSelected ? "bg-sky-300/10 text-zinc-50" : "",
                              )}
                                onClick={() => {
                                  setSelectedType(itemType.key);
                                  if (
                                    uploadedFile &&
                                    (!isUploadItemType(itemType.key) || itemType.key !== selectedType)
                                  ) {
                                    void cleanupUploadedFile(uploadedFile);
                                    setUploadedFile(null);
                                  }
                                  setIsTypeMenuOpen(false);
                                  setError(null);
                                }}
                            >
                              <DashboardItemTypeIcon
                                typeKey={itemType.key as DashboardItemTypeKey}
                                className={cn(
                                  "size-4",
                                  getDashboardItemTypeColor(itemType.key as DashboardItemTypeKey),
                                )}
                              />
                              <span className="flex-1">{itemType.label}</span>
                              {isProType ? <ProBadge /> : null}
                              {isSelected ? <Check className="size-4 text-sky-200" /> : null}
                            </button>
                          );
                        })}
                      </div>
                    ) : null}
                  </div>
                </section>

                <div className="grid gap-4">
                  <CreateTextField
                    label="Title"
                    required
                    disabled={isSubmitting}
                    placeholder="Item title"
                    value={formState.title}
                    onChange={(value) => updateFormField("title", value)}
                  />
                  <CreateTextField
                    label="Description"
                    disabled={isSubmitting}
                    placeholder="Optional description"
                    value={formState.description}
                    onChange={(value) => updateFormField("description", value)}
                  />
                </div>

                {showUrlField ? (
                  <CreateTextField
                    label="URL"
                    required
                    disabled={isSubmitting}
                    placeholder="https://example.com"
                    value={formState.url}
                    onChange={(value) => updateFormField("url", value)}
                  />
                ) : null}

                {showLanguageField ? (
                  <CreateTextField
                    label="Language"
                    disabled={isSubmitting}
                    placeholder="Language"
                    value={formState.language}
                    onChange={(value) => updateFormField("language", value)}
                  />
                ) : null}

                {showContentField ? (
                  showCodeEditor ? (
                    <CreateCodeField
                      label="Content"
                      disabled={isSubmitting}
                      language={formState.language}
                      value={formState.content}
                      onChange={(value) => updateFormField("content", value)}
                    />
                  ) : showMarkdownEditor ? (
                    <CreateMarkdownField
                      label="Content"
                      disabled={isSubmitting}
                      placeholder={getContentPlaceholder(selectedType)}
                      value={formState.content}
                      onChange={(value) => updateFormField("content", value)}
                    />
                  ) : (
                    <CreateTextareaField
                      label="Content"
                      minHeightClassName="min-h-24"
                      disabled={isSubmitting}
                      placeholder={getContentPlaceholder(selectedType)}
                      value={formState.content}
                      onChange={(value) => updateFormField("content", value)}
                    />
                  )
                ) : null}

                {showFileUpload ? (
                  <div className="space-y-1.5">
                    <CreateItemSectionLabel label={selectedType === "image" ? "Image" : "File"} />
                    <FileUpload
                      disabled={isSubmitting}
                      itemType={selectedType}
                      value={uploadedFile}
                      onChange={handleUploadedFileChange}
                      onError={handleUploadError}
                    />
                  </div>
                ) : null}

                <CreateTextField
                  label="Tags"
                  disabled={isSubmitting}
                  placeholder="tag, tag"
                  value={formState.tags}
                  onChange={(value) => updateFormField("tags", value)}
                />
              </div>
            </div>

            <DialogFooter className="shrink-0 border-t border-white/8 px-5 py-4">
              <DialogClose disabled={isSubmitting}>Cancel</DialogClose>
              <Button
                type="submit"
                disabled={!canSubmit || isSubmitting}
                className="h-10 rounded-xl bg-zinc-50 px-4 text-zinc-950 hover:bg-white"
              >
                {isSubmitting ? (
                  <LoaderCircle className="size-4 animate-spin" />
                ) : (
                  <Plus className="size-4" />
                )}
                Create item
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {toastState ? (
        <SuccessToast
          message={toastState.message}
          onDone={() => setToastState(null)}
          title={toastState.title}
          variant={toastState.variant}
        />
      ) : null}
    </>
  );

  function handleUploadedFileChange(file: UploadedFileMetadata | null) {
    setUploadedFile(file);
    setError(null);

    if (file && !formState.title.trim()) {
      setFormState((current) => ({
        ...current,
        title: file.fileName.replace(/\.[^.]+$/g, ""),
      }));
    }
  }

  function handleUploadError(message: string) {
    setError(message);
    setToastState({
      message,
      title: "Upload failed",
      variant: "error",
    });
  }

  async function cleanupUploadedFile(file: UploadedFileMetadata) {
    try {
      await deleteTemporaryUpload(file.fileKey);
    } catch {
      setToastState({
        message: "The temporary upload could not be removed from storage.",
        title: "Cleanup failed",
        variant: "error",
      });
    }
  }
}

function CreateItemSectionLabel({ label }: { label: string }) {
  return (
    <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">{label}</p>
  );
}

function CreateTextField({
  disabled = false,
  label,
  onChange,
  placeholder,
  required = false,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
        {label}
        {required ? <span className="text-rose-300"> *</span> : null}
      </span>
      <input
        type="text"
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-10 w-full rounded-xl border border-white/10 bg-white/[0.04] px-4 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-sky-300/35 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60"
      />
    </label>
  );
}

function CreateTextareaField({
  disabled = false,
  label,
  minHeightClassName = "min-h-28",
  onChange,
  placeholder,
  value,
}: {
  disabled?: boolean;
  label: string;
  minHeightClassName?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <label className="space-y-1.5">
      <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">{label}</span>
      <textarea
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          minHeightClassName,
          "w-full resize-none rounded-xl border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm leading-5 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-sky-300/35 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60",
        )}
      />
    </label>
  );
}

function CreateCodeField({
  disabled = false,
  label,
  language,
  onChange,
  value,
}: {
  disabled?: boolean;
  label: string;
  language: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">{label}</p>
      <CodeEditor
        disabled={disabled}
        language={language}
        maxHeight={400}
        minHeight={180}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

function CreateMarkdownField({
  disabled = false,
  label,
  onChange,
  placeholder,
  value,
}: {
  disabled?: boolean;
  label: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}) {
  return (
    <div className="space-y-1.5">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">{label}</p>
      <MarkdownEditor
        disabled={disabled}
        maxHeight={400}
        minHeight={180}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

function getContentPlaceholder(typeKey: CreatableItemTypeKey) {
  switch (typeKey) {
    case "command":
      return "Command text";
    case "prompt":
      return "Prompt text";
    case "note":
      return "Note text";
    case "snippet":
      return "Code snippet";
    case "link":
      return "";
    case "file":
    case "image":
      return "";
    default:
      return "";
  }
}

function normalizeCreatableItemType(typeKey: CreatableItemTypeKey) {
  return createItemTypes.some((itemType) => itemType.key === typeKey) ? typeKey : "snippet";
}

function isCodeEditorItemType(typeKey: CreatableItemTypeKey) {
  return typeKey === "command" || typeKey === "snippet";
}

function isMarkdownEditorItemType(typeKey: CreatableItemTypeKey) {
  return typeKey === "note" || typeKey === "prompt";
}

function ProBadge() {
  return (
    <Badge
      variant="outline"
      className="border-white/10 bg-white/[0.04] text-[8px] text-zinc-300"
    >
      PRO
    </Badge>
  );
}

function isUploadItemType(typeKey: CreatableItemTypeKey): typeKey is UploadItemType {
  return typeKey === "file" || typeKey === "image";
}

function isProItemType(typeKey: CreatableItemTypeKey) {
  return typeKey === "file" || typeKey === "image";
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

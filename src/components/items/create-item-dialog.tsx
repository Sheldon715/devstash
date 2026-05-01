"use client";

import { type FormEvent, useCallback, useEffect, useMemo, useRef, useState } from "react";
import { LoaderCircle, Plus, X } from "lucide-react";
import { useRouter } from "next/navigation";

import { createItem } from "@/actions/items";
import { AiTagSuggestions } from "@/components/items/ai-tag-suggestions";
import {
  CollectionMultiSelect,
  type CollectionOption,
} from "@/components/items/collection-multi-select";
import { CodeLanguageSelect } from "@/components/items/code-language-select";
import { FileUpload } from "@/components/items/file-upload";
import { CreateItemTypePicker } from "@/components/items/create-item-type-picker";
import {
  CreateCodeField,
  CreateItemSectionLabel,
  CreateMarkdownField,
  CreateTextareaField,
  CreateTextField,
} from "@/components/items/create-item-fields";
import {
  getContentPlaceholder,
  isCodeEditorItemType,
  isMarkdownEditorItemType,
  isUploadItemType,
  normalizeCreatableItemType,
  parseTagsInput,
  type CreatableItemTypeKey,
} from "@/components/items/create-item-utils";
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
import { deleteTemporaryUpload, queueTemporaryUploadCleanup } from "@/lib/upload-cleanup";
import type { UploadedFileMetadata } from "@/lib/uploads";

interface CreateItemDialogProps {
  collectionOptions: CollectionOption[];
  initialType?: CreatableItemTypeKey;
  isPro: boolean;
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CreateItemFormState {
  title: string;
  description: string;
  tags: string;
  content: string;
  collectionIds: string[];
  language: string;
  url: string;
}

interface CreateItemToastState {
  message: string;
  title: string;
  variant: "error" | "success";
}

type CreateItemTextField = Exclude<keyof CreateItemFormState, "collectionIds">;

const emptyFormState: CreateItemFormState = {
  title: "",
  description: "",
  tags: "",
  content: "",
  collectionIds: [],
  language: "",
  url: "",
};

export function CreateItemDialog({
  collectionOptions,
  initialType = "snippet",
  isPro,
  onOpenChange,
  open,
}: CreateItemDialogProps) {
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

  function updateFormField(field: CreateItemTextField, value: string) {
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
        collectionIds: formState.collectionIds,
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

                <CreateItemTypePicker
                  disabled={isSubmitting}
                  isOpen={isTypeMenuOpen}
                  selectedType={selectedType}
                  onToggle={() => setIsTypeMenuOpen((current) => !current)}
                  onSelect={handleTypeSelect}
                />

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

                {showContentField ? (
                  showCodeEditor ? (
                    <div className="space-y-3">
                      {showLanguageField ? (
                        <CodeLanguageSelect
                          disabled={isSubmitting}
                          size="compact"
                          value={formState.language}
                          onChange={(value) => updateFormField("language", value)}
                        />
                      ) : null}
                      <CreateCodeField
                        label="Content"
                        disabled={isSubmitting}
                        language={formState.language}
                        value={formState.content}
                        onChange={(value) => updateFormField("content", value)}
                      />
                    </div>
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

                <div className="space-y-2">
                  <CreateTextField
                    label="Tags"
                    disabled={isSubmitting}
                    placeholder="tag, tag"
                    value={formState.tags}
                    onChange={(value) => updateFormField("tags", value)}
                  />
                  <AiTagSuggestions
                    content={formState.content}
                    description={formState.description}
                    disabled={isSubmitting}
                    isPro={isPro}
                    title={formState.title}
                    onAccept={handleAcceptSuggestedTag}
                    onError={handleAiTagError}
                  />
                </div>

                <CollectionMultiSelect
                  disabled={isSubmitting}
                  options={collectionOptions}
                  selectedIds={formState.collectionIds}
                  onChange={handleCollectionIdsChange}
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

  function handleTypeSelect(typeKey: CreatableItemTypeKey) {
    setSelectedType(typeKey);

    if (uploadedFile && (!isUploadItemType(typeKey) || typeKey !== selectedType)) {
      void cleanupUploadedFile(uploadedFile);
      setUploadedFile(null);
    }

    setIsTypeMenuOpen(false);
    setError(null);
  }

  function handleCollectionIdsChange(collectionIds: string[]) {
    setFormState((current) => ({
      ...current,
      collectionIds,
    }));
    setError(null);
  }

  function handleUploadError(message: string) {
    setError(message);
    setToastState({
      message,
      title: "Upload failed",
      variant: "error",
    });
  }

  function handleAiTagError(message: string) {
    setToastState({
      message,
      title: "Tag suggestions failed",
      variant: "error",
    });
  }

  function handleAcceptSuggestedTag(tag: string) {
    const currentTags = parseTagsInput(formState.tags);

    if (currentTags.includes(tag)) {
      return;
    }

    setFormState((current) => ({
      ...current,
      tags: [...currentTags, tag].join(", "),
    }));
    setError(null);
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


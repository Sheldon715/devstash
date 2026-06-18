"use client";

import { type FormEvent, useCallback, useState } from "react";
import { FolderPlus } from "lucide-react";
import { useRouter } from "next/navigation";

import { CollectionFormDialog } from "@/components/collections/collection-form-dialog";
import { SuccessToast } from "@/components/ui/success-toast";

interface CreateCollectionDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

interface CreateCollectionResponse {
  success: boolean;
  error?: string;
  status?: number;
}

interface CreateCollectionToastState {
  message: string;
  title: string;
  variant: "error" | "success";
}

const emptyFormState = {
  description: "",
  name: "",
};

export function CreateCollectionDialog({
  onOpenChange,
  open,
}: CreateCollectionDialogProps) {
  const router = useRouter();
  const [formState, setFormState] = useState(emptyFormState);
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [toastState, setToastState] = useState<CreateCollectionToastState | null>(null);
  const canSubmit = Boolean(formState.name.trim());

  const handleOpenChange = useCallback((nextOpen: boolean) => {
    if (isSubmitting) {
      return;
    }

    setError(null);
    onOpenChange(nextOpen);
  }, [isSubmitting, onOpenChange]);

  function updateFormField(field: keyof typeof emptyFormState, value: string) {
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

    let payload: CreateCollectionResponse;

    try {
      const response = await fetch("/api/collections", {
        method: "POST",
        headers: {
          "content-type": "application/json",
        },
        body: JSON.stringify({
          name: formState.name,
          description: formState.description,
        }),
      });

      payload = {
        ...((await response.json()) as CreateCollectionResponse),
        status: response.status,
      };
    } catch {
      payload = {
        success: false,
        error: "We couldn't create this collection right now.",
      };
    }

    setIsSubmitting(false);

    if (!payload.success) {
      const message = payload.error ?? "We couldn't create this collection right now.";

      if (payload.status !== 403) {
        setError(message);
      }

      setToastState({
        message,
        title: "Create failed",
        variant: "error",
      });
      return;
    }

    setFormState(emptyFormState);
    setToastState({
      message: "Collection created.",
      title: "Created",
      variant: "success",
    });
    onOpenChange(false);
    router.refresh();
  }

  return (
    <>
      <CollectionFormDialog
        closeLabel="Close create collection dialog"
        description="Group related items with a reusable workspace label."
        error={error}
        formState={formState}
        isOpen={open}
        isSubmitting={isSubmitting}
        submitIcon={FolderPlus}
        submitLabel="Create collection"
        submittingLabel="Creating collection"
        title="New Collection"
        onDescriptionChange={(value) => updateFormField("description", value)}
        onNameChange={(value) => updateFormField("name", value)}
        onOpenChange={handleOpenChange}
        onSubmit={handleSubmit}
      />

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
}

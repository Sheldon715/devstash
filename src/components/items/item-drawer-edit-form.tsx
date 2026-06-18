"use client";

import { CodeLanguageSelect } from "@/components/items/code-language-select";
import { AiTagSuggestions } from "@/components/items/ai-tag-suggestions";
import {
  CollectionMultiSelect,
  type CollectionOption,
} from "@/components/items/collection-multi-select";
import { optimizePrompt } from "@/actions/ai";
import {
  ItemFormCodeField,
  ItemFormDescriptionField,
  ItemFormMarkdownField,
  ItemFormTextField,
  ItemFormTextareaField,
} from "@/components/items/create-item-fields";
import type {
  EditItemFormState,
  SerializedDashboardItemDetailRecord,
} from "@/components/items/item-drawer-types";
import {
  isCodeEditorItemType,
  isMarkdownEditorItemType,
} from "@/components/items/item-drawer-utils";
import {
  ItemDrawerCompactMeta,
  ItemDrawerFooterMeta,
} from "@/components/items/item-drawer-readonly-content";

type EditItemTextField = Exclude<keyof EditItemFormState, "collectionIds">;

interface ItemDrawerEditBodyProps {
  collectionOptions: CollectionOption[];
  disabled?: boolean;
  editError: string | null;
  formState: EditItemFormState;
  isPro: boolean;
  item: SerializedDashboardItemDetailRecord;
  onAcceptSuggestedTag: (tag: string) => void;
  onAiDescriptionError: (message: string) => void;
  onAiPromptError: (message: string) => void;
  onAiTagError: (message: string) => void;
  onAcceptOptimizedPrompt: (optimizedPrompt: string) => Promise<void> | void;
  onCollectionIdsChange: (collectionIds: string[]) => void;
  onChange: (field: EditItemTextField, value: string) => void;
  onGeneratedDescription: (description: string) => void;
}

export function ItemDrawerEditBody({
  collectionOptions,
  disabled = false,
  editError,
  formState,
  isPro,
  item,
  onAcceptSuggestedTag,
  onAiDescriptionError,
  onAiPromptError,
  onAiTagError,
  onAcceptOptimizedPrompt,
  onCollectionIdsChange,
  onChange,
  onGeneratedDescription,
}: ItemDrawerEditBodyProps) {
  const showContentField = ["command", "note", "prompt", "snippet"].includes(item.typeKey);
  const showCodeEditor = isCodeEditorItemType(item.typeKey);
  const showMarkdownEditor = isMarkdownEditorItemType(item.typeKey);
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
        <ItemFormTextField
          label="Title"
          required
          fieldClassName="h-12 rounded-2xl"
          labelClassName="space-y-2"
          value={formState.title}
          onChange={(value) => onChange("title", value)}
        />
        <ItemFormDescriptionField
          content={formState.content}
          description={formState.description}
          disabled={disabled}
          fieldClassName="min-h-32 resize-y rounded-2xl"
          fileMimeType={item.fileMimeType}
          fileName={item.fileName}
          isPro={isPro}
          itemType={item.typeKey}
          labelClassName="space-y-2"
          multiline
          title={formState.title}
          url={formState.url}
          onChange={(value) => onChange("description", value)}
          onError={onAiDescriptionError}
          onGenerated={onGeneratedDescription}
        />
      </div>

      {showUrlField ? (
        <ItemFormTextField
          label="URL"
          fieldClassName="h-12 rounded-2xl"
          labelClassName="space-y-2"
          value={formState.url}
          onChange={(value) => onChange("url", value)}
        />
      ) : null}

      {showContentField ? (
        showCodeEditor ? (
          <div className="space-y-3">
            {showLanguageField ? (
              <CodeLanguageSelect
                value={formState.language}
                onChange={(value) => onChange("language", value)}
              />
            ) : null}
            <ItemFormCodeField
              label="Content"
              language={formState.language}
              minHeight={260}
              value={formState.content}
              onChange={(value) => onChange("content", value)}
              wrapperClassName="space-y-2"
            />
          </div>
        ) : showMarkdownEditor ? (
          <EditMarkdownField
            label="Content"
            value={formState.content}
            onChange={(value) => onChange("content", value)}
            item={item}
            disabled={disabled}
            isPro={isPro}
            onAiError={onAiPromptError}
            onAcceptOptimized={onAcceptOptimizedPrompt}
            showOptimize={item.typeKey === "prompt"}
          />
        ) : (
          <ItemFormTextareaField
            label="Content"
            minHeightClassName="min-h-64"
            fieldClassName="resize-y rounded-2xl py-3 leading-6"
            labelClassName="space-y-2"
            value={formState.content}
            onChange={(value) => onChange("content", value)}
          />
        )
      ) : null}

      <div className="space-y-2">
        <ItemFormTextField
          label="Tags"
          fieldClassName="h-12 rounded-2xl"
          labelClassName="space-y-2"
          value={formState.tags}
          onChange={(value) => onChange("tags", value)}
        />
        <AiTagSuggestions
          content={formState.content}
          description={formState.description}
          disabled={disabled}
          isPro={isPro}
          title={formState.title}
          onAccept={onAcceptSuggestedTag}
          onError={onAiTagError}
        />
      </div>

      <CollectionMultiSelect
        options={collectionOptions}
        selectedIds={formState.collectionIds}
        onChange={onCollectionIdsChange}
      />

      <ItemDrawerCompactMeta item={item} />
      <ItemDrawerFooterMeta item={item} />
    </div>
  );
}

function EditMarkdownField({
  label,
  disabled = false,
  isPro,
  item,
  onChange,
  onAiError,
  onAcceptOptimized,
  showOptimize = false,
  value,
}: {
  label: string;
  disabled?: boolean;
  isPro: boolean;
  item: SerializedDashboardItemDetailRecord;
  onAiError: (message: string) => void;
  onAcceptOptimized?: (optimizedPrompt: string) => Promise<void> | void;
  showOptimize?: boolean;
  onChange: (value: string) => void;
  value: string;
}) {
  async function handleOptimize() {
    const result = await optimizePrompt({
      title: item.title,
      description: item.description,
      content: value,
    });

    if (!result.success) {
      throw new Error(result.error);
    }

    return result.data;
  }

  return (
    <ItemFormMarkdownField
      disabled={disabled}
      label={label}
      maxHeight={400}
      minHeight={260}
      value={value}
      onAcceptOptimized={showOptimize ? onAcceptOptimized : undefined}
      onChange={onChange}
      onOptimize={showOptimize && isPro ? handleOptimize : undefined}
      onOptimizeError={onAiError}
      onOptimizeUnavailable={() => onAiError("AI features require Pro subscription.")}
      showOptimize={showOptimize}
      wrapperClassName="space-y-2"
    />
  );
}

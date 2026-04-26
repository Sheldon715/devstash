"use client";

import { CodeEditor } from "@/components/items/code-editor";
import {
  CollectionMultiSelect,
  type CollectionOption,
} from "@/components/items/collection-multi-select";
import { MarkdownEditor } from "@/components/items/markdown-editor";
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
  editError: string | null;
  formState: EditItemFormState;
  item: SerializedDashboardItemDetailRecord;
  onCollectionIdsChange: (collectionIds: string[]) => void;
  onChange: (field: EditItemTextField, value: string) => void;
}

export function ItemDrawerEditBody({
  collectionOptions,
  editError,
  formState,
  item,
  onCollectionIdsChange,
  onChange,
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
        <EditTextField
          label="Title"
          required
          value={formState.title}
          onChange={(value) => onChange("title", value)}
        />
        <EditTextareaField
          label="Description"
          value={formState.description}
          onChange={(value) => onChange("description", value)}
        />
      </div>

      {showLanguageField ? (
        <EditTextField
          label="Language"
          value={formState.language}
          onChange={(value) => onChange("language", value)}
        />
      ) : null}

      {showUrlField ? (
        <EditTextField
          label="URL"
          value={formState.url}
          onChange={(value) => onChange("url", value)}
        />
      ) : null}

      {showContentField ? (
        showCodeEditor ? (
          <EditCodeField
            label="Content"
            language={formState.language}
            value={formState.content}
            onChange={(value) => onChange("content", value)}
          />
        ) : showMarkdownEditor ? (
          <EditMarkdownField
            label="Content"
            value={formState.content}
            onChange={(value) => onChange("content", value)}
          />
        ) : (
          <EditTextareaField
            label="Content"
            minHeightClassName="min-h-64"
            value={formState.content}
            onChange={(value) => onChange("content", value)}
          />
        )
      ) : null}

      <EditTextField
        label="Tags"
        value={formState.tags}
        onChange={(value) => onChange("tags", value)}
      />

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

function EditTextField({
  label,
  onChange,
  required = false,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  required?: boolean;
  value: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
        {label}
        {required ? <span className="text-rose-300"> *</span> : null}
      </span>
      <input
        type="text"
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className="h-12 w-full rounded-2xl border border-white/10 bg-white/[0.04] px-4 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-sky-300/35 focus:bg-white/[0.06]"
      />
    </label>
  );
}

function EditTextareaField({
  label,
  minHeightClassName = "min-h-32",
  onChange,
  value,
}: {
  label: string;
  minHeightClassName?: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <label className="space-y-2">
      <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">{label}</span>
      <textarea
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={`${minHeightClassName} w-full resize-y rounded-2xl border border-white/10 bg-white/[0.04] px-4 py-3 text-sm leading-6 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-sky-300/35 focus:bg-white/[0.06]`}
      />
    </label>
  );
}

function EditCodeField({
  label,
  language,
  onChange,
  value,
}: {
  label: string;
  language: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">{label}</p>
      <CodeEditor
        language={language}
        maxHeight={400}
        minHeight={260}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

function EditMarkdownField({
  label,
  onChange,
  value,
}: {
  label: string;
  onChange: (value: string) => void;
  value: string;
}) {
  return (
    <div className="space-y-2">
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">{label}</p>
      <MarkdownEditor
        maxHeight={400}
        minHeight={260}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

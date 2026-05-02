import { AiDescriptionButton } from "@/components/items/ai-description-button";
import { CodeEditor } from "@/components/items/code-editor";
import { MarkdownEditor } from "@/components/items/markdown-editor";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

interface ItemFormSectionLabelProps {
  label: string;
}

interface ItemFormTextFieldProps {
  disabled?: boolean;
  fieldClassName?: string;
  label: string;
  labelClassName?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  required?: boolean;
  value: string;
}

interface ItemFormTextareaFieldProps {
  disabled?: boolean;
  fieldClassName?: string;
  label: string;
  labelClassName?: string;
  minHeightClassName?: string;
  onChange: (value: string) => void;
  placeholder?: string;
  value: string;
}

interface ItemFormDescriptionFieldProps {
  content: string;
  description: string;
  disabled?: boolean;
  fieldClassName?: string;
  fileMimeType?: string | null;
  fileName?: string | null;
  isPro: boolean;
  itemType: string;
  labelClassName?: string;
  multiline?: boolean;
  onChange: (value: string) => void;
  onError: (message: string) => void;
  onGenerated: (description: string) => void;
  placeholder?: string;
  title: string;
  url: string;
}

interface ItemFormCodeFieldProps {
  disabled?: boolean;
  label: string;
  language: string;
  maxHeight?: number;
  minHeight?: number;
  onChange: (value: string) => void;
  value: string;
  wrapperClassName?: string;
}

interface ItemFormMarkdownFieldProps {
  disabled?: boolean;
  label: string;
  maxHeight?: number;
  minHeight?: number;
  onAcceptOptimized?: (optimizedPrompt: string) => Promise<void> | void;
  onChange: (value: string) => void;
  onOptimize?: () => Promise<{ optimizedPrompt: string; changes: string[] }>;
  onOptimizeError?: (message: string) => void;
  onOptimizeUnavailable?: () => void;
  placeholder?: string;
  showOptimize?: boolean;
  value: string;
  wrapperClassName?: string;
}

export function ItemFormSectionLabel({ label }: ItemFormSectionLabelProps) {
  return (
    <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">{label}</p>
  );
}

export function ItemFormTextField({
  disabled = false,
  fieldClassName,
  label,
  labelClassName = "space-y-1.5",
  onChange,
  placeholder,
  required = false,
  value,
}: ItemFormTextFieldProps) {
  return (
    <label className={labelClassName}>
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
        className={cn(
          "w-full border border-white/10 bg-white/[0.04] px-4 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-sky-300/35 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60",
          fieldClassName,
        )}
      />
    </label>
  );
}

export function ItemFormTextareaField({
  disabled = false,
  fieldClassName,
  label,
  labelClassName = "space-y-1.5",
  minHeightClassName = "min-h-28",
  onChange,
  placeholder,
  value,
}: ItemFormTextareaFieldProps) {
  return (
    <label className={labelClassName}>
      <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">{label}</span>
      <textarea
        disabled={disabled}
        placeholder={placeholder}
        value={value}
        onChange={(event) => onChange(event.target.value)}
        className={cn(
          minHeightClassName,
          "w-full border border-white/10 bg-white/[0.04] px-4 py-2.5 text-sm leading-5 text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-sky-300/35 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60",
          fieldClassName,
        )}
      />
    </label>
  );
}

export function ItemFormDescriptionField({
  content,
  description,
  disabled = false,
  fieldClassName,
  fileMimeType,
  fileName,
  isPro,
  itemType,
  labelClassName = "space-y-1.5",
  multiline = false,
  onChange,
  onError,
  onGenerated,
  placeholder = "Optional description",
  title,
  url,
}: ItemFormDescriptionFieldProps) {
  return (
    <label className={labelClassName}>
      <span className="flex items-center justify-between gap-3">
        <span className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">
          Description
        </span>
        <AiDescriptionButton
          content={content}
          description={description}
          disabled={disabled}
          fileMimeType={fileMimeType}
          fileName={fileName}
          isPro={isPro}
          itemType={itemType}
          title={title}
          url={url}
          onError={onError}
          onGenerated={onGenerated}
        />
      </span>
      {multiline ? (
        <textarea
          disabled={disabled}
          placeholder={placeholder}
          value={description}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "w-full border border-white/10 bg-white/[0.04] px-4 py-3 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-sky-300/35 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60",
            fieldClassName,
          )}
        />
      ) : (
        <input
          type="text"
          disabled={disabled}
          placeholder={placeholder}
          value={description}
          onChange={(event) => onChange(event.target.value)}
          className={cn(
            "w-full border border-white/10 bg-white/[0.04] px-4 text-sm text-zinc-100 outline-none transition-colors placeholder:text-zinc-600 focus:border-sky-300/35 focus:bg-white/[0.06] disabled:cursor-not-allowed disabled:opacity-60",
            fieldClassName,
          )}
        />
      )}
    </label>
  );
}

export function ItemFormCodeField({
  disabled = false,
  label,
  language,
  maxHeight = 400,
  minHeight = 180,
  onChange,
  value,
  wrapperClassName = "space-y-1.5",
}: ItemFormCodeFieldProps) {
  return (
    <div className={wrapperClassName}>
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">{label}</p>
      <CodeEditor
        disabled={disabled}
        language={language}
        maxHeight={maxHeight}
        minHeight={minHeight}
        value={value}
        onChange={onChange}
      />
    </div>
  );
}

export function ItemFormMarkdownField({
  disabled = false,
  label,
  maxHeight = 400,
  minHeight = 180,
  onAcceptOptimized,
  onChange,
  onOptimize,
  onOptimizeError,
  onOptimizeUnavailable,
  placeholder,
  showOptimize = false,
  value,
  wrapperClassName = "space-y-1.5",
}: ItemFormMarkdownFieldProps) {
  return (
    <div className={wrapperClassName}>
      <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">{label}</p>
      <MarkdownEditor
        disabled={disabled}
        maxHeight={maxHeight}
        minHeight={minHeight}
        placeholder={placeholder}
        value={value}
        onAcceptOptimized={onAcceptOptimized}
        onChange={onChange}
        onOptimize={onOptimize}
        onOptimizeError={onOptimizeError}
        onOptimizeUnavailable={onOptimizeUnavailable}
        showOptimize={showOptimize}
      />
    </div>
  );
}

export function CreateItemSectionLabel({ label }: ItemFormSectionLabelProps) {
  return <ItemFormSectionLabel label={label} />;
}

export function CreateTextField(props: ItemFormTextFieldProps) {
  return (
    <ItemFormTextField
      {...props}
      fieldClassName={cn("h-10 rounded-xl", props.fieldClassName)}
      labelClassName={props.labelClassName ?? "space-y-1.5"}
    />
  );
}

export function CreateTextareaField(props: ItemFormTextareaFieldProps) {
  return (
    <ItemFormTextareaField
      {...props}
      fieldClassName={cn("resize-none rounded-xl", props.fieldClassName)}
      labelClassName={props.labelClassName ?? "space-y-1.5"}
    />
  );
}

export function CreateCodeField(props: ItemFormCodeFieldProps) {
  return (
    <ItemFormCodeField
      {...props}
      maxHeight={props.maxHeight ?? 400}
      minHeight={props.minHeight ?? 180}
      wrapperClassName={props.wrapperClassName ?? "space-y-1.5"}
    />
  );
}

export function CreateMarkdownField(props: ItemFormMarkdownFieldProps) {
  return (
    <ItemFormMarkdownField
      {...props}
      maxHeight={props.maxHeight ?? 400}
      minHeight={props.minHeight ?? 180}
      wrapperClassName={props.wrapperClassName ?? "space-y-1.5"}
    />
  );
}

export function ProBadge() {
  return (
    <Badge
      variant="outline"
      className="border-white/10 bg-white/[0.04] text-[8px] text-zinc-300"
    >
      PRO
    </Badge>
  );
}

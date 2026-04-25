import { CodeEditor } from "@/components/items/code-editor";
import { MarkdownEditor } from "@/components/items/markdown-editor";
import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

export function CreateItemSectionLabel({ label }: { label: string }) {
  return (
    <p className="text-xs font-medium uppercase tracking-[0.22em] text-zinc-500">{label}</p>
  );
}

export function CreateTextField({
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

export function CreateTextareaField({
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

export function CreateCodeField({
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

export function CreateMarkdownField({
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

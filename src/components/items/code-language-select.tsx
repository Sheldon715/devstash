"use client";

import {
  Check,
  ChevronDown,
} from "lucide-react";
import {
  useEffect,
  useId,
  useMemo,
  useRef,
  useState,
} from "react";

import { cn } from "@/lib/utils";

const codeLanguageOptions = [
  { label: "Plain text", value: "" },
  { label: "TypeScript", value: "typescript" },
  { label: "JavaScript", value: "javascript" },
  { label: "JSON", value: "json" },
  { label: "Shell", value: "shell" },
  { label: "Python", value: "python" },
  { label: "SQL", value: "sql" },
  { label: "HTML", value: "html" },
  { label: "CSS", value: "css" },
  { label: "SCSS", value: "scss" },
  { label: "Markdown", value: "markdown" },
  { label: "YAML", value: "yaml" },
  { label: "XML", value: "xml" },
  { label: "Go", value: "go" },
  { label: "Rust", value: "rust" },
  { label: "Java", value: "java" },
  { label: "C#", value: "csharp" },
  { label: "C++", value: "cpp" },
  { label: "PHP", value: "php" },
  { label: "Ruby", value: "ruby" },
  { label: "Swift", value: "swift" },
  { label: "Kotlin", value: "kotlin" },
  { label: "Dockerfile", value: "dockerfile" },
] as const;

interface CodeLanguageSelectProps {
  disabled?: boolean;
  label?: string;
  onChange: (value: string) => void;
  size?: "compact" | "default";
  value: string;
}

export function CodeLanguageSelect({
  disabled = false,
  label = "Language",
  onChange,
  size = "default",
  value,
}: CodeLanguageSelectProps) {
  const labelId = useId();
  const [isOpen, setIsOpen] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const normalizedValue = value.trim().toLowerCase();
  const options = useMemo(() => {
    if (!value || codeLanguageOptions.some((option) => option.value === normalizedValue)) {
      return codeLanguageOptions;
    }

    return [
      ...codeLanguageOptions,
      {
        label: value,
        value,
      },
    ];
  }, [normalizedValue, value]);
  const selectedValue = options.some((option) => option.value === normalizedValue)
    ? normalizedValue
    : value;
  const selectedOption =
    options.find((option) => option.value === selectedValue) ?? codeLanguageOptions[0];

  useEffect(() => {
    if (!isOpen) {
      return;
    }

    function handlePointerDown(event: PointerEvent) {
      if (!rootRef.current || rootRef.current.contains(event.target as Node)) {
        return;
      }

      setIsOpen(false);
    }

    function handleKeyDown(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }

    window.addEventListener("pointerdown", handlePointerDown);
    window.addEventListener("keydown", handleKeyDown);

    return () => {
      window.removeEventListener("pointerdown", handlePointerDown);
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isOpen]);

  function handleSelect(nextValue: string) {
    onChange(nextValue);
    setIsOpen(false);
  }

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative block w-full max-w-[12rem]",
        size === "compact" ? "space-y-1.5" : "space-y-2",
      )}
    >
      <span
        id={labelId}
        className="block text-xs font-medium uppercase tracking-[0.22em] text-zinc-500"
      >
        {label}
      </span>
      <button
        type="button"
        aria-expanded={isOpen}
        aria-labelledby={labelId}
        disabled={disabled}
        onClick={() => {
          setIsOpen((current) => !current);
        }}
        className={cn(
          "group flex w-full items-center justify-between gap-3 border border-white/10 bg-white/[0.04] text-left text-sm font-medium text-zinc-100 outline-none transition-all duration-200 hover:border-white/18 hover:bg-white/[0.06] focus:border-white/18 focus:bg-white/[0.06] active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60",
          isOpen ? "border-white/18 bg-white/[0.06] shadow-[0_14px_36px_rgba(0,0,0,0.24)]" : "",
          size === "compact" ? "h-10 rounded-xl px-4" : "h-12 rounded-2xl px-4",
        )}
      >
        <span className="min-w-0 truncate">{selectedOption.label}</span>
        <ChevronDown
          className={cn(
            "size-4 shrink-0 text-zinc-500 transition-transform duration-200 group-hover:text-zinc-300",
            isOpen ? "rotate-180 text-zinc-300" : "",
          )}
        />
      </button>

      <div
        className={cn(
          "absolute left-0 right-0 top-full z-50 mt-2 overflow-hidden rounded-2xl border border-white/10 bg-[#090d13]/95 shadow-[0_24px_70px_rgba(0,0,0,0.48)] backdrop-blur-xl transition-all duration-200",
          isOpen
            ? "translate-y-0 scale-100 opacity-100"
            : "pointer-events-none -translate-y-1 scale-[0.98] opacity-0",
        )}
      >
        <div className="devstash-scrollbar max-h-60 overflow-y-auto py-1">
          {options.map((option) => {
            const isSelected = option.value === selectedValue;

            return (
              <button
                key={`${option.label}-${option.value}`}
                type="button"
                onClick={() => handleSelect(option.value)}
                className={cn(
                  "flex w-full items-center gap-3 px-4 py-2.5 text-left text-sm transition-colors",
                  isSelected
                    ? "bg-white/[0.06] text-zinc-50"
                    : "text-zinc-300 hover:bg-white/[0.05] hover:text-zinc-50",
                )}
              >
                <span className="flex size-5 shrink-0 items-center justify-center">
                  {isSelected ? <Check className="size-4 text-zinc-200" /> : null}
                </span>
                <span className="min-w-0 truncate">{option.label}</span>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

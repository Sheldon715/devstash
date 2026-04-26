"use client";

import { useRef, useState } from "react";
import {
  Check,
  ChevronDown,
  Code2,
  LoaderCircle,
  Map,
  Palette,
  Type,
  WrapText,
  type LucideIcon,
} from "lucide-react";

import { updateEditorPreferences } from "@/actions/editor-preferences";
import { useEditorPreferences } from "@/components/items/editor-preferences-context";
import { SuccessToast } from "@/components/ui/success-toast";
import {
  EDITOR_FONT_SIZE_OPTIONS,
  EDITOR_TAB_SIZE_OPTIONS,
  EDITOR_THEME_LABELS,
  EDITOR_THEME_OPTIONS,
} from "@/lib/editor-preferences";
import type { EditorPreferences, EditorTheme } from "@/lib/editor-preferences";
import { cn } from "@/lib/utils";

interface ToastState {
  message: string;
  title: string;
  variant: "error" | "success";
}

interface PreferenceSelectOption {
  label: string;
  value: string;
}

export function EditorPreferencesCard() {
  const { preferences, setPreferences } = useEditorPreferences();
  const [isSaving, setIsSaving] = useState(false);
  const [toastState, setToastState] = useState<ToastState | null>(null);
  const requestIdRef = useRef(0);
  const committedPreferencesRef = useRef(preferences);

  async function savePreferences(nextPreferences: EditorPreferences) {
    const requestId = requestIdRef.current + 1;

    requestIdRef.current = requestId;
    setPreferences(nextPreferences);
    setIsSaving(true);

    try {
      const result = await updateEditorPreferences(nextPreferences);

      if (requestId !== requestIdRef.current) {
        return;
      }

      if (!result.success || !result.data) {
        setPreferences(committedPreferencesRef.current);
        setToastState({
          message: result.error ?? "We couldn't save editor preferences right now.",
          title: "Save failed",
          variant: "error",
        });
        return;
      }

      committedPreferencesRef.current = result.data;
      setPreferences(result.data);
      setToastState({
        message: "Editor preferences saved.",
        title: "Saved",
        variant: "success",
      });
    } catch {
      if (requestId !== requestIdRef.current) {
        return;
      }

      setPreferences(committedPreferencesRef.current);
      setToastState({
        message: "We couldn't save editor preferences right now.",
        title: "Save failed",
        variant: "error",
      });
    } finally {
      if (requestId === requestIdRef.current) {
        setIsSaving(false);
      }
    }
  }

  function updatePreference<Key extends keyof EditorPreferences>(
    key: Key,
    value: EditorPreferences[Key],
  ) {
    void savePreferences({
      ...preferences,
      [key]: value,
    });
  }

  return (
    <>
      <section className="rounded-[2rem] border border-border/70 bg-card/70 p-6 shadow-[0_20px_60px_rgba(0,0,0,0.22)] backdrop-blur sm:p-8">
        <div className="flex flex-col gap-4 sm:flex-row sm:items-start sm:justify-between">
          <div className="flex items-center gap-3">
            <div className="flex size-11 items-center justify-center rounded-[1rem] bg-sky-300/10 text-sky-200">
              <Code2 className="size-5" />
            </div>
            <div>
              <p className="text-sm font-medium tracking-[0.2em] text-muted-foreground uppercase">
                Editor preferences
              </p>
              <h2 className="mt-1 text-xl font-semibold tracking-tight text-zinc-50">
                Code editor
              </h2>
            </div>
          </div>

          <div className="inline-flex h-9 items-center gap-2 self-start rounded-full border border-white/8 bg-white/[0.03] px-3 text-xs font-medium text-zinc-400">
            {isSaving ? (
              <>
                <LoaderCircle className="size-3.5 animate-spin text-sky-200" />
                Saving
              </>
            ) : (
              <>
                <Check className="size-3.5 text-emerald-300" />
                Auto-save
              </>
            )}
          </div>
        </div>

        <div className="mt-6 grid gap-4 lg:grid-cols-2">
          <PreferenceSelect
            icon={Type}
            id="editor-font-size"
            label="Font size"
            value={String(preferences.fontSize)}
            onChange={(value) =>
              updatePreference("fontSize", Number(value) as EditorPreferences["fontSize"])
            }
            options={EDITOR_FONT_SIZE_OPTIONS.map((option) => ({
              label: `${option}px`,
              value: String(option),
            }))}
          />

          <PreferenceSelect
            icon={Code2}
            id="editor-tab-size"
            label="Tab size"
            value={String(preferences.tabSize)}
            onChange={(value) =>
              updatePreference("tabSize", Number(value) as EditorPreferences["tabSize"])
            }
            options={EDITOR_TAB_SIZE_OPTIONS.map((option) => ({
              label: `${option} spaces`,
              value: String(option),
            }))}
          />

          <PreferenceSelect
            icon={Palette}
            id="editor-theme"
            label="Theme"
            value={preferences.theme}
            onChange={(value) => updatePreference("theme", value as EditorTheme)}
            options={EDITOR_THEME_OPTIONS.map((option) => ({
              label: EDITOR_THEME_LABELS[option],
              value: option,
            }))}
          />

          <PreferenceToggle
            checked={preferences.wordWrap}
            icon={WrapText}
            id="editor-word-wrap"
            label="Word wrap"
            onChange={(checked) => updatePreference("wordWrap", checked)}
          />

          <PreferenceToggle
            checked={preferences.minimap}
            icon={Map}
            id="editor-minimap"
            label="Minimap"
            onChange={(checked) => updatePreference("minimap", checked)}
          />
        </div>
      </section>

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

function PreferenceSelect({
  icon: Icon,
  id,
  label,
  onChange,
  options,
  value,
}: {
  icon: LucideIcon;
  id: string;
  label: string;
  onChange: (value: string) => void;
  options: PreferenceSelectOption[];
  value: string;
}) {
  const [isOpen, setIsOpen] = useState(false);
  const selectedOption = options.find((option) => option.value === value) ?? options[0];

  return (
    <div
      className={cn(
        "group relative flex items-center gap-4 rounded-[1.5rem] border border-white/8 bg-white/[0.03] p-5 transition-all duration-200 hover:-translate-y-0.5 hover:border-sky-300/18 hover:bg-white/[0.045]",
        isOpen ? "z-40 border-sky-300/22 bg-white/[0.05]" : "z-0",
      )}
      onBlur={(event) => {
        const nextTarget = event.relatedTarget;

        if (!(nextTarget instanceof Node) || !event.currentTarget.contains(nextTarget)) {
          setIsOpen(false);
        }
      }}
    >
      <span className="flex size-10 shrink-0 items-center justify-center rounded-[1rem] bg-white/[0.04] text-zinc-300 transition-all duration-200 group-hover:bg-sky-300/10 group-hover:text-sky-100">
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-zinc-50">{label}</span>
      </span>
      <div className="relative">
        <button
          id={id}
          type="button"
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          onClick={() => setIsOpen((current) => !current)}
          onKeyDown={(event) => {
            if (event.key === "Escape") {
              setIsOpen(false);
            }
          }}
          className={cn(
            "inline-flex h-10 min-w-28 items-center justify-between gap-3 rounded-xl border px-3 text-sm font-medium outline-none transition-all duration-200 active:scale-[0.98]",
            isOpen
              ? "border-sky-300/40 bg-[#16202a] text-white shadow-[0_0_0_3px_rgba(56,189,248,0.1)]"
              : "border-white/12 bg-[#11131a] text-zinc-100 hover:border-white/20 hover:bg-[#171a22]",
          )}
        >
          {selectedOption.label}
          <ChevronDown
            className={cn(
              "size-4 text-zinc-400 transition-transform duration-200",
              isOpen ? "rotate-180 text-sky-200" : "",
            )}
          />
        </button>

        <div
          className={cn(
            "absolute right-0 top-12 z-50 min-w-36 origin-top-right overflow-hidden rounded-xl border border-sky-200/12 bg-[#141821] p-1.5 shadow-[0_20px_60px_rgba(0,0,0,0.42),0_0_0_1px_rgba(255,255,255,0.03)_inset] transition-all duration-200 ease-out",
            isOpen
              ? "pointer-events-auto translate-y-0 scale-100 opacity-100"
              : "pointer-events-none -translate-y-1 scale-95 opacity-0",
          )}
        >
          <div role="listbox" aria-labelledby={id} className="space-y-1">
            {options.map((option) => {
              const isSelected = option.value === value;

              return (
                <button
                  key={option.value}
                  type="button"
                  role="option"
                  aria-selected={isSelected}
                  onClick={() => {
                    onChange(option.value);
                    setIsOpen(false);
                  }}
                  className={cn(
                    "flex h-9 w-full items-center justify-between rounded-lg px-3 text-sm font-medium transition-all duration-150 active:scale-[0.98]",
                    isSelected
                      ? "bg-sky-300/18 text-sky-50"
                      : "text-zinc-200 hover:bg-white/[0.075] hover:text-white",
                  )}
                >
                  {option.label}
                  {isSelected ? <Check className="size-3.5 text-sky-200" /> : null}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
}

function PreferenceToggle({
  checked,
  icon: Icon,
  id,
  label,
  onChange,
}: {
  checked: boolean;
  icon: LucideIcon;
  id: string;
  label: string;
  onChange: (checked: boolean) => void;
}) {
  return (
    <button
      type="button"
      id={id}
      role="switch"
      aria-checked={checked}
      onClick={() => onChange(!checked)}
      className={cn(
        "group flex w-full items-center gap-4 rounded-[1.5rem] border p-5 text-left transition-all duration-200 active:scale-[0.985]",
        checked
          ? "border-sky-300/20 bg-sky-300/[0.055] shadow-[inset_0_1px_0_rgba(125,211,252,0.08)]"
          : "border-white/8 bg-white/[0.03]",
        "hover:-translate-y-0.5 hover:border-sky-300/22 hover:bg-white/[0.05] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-sky-300/30",
      )}
    >
      <span
        className={cn(
          "flex size-10 shrink-0 items-center justify-center rounded-[1rem] transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          checked
            ? "bg-sky-300/12 text-sky-100"
            : "bg-white/[0.04] text-zinc-300 group-hover:bg-sky-300/10 group-hover:text-sky-100",
        )}
      >
        <Icon className="size-4" />
      </span>
      <span className="min-w-0 flex-1">
        <span className="block text-sm font-semibold text-zinc-50">{label}</span>
      </span>
      <span
        className={cn(
          "relative h-7 w-12 shrink-0 rounded-full border transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
          checked
            ? "border-sky-300/35 bg-sky-300/25 shadow-[0_0_24px_rgba(56,189,248,0.16)]"
            : "border-white/10 bg-[#08090d]",
        )}
      >
        <span
          className={cn(
            "absolute top-1/2 size-5 -translate-y-1/2 rounded-full transition-all duration-300 ease-[cubic-bezier(0.22,1,0.36,1)]",
            checked
              ? "left-[1.35rem] bg-sky-100 shadow-[0_0_18px_rgba(186,230,253,0.42)]"
              : "left-1 bg-zinc-500 shadow-[0_6px_16px_rgba(0,0,0,0.38)]",
          )}
        />
      </span>
    </button>
  );
}

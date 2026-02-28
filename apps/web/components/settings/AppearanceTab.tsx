"use client";

import { useThemeStore } from "@/hooks/use-theme";
import type { ThemeMode } from "@/hooks/use-theme";
import { Sun, Moon, Monitor, Check } from "lucide-react";
import { cn } from "@/lib/utils";

const MODES: { value: ThemeMode; label: string; Icon: typeof Sun }[] = [
  { value: "light", label: "Light", Icon: Sun },
  { value: "dark", label: "Dark", Icon: Moon },
  { value: "system", label: "System", Icon: Monitor },
];

const ACCENTS = [
  { label: "Indigo", value: "#6366f1" },
  { label: "Blue", value: "#3b82f6" },
  { label: "Emerald", value: "#10b981" },
  { label: "Rose", value: "#f43f5e" },
  { label: "Amber", value: "#f59e0b" },
  { label: "Violet", value: "#8b5cf6" },
];

export function AppearanceTab() {
  const mode = useThemeStore((s) => s.mode);
  const accent = useThemeStore((s) => s.accent);
  const setMode = useThemeStore((s) => s.setMode);
  const setAccent = useThemeStore((s) => s.setAccent);

  return (
    <div className="max-w-md">
      {/* Theme mode */}
      <div className="mb-8">
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          Theme
        </h3>
        <p className="mt-1 mb-3 text-[13px] text-[var(--foreground-muted)]">
          Choose how Vault looks to you.
        </p>

        <div className="grid grid-cols-3 gap-2">
          {MODES.map((m) => {
            const isSelected = mode === m.value;
            return (
              <button
                key={m.value}
                aria-pressed={isSelected}
                aria-label={`${m.label} theme`}
                onClick={() => setMode(m.value)}
                className={cn(
                  "flex flex-col items-center gap-2 rounded-[var(--radius)] border p-4 transition-all duration-150 cursor-pointer",
                  isSelected
                    ? "border-[var(--primary)] bg-[var(--primary-lighter)] text-[var(--foreground)]"
                    : "border-[var(--border)] text-[var(--foreground-muted)] hover:border-[var(--foreground-subtle)]",
                )}
              >
                <m.Icon
                  size={20}
                  className={cn(isSelected ? "opacity-100" : "opacity-50")}
                />
                <span
                  className={cn(
                    "text-[13px]",
                    isSelected && "font-medium",
                  )}
                >
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accent colour */}
      <div>
        <h3 className="text-sm font-semibold text-[var(--foreground)]">
          Accent colour
        </h3>
        <p className="mt-1 mb-3 text-[13px] text-[var(--foreground-muted)]">
          Used for buttons, links, and active states.
        </p>

        <div className="flex gap-2.5">
          {ACCENTS.map((a) => {
            const isSelected = accent === a.value;
            return (
              <button
                key={a.value}
                aria-pressed={isSelected}
                aria-label={`${a.label} accent colour`}
                onClick={() => setAccent(a.value)}
                className={cn(
                  "relative h-8 w-8 cursor-pointer rounded-full border-0 transition-all duration-150",
                  isSelected &&
                    "ring-2 ring-offset-2 ring-offset-[var(--background)]",
                )}
                style={{
                  background: a.value,
                  ...(isSelected ? { "--tw-ring-color": a.value } as React.CSSProperties : {}),
                }}
              >
                {isSelected && (
                  <Check
                    size={14}
                    className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-white"
                  />
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

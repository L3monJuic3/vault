"use client";

import { useEffect } from "react";
import { useThemeStore } from "@/hooks/use-theme";

function resolveTheme(mode: string): "light" | "dark" {
  if (mode === "system") {
    if (typeof window === "undefined") return "dark";
    return window.matchMedia("(prefers-color-scheme: dark)").matches
      ? "dark"
      : "light";
  }
  return mode as "light" | "dark";
}

/**
 * Darken a hex colour by a percentage (0–1) for hover states.
 */
function darken(hex: string, amount = 0.12): string {
  const num = parseInt(hex.replace("#", ""), 16);
  const r = Math.max(0, Math.round(((num >> 16) & 0xff) * (1 - amount)));
  const g = Math.max(0, Math.round(((num >> 8) & 0xff) * (1 - amount)));
  const b = Math.max(0, Math.round((num & 0xff) * (1 - amount)));
  return `#${((r << 16) | (g << 8) | b).toString(16).padStart(6, "0")}`;
}

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const mode = useThemeStore((s) => s.mode);
  const accent = useThemeStore((s) => s.accent);

  // Apply data-theme attribute and colorScheme
  useEffect(() => {
    const apply = () => {
      const resolved = resolveTheme(mode);
      document.documentElement.setAttribute("data-theme", resolved);
      document.documentElement.style.colorScheme = resolved;
    };

    apply();

    // For system mode, listen to OS preference changes
    if (mode === "system") {
      const mql = window.matchMedia("(prefers-color-scheme: dark)");
      const handler = () => apply();
      mql.addEventListener("change", handler);
      return () => mql.removeEventListener("change", handler);
    }
  }, [mode]);

  // Apply accent colour as CSS variable override
  useEffect(() => {
    if (accent) {
      document.documentElement.style.setProperty("--primary", accent);
      document.documentElement.style.setProperty(
        "--primary-hover",
        darken(accent, 0.12),
      );
      document.documentElement.style.setProperty("--ring", accent);
    }
  }, [accent]);

  return <>{children}</>;
}

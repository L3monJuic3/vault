"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";

export type ThemeMode = "light" | "dark" | "system";

interface ThemeState {
  mode: ThemeMode;
  accent: string;
  setMode: (mode: ThemeMode) => void;
  setAccent: (accent: string) => void;
}

export const useThemeStore = create<ThemeState>()(
  persist(
    (set) => ({
      mode: "system",
      accent: "#6366f1",
      setMode: (mode) => set({ mode }),
      setAccent: (accent) => set({ accent }),
    }),
    {
      name: "vault-theme",
    },
  ),
);

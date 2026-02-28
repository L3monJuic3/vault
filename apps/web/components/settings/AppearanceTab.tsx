"use client";

import { useThemeStore } from "@/hooks/use-theme";
import type { ThemeMode } from "@/hooks/use-theme";

const MODES: { value: ThemeMode; label: string; icon: React.ReactNode }[] = [
  { value: "light", label: "Light", icon: <SunIcon /> },
  { value: "dark", label: "Dark", icon: <MoonIcon /> },
  { value: "system", label: "System", icon: <MonitorIcon /> },
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
    <div style={{ maxWidth: "480px" }}>
      {/* Theme mode */}
      <div style={{ marginBottom: "32px" }}>
        <h3
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--foreground)",
            marginBottom: "4px",
          }}
        >
          Theme
        </h3>
        <p
          style={{
            fontSize: "13px",
            color: "var(--muted-foreground)",
            marginBottom: "12px",
          }}
        >
          Choose how Vault looks to you.
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "8px" }}>
          {MODES.map((m) => {
            const isSelected = mode === m.value;
            return (
              <button
                key={m.value}
                onClick={() => setMode(m.value)}
                style={{
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: "8px",
                  padding: "16px 12px",
                  borderRadius: "var(--radius)",
                  border: `1px solid ${isSelected ? "var(--primary)" : "var(--border)"}`,
                  background: isSelected ? "rgba(99, 102, 241, 0.06)" : "transparent",
                  cursor: "pointer",
                  transition: "all 0.15s ease",
                  color: isSelected ? "var(--foreground)" : "var(--muted-foreground)",
                }}
              >
                <span style={{ opacity: isSelected ? 1 : 0.6 }}>{m.icon}</span>
                <span style={{ fontSize: "13px", fontWeight: isSelected ? 500 : 400 }}>
                  {m.label}
                </span>
              </button>
            );
          })}
        </div>
      </div>

      {/* Accent colour */}
      <div>
        <h3
          style={{
            fontSize: "14px",
            fontWeight: 600,
            color: "var(--foreground)",
            marginBottom: "4px",
          }}
        >
          Accent colour
        </h3>
        <p
          style={{
            fontSize: "13px",
            color: "var(--muted-foreground)",
            marginBottom: "12px",
          }}
        >
          Used for buttons, links, and active states.
        </p>

        <div style={{ display: "flex", gap: "10px" }}>
          {ACCENTS.map((a) => {
            const isSelected = accent === a.value;
            return (
              <button
                key={a.value}
                onClick={() => setAccent(a.value)}
                title={a.label}
                style={{
                  width: "32px",
                  height: "32px",
                  borderRadius: "50%",
                  background: a.value,
                  border: "none",
                  cursor: "pointer",
                  position: "relative",
                  outline: isSelected
                    ? `2px solid ${a.value}`
                    : "none",
                  outlineOffset: "3px",
                  transition: "outline 0.15s ease",
                }}
              >
                {isSelected && (
                  <svg
                    width="14"
                    height="14"
                    viewBox="0 0 14 14"
                    fill="none"
                    style={{
                      position: "absolute",
                      top: "50%",
                      left: "50%",
                      transform: "translate(-50%, -50%)",
                    }}
                  >
                    <path
                      d="M3 7L6 10L11 4"
                      stroke="white"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}

/* ─── Inline SVG icons ─── */

function SunIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="10" cy="10" r="3.5" />
      <path d="M10 2.5V4.5M10 15.5V17.5M2.5 10H4.5M15.5 10H17.5M4.7 4.7L6.1 6.1M13.9 13.9L15.3 15.3M4.7 15.3L6.1 13.9M13.9 6.1L15.3 4.7" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
      <path d="M17 11.5A7.5 7.5 0 1 1 8.5 3c.3 0 .5 0 .8.04A5.5 5.5 0 0 0 16.96 10.7c.04.26.04.53.04.8Z" />
    </svg>
  );
}

function MonitorIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <rect x="2" y="3" width="16" height="11" rx="1.5" />
      <path d="M7 17.5H13M10 14V17.5" />
    </svg>
  );
}

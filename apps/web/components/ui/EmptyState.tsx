"use client";

import type { LucideIcon } from "lucide-react";
import { cn } from "@/lib/utils";

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description?: string;
  action?: React.ReactNode;
  className?: string;
}

export function EmptyState({
  icon: Icon,
  title,
  description,
  action,
  className,
}: EmptyStateProps) {
  return (
    <div
      className={cn(
        "flex flex-col items-center justify-center text-center",
        className,
      )}
      style={{
        padding: "var(--space-10) var(--space-6)",
        border: "1px dashed var(--border)",
        borderRadius: "var(--radius-lg)",
        background: "var(--accent-glow)",
      }}
    >
      <div
        style={{
          width: 48,
          height: 48,
          borderRadius: "var(--radius-lg)",
          background: "var(--surface-raised)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: "var(--space-4)",
        }}
      >
        <Icon
          size={22}
          style={{ color: "var(--foreground-muted)" }}
        />
      </div>
      <h3
        style={{
          fontSize: 15,
          fontWeight: 500,
          color: "var(--foreground)",
          marginBottom: "var(--space-1)",
        }}
      >
        {title}
      </h3>
      {description && (
        <p
          style={{
            fontSize: 13,
            color: "var(--foreground-muted)",
            maxWidth: 320,
            lineHeight: "20px",
          }}
        >
          {description}
        </p>
      )}
      {action && (
        <div style={{ marginTop: "var(--space-5)" }}>
          {action}
        </div>
      )}
    </div>
  );
}

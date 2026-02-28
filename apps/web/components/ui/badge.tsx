import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?:
    | "default"
    | "secondary"
    | "outline"
    | "success"
    | "danger"
    | "warning"
    | "accent"
    | "muted"
    | "destructive"
    | "info";
}

export function Badge({
  className,
  variant = "default",
  style,
  ...props
}: BadgeProps) {
  const variantStyle: React.CSSProperties = {
    default: {
      background: "var(--surface-raised)",
      color: "var(--foreground-secondary)",
    },
    secondary: {
      background: "var(--surface-raised)",
      color: "var(--foreground-secondary)",
    },
    outline: {
      background: "transparent",
      border: "1px solid var(--border)",
      color: "var(--foreground)",
    },
    success: {
      background: "var(--income-muted)",
      color: "var(--income)",
    },
    danger: {
      background: "var(--spending-muted)",
      color: "var(--spending)",
    },
    destructive: {
      background: "var(--spending-muted)",
      color: "var(--spending)",
    },
    warning: {
      background: "var(--warning-muted)",
      color: "var(--warning)",
    },
    accent: {
      background: "var(--accent-muted)",
      color: "var(--accent)",
    },
    info: {
      background: "var(--accent-muted)",
      color: "var(--accent)",
    },
    muted: {
      background: "rgba(255, 255, 255, 0.04)",
      color: "var(--foreground-muted)",
    },
  }[variant];

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full text-xs font-medium",
        className,
      )}
      style={{
        height: "22px",
        padding: "0 8px",
        fontSize: "11px",
        fontWeight: 500,
        ...variantStyle,
        ...style,
      }}
      {...props}
    />
  );
}

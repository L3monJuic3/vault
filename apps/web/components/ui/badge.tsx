import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "destructive" | "warning" | "info";
}

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  const variants = {
    default: "bg-[var(--primary)] text-[var(--primary-foreground)]",
    secondary: "bg-[var(--muted)] text-[var(--muted-foreground)]",
    outline: "border border-[var(--border)] text-[var(--foreground)]",
    success: "bg-[rgba(16,185,129,0.12)] text-[var(--success)] border border-[rgba(16,185,129,0.2)]",
    destructive: "bg-[rgba(239,68,68,0.12)] text-[var(--destructive)] border border-[rgba(239,68,68,0.2)]",
    warning: "bg-[rgba(245,158,11,0.12)] text-[var(--warning)] border border-[rgba(245,158,11,0.2)]",
    info: "bg-[rgba(99,102,241,0.12)] text-[var(--primary)] border border-[rgba(99,102,241,0.2)]",
  };

  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold transition-colors",
        variants[variant],
        className
      )}
      {...props}
    />
  );
}

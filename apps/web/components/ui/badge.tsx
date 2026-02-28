import { cn } from "@/lib/utils";

interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: "default" | "secondary" | "outline" | "success" | "destructive" | "warning" | "info";
}

const variants = {
  default: "bg-[var(--primary)] text-[var(--primary-foreground)]",
  secondary: "bg-[var(--muted)] text-[var(--muted-foreground)]",
  outline: "border border-[var(--border)] text-[var(--foreground)]",
  success:
    "bg-[var(--success-light)] text-[var(--success)] border border-[var(--success)]/20",
  destructive:
    "bg-[var(--destructive-light)] text-[var(--destructive)] border border-[var(--destructive)]/20",
  warning:
    "bg-[var(--warning-light)] text-[var(--warning)] border border-[var(--warning)]/20",
  info:
    "bg-[var(--primary-light)] text-[var(--primary)] border border-[var(--primary)]/20",
};

export function Badge({ className, variant = "default", ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium transition-colors",
        variants[variant],
        className,
      )}
      {...props}
    />
  );
}

import { cn } from "@/lib/utils";

interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "default" | "secondary" | "outline" | "ghost" | "destructive";
  size?: "default" | "sm" | "lg" | "icon";
}

const variants = {
  default:
    "bg-[var(--primary)] text-[var(--primary-foreground)] shadow-[var(--shadow-xs)] hover:bg-[var(--primary-hover)] active:scale-[0.98]",
  secondary:
    "bg-[var(--muted)] text-[var(--foreground)] hover:bg-[var(--surface-raised)] active:scale-[0.98]",
  outline:
    "border border-[var(--border)] bg-transparent hover:bg-[var(--muted)] hover:border-[var(--foreground-subtle)] active:scale-[0.98]",
  ghost:
    "hover:bg-[var(--muted)] active:scale-[0.98]",
  destructive:
    "bg-[var(--destructive)] text-white shadow-[var(--shadow-xs)] hover:brightness-110 active:scale-[0.98]",
};

const sizes = {
  default: "h-9 px-4 py-2",
  sm: "h-8 px-3 text-xs",
  lg: "h-11 px-6",
  icon: "h-9 w-9",
};

export function Button({
  className,
  variant = "default",
  size = "default",
  ...props
}: ButtonProps) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center gap-2 rounded-[var(--radius)] text-sm font-medium",
        "transition-all duration-150 ease-out",
        "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)] focus-visible:ring-offset-1 focus-visible:ring-offset-[var(--background)]",
        "disabled:pointer-events-none disabled:opacity-50",
        variants[variant],
        sizes[size],
        className,
      )}
      {...props}
    />
  );
}

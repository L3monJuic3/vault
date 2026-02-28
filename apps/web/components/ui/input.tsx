import type { InputHTMLAttributes } from "react";
import { cn } from "@/lib/utils";

type InputProps = InputHTMLAttributes<HTMLInputElement>;

export function Input({ className, ...props }: InputProps) {
  return (
    <input
      className={cn(
        "flex h-9 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm",
        "placeholder:text-[var(--foreground-subtle)]",
        "focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/40 focus:border-[var(--ring)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors duration-150",
        className,
      )}
      {...props}
    />
  );
}

import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "h-9 w-full rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface)] px-3 py-2 text-sm",
        "focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/40 focus:border-[var(--ring)]",
        "disabled:cursor-not-allowed disabled:opacity-50",
        "transition-colors duration-150",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

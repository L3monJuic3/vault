import { cn } from "@/lib/utils";

interface SelectProps extends React.SelectHTMLAttributes<HTMLSelectElement> {
  children: React.ReactNode;
}

export function Select({ className, children, ...props }: SelectProps) {
  return (
    <select
      className={cn(
        "h-10 w-full rounded-md border border-[var(--border)] bg-transparent px-3 py-2 text-sm",
        "focus:outline-none focus:ring-1 focus:ring-[var(--ring)] focus:border-[var(--ring)]",
        className,
      )}
      {...props}
    >
      {children}
    </select>
  );
}

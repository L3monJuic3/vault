import { cn } from "@/lib/utils";

interface PageWrapperProps {
  children: React.ReactNode;
  maxWidth?: "sm" | "md" | "lg" | "xl" | "2xl" | "7xl";
  className?: string;
}

const maxWidthClasses: Record<string, string> = {
  sm: "max-w-2xl",
  md: "max-w-3xl",
  lg: "max-w-4xl",
  xl: "max-w-5xl",
  "2xl": "max-w-6xl",
  "7xl": "max-w-7xl",
};

export function PageWrapper({
  children,
  maxWidth = "7xl",
  className,
}: PageWrapperProps) {
  return (
    <div
      className={cn(
        "mx-auto px-6 py-8 lg:px-8",
        maxWidthClasses[maxWidth],
        className,
      )}
    >
      {children}
    </div>
  );
}

import { cn } from "@/lib/utils";

interface CardProps extends React.HTMLAttributes<HTMLDivElement> {
  children: React.ReactNode;
  variant?: "default" | "elevated" | "accent" | "glass";
  padding?: "none" | "sm" | "md" | "lg";
  hover?: boolean;
  interactive?: boolean; // backward compat alias for hover
}

const paddingMap = {
  none: "0",
  sm: "var(--space-3)",
  md: "var(--space-5)",
  lg: "var(--space-6)",
};

export function Card({
  className,
  children,
  variant = "default",
  padding = "md",
  hover,
  interactive,
  style,
  onClick,
  ...props
}: CardProps) {
  const isHoverable = hover ?? interactive;

  const variantStyles: React.CSSProperties = {
    default: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
    },
    elevated: {
      background: "var(--surface-raised)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
      boxShadow: "var(--shadow-sm)",
    },
    accent: {
      background: "var(--surface)",
      border: "1px solid var(--border)",
      borderLeft: "2px solid var(--accent)",
      borderRadius: "var(--radius-lg)",
    },
    glass: {
      background: "rgba(17, 17, 20, 0.8)",
      backdropFilter: "blur(12px)",
      WebkitBackdropFilter: "blur(12px)",
      border: "1px solid var(--border)",
      borderRadius: "var(--radius-lg)",
    },
  }[variant];

  return (
    <div
      className={cn(
        "transition-all duration-150 ease-out",
        isHoverable && "cursor-pointer",
        className,
      )}
      style={{
        ...variantStyles,
        padding: paddingMap[padding],
        ...(isHoverable
          ? { transition: "all 0.15s ease" }
          : {}),
        ...style,
      }}
      onMouseEnter={
        isHoverable
          ? (e) => {
              const el = e.currentTarget;
              el.style.borderColor = "var(--border-hover)";
              el.style.transform = "translateY(-1px)";
              el.style.boxShadow = "var(--shadow-sm)";
            }
          : undefined
      }
      onMouseLeave={
        isHoverable
          ? (e) => {
              const el = e.currentTarget;
              el.style.borderColor = "";
              el.style.transform = "";
              el.style.boxShadow =
                variant === "elevated" ? "var(--shadow-sm)" : "";
            }
          : undefined
      }
      onClick={onClick}
      {...props}
    >
      {children}
    </div>
  );
}

export function CardHeader({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
  return (
    <div className={cn("flex flex-col space-y-1.5 p-5", className)} {...props}>
      {children}
    </div>
  );
}

export function CardTitle({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLHeadingElement>) {
  return (
    <h3
      className={cn(
        "text-sm font-medium leading-none tracking-tight",
        className,
      )}
      {...props}
    >
      {children}
    </h3>
  );
}

export function CardContent({
  className,
  children,
  ...props
}: React.HTMLAttributes<HTMLDivElement> & { children: React.ReactNode }) {
  return (
    <div className={cn("px-5 pb-5 pt-0", className)} {...props}>
      {children}
    </div>
  );
}

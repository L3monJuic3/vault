import { cn } from "@/lib/utils";

interface PageHeaderProps {
  title: string;
  subtitle?: string;
  children?: React.ReactNode;
  className?: string;
}

export function PageHeader({
  title,
  subtitle,
  children,
  className,
}: PageHeaderProps) {
  return (
    <div className={cn("mb-8 flex items-start justify-between", className)}>
      <div>
        <h1 className="text-page-title">{title}</h1>
        {subtitle && <p className="text-page-subtitle">{subtitle}</p>}
      </div>
      {children && (
        <div className="flex items-center gap-2">{children}</div>
      )}
    </div>
  );
}

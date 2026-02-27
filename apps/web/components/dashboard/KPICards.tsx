"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCountUp } from "@/hooks/use-count-up";
import type { DashboardStats } from "@vault/shared-types";

interface KPICardsProps {
  stats?: DashboardStats;
  isLoading?: boolean;
}

function formatCurrency(amount: number, currency = "GBP"): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency,
  }).format(amount);
}

const kpiConfig = [
  {
    key: "total_balance" as const,
    label: "Total Balance",
    icon: "\u{1F4B0}",
    colorClass: "text-[var(--foreground)]",
    glowColor: "var(--foreground)",
  },
  {
    key: "monthly_income" as const,
    label: "Monthly Income",
    icon: "\u{1F4C8}",
    colorClass: "text-[var(--success)]",
    glowColor: "var(--success)",
  },
  {
    key: "monthly_spending" as const,
    label: "Monthly Spending",
    icon: "\u{1F4C9}",
    colorClass: "text-[var(--destructive)]",
    glowColor: "var(--destructive)",
  },
  {
    key: "subscription_total" as const,
    label: "Subscriptions",
    icon: "\u{1F4F1}",
    colorClass: "text-[var(--primary)]",
    glowColor: "var(--primary)",
  },
];

function AnimatedValue({
  value,
  colorClass,
}: {
  value: number;
  colorClass: string;
}) {
  const animated = useCountUp(value, 800);

  return (
    <p
      className={`mt-2 text-2xl font-bold ${colorClass}`}
      style={{ fontFamily: "var(--font-mono)" }}
    >
      {formatCurrency(animated)}
    </p>
  );
}

export function KPICards({ stats, isLoading }: KPICardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpiConfig.map((kpi, index) => (
        <Card
          key={kpi.key}
          glowColor={kpi.glowColor}
          className={`animate-fade-in-up stagger-${index + 1}`}
        >
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--muted-foreground)]">
                {kpi.label}
              </p>
              <span className="text-xl">{kpi.icon}</span>
            </div>
            {isLoading ? (
              <Skeleton className="mt-2 h-8 w-24" />
            ) : stats ? (
              <AnimatedValue
                value={stats[kpi.key]}
                colorClass={kpi.colorClass}
              />
            ) : (
              <p className={`mt-2 text-2xl font-bold ${kpi.colorClass}`}>
                &mdash;
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

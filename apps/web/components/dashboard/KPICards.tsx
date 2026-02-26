"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
    colorClass: "text-[var(--primary)]",
  },
  {
    key: "monthly_income" as const,
    label: "Monthly Income",
    icon: "\u{1F4C8}",
    colorClass: "text-[var(--success)]",
  },
  {
    key: "monthly_spending" as const,
    label: "Monthly Spending",
    icon: "\u{1F4C9}",
    colorClass: "text-[var(--destructive)]",
  },
  {
    key: "subscription_total" as const,
    label: "Subscriptions",
    icon: "\u{1F4F1}",
    colorClass: "text-purple-500",
  },
];

export function KPICards({ stats, isLoading }: KPICardsProps) {
  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpiConfig.map((kpi) => (
        <Card key={kpi.key}>
          <CardContent className="p-6">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--muted-foreground)]">
                {kpi.label}
              </p>
              <span className="text-xl">{kpi.icon}</span>
            </div>
            {isLoading ? (
              <Skeleton className="mt-2 h-8 w-24" />
            ) : (
              <p className={`mt-2 text-2xl font-bold ${kpi.colorClass}`}>
                {stats ? formatCurrency(stats[kpi.key]) : "\u2014"}
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

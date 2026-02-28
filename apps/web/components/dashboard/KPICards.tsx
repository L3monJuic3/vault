"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useCountUp } from "@/hooks/use-count-up";
import { Wallet, TrendingUp, TrendingDown, CreditCard } from "lucide-react";
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
    Icon: Wallet,
    colorClass: "text-[var(--foreground)]",
    iconColor: "text-[var(--foreground-muted)]",
  },
  {
    key: "monthly_income" as const,
    label: "Monthly Income",
    Icon: TrendingUp,
    colorClass: "text-[var(--success)]",
    iconColor: "text-[var(--success)]",
  },
  {
    key: "monthly_spending" as const,
    label: "Monthly Spending",
    Icon: TrendingDown,
    colorClass: "text-[var(--destructive)]",
    iconColor: "text-[var(--destructive)]",
  },
  {
    key: "subscription_total" as const,
    label: "Subscriptions",
    Icon: CreditCard,
    colorClass: "text-[var(--primary)]",
    iconColor: "text-[var(--primary)]",
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
    <p className={`mt-2 text-xl font-bold font-mono ${colorClass}`}>
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
          interactive
          className={`animate-fade-in-up stagger-${index + 1}`}
        >
          <CardContent className="p-5">
            <div className="flex items-center justify-between">
              <p className="text-sm font-medium text-[var(--muted-foreground)]">
                {kpi.label}
              </p>
              <div className="flex h-9 w-9 items-center justify-center rounded-[var(--radius)] bg-[var(--muted)]">
                <kpi.Icon size={18} className={kpi.iconColor} />
              </div>
            </div>
            {isLoading ? (
              <Skeleton className="mt-2 h-8 w-24" />
            ) : stats ? (
              <AnimatedValue
                value={stats[kpi.key]}
                colorClass={kpi.colorClass}
              />
            ) : (
              <p className={`mt-2 text-xl font-bold font-mono ${kpi.colorClass}`}>
                &mdash;
              </p>
            )}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}

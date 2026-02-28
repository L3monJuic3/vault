"use client";

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
    valueColor: "var(--foreground)",
    iconColor: "var(--foreground-muted)",
    accent: true,
  },
  {
    key: "monthly_income" as const,
    label: "Monthly Income",
    Icon: TrendingUp,
    valueColor: "var(--income)",
    iconColor: "var(--income)",
    accent: false,
  },
  {
    key: "monthly_spending" as const,
    label: "Monthly Spending",
    Icon: TrendingDown,
    valueColor: "var(--spending)",
    iconColor: "var(--spending)",
    accent: false,
  },
  {
    key: "subscription_total" as const,
    label: "Subscriptions",
    Icon: CreditCard,
    valueColor: "var(--accent)",
    iconColor: "var(--accent)",
    accent: false,
  },
];

function AnimatedValue({
  value,
  color,
}: {
  value: number;
  color: string;
}) {
  const animated = useCountUp(value, 800);
  return (
    <span className="mono-lg" style={{ color }}>
      {formatCurrency(animated)}
    </span>
  );
}

function KPISkeleton() {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "var(--space-5)",
      }}
    >
      <div className="skeleton" style={{ width: 80, height: 12, marginBottom: 16 }} />
      <div className="skeleton" style={{ width: 140, height: 32 }} />
    </div>
  );
}

export function KPICards({ stats, isLoading }: KPICardsProps) {
  if (isLoading) {
    return (
      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {Array.from({ length: 4 }).map((_, i) => (
          <KPISkeleton key={i} />
        ))}
      </div>
    );
  }

  return (
    <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {kpiConfig.map((kpi, index) => (
        <div
          key={kpi.key}
          className={`animate-card-enter stagger-${index + 1}`}
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            padding: "var(--space-5)",
            transition: "all 0.15s ease",
            ...(kpi.accent ? { boxShadow: "var(--shadow-glow)" } : {}),
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = "var(--border-hover)";
            e.currentTarget.style.transform = "translateY(-1px)";
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = "";
            e.currentTarget.style.transform = "";
          }}
        >
          <div className="flex items-center justify-between" style={{ marginBottom: 12 }}>
            <span className="label">{kpi.label}</span>
            <kpi.Icon size={16} style={{ color: kpi.iconColor }} />
          </div>
          {stats ? (
            <AnimatedValue value={stats[kpi.key]} color={kpi.valueColor} />
          ) : (
            <span className="mono-lg" style={{ color: kpi.valueColor }}>
              &mdash;
            </span>
          )}
        </div>
      ))}
    </div>
  );
}

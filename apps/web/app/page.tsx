"use client";

import { KPICards } from "@/components/dashboard/KPICards";
import { CategoryChart } from "@/components/dashboard/CategoryChart";
import { SpendTimeline } from "@/components/dashboard/SpendTimeline";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { TopMerchants } from "@/components/dashboard/TopMerchants";
import { useDashboardStats } from "@/hooks/use-dashboard";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  const now = new Date();
  const monthLabel = now.toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <div style={{ padding: "32px 32px 48px", maxWidth: 1280, margin: "0 auto" }}>
      {/* Page header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: "-0.025em",
            color: "var(--foreground)",
            lineHeight: "32px",
          }}
        >
          Dashboard
        </h1>
        <p style={{ fontSize: 13, color: "var(--foreground-muted)", marginTop: 4 }}>
          {monthLabel}
        </p>
      </div>

      {/* KPI row */}
      <div style={{ marginBottom: 24 }}>
        <KPICards stats={stats} isLoading={statsLoading} />
      </div>

      {/* Charts row: SpendTimeline (1fr) + CategoryChart (340px) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: 16,
          marginBottom: 16,
        }}
        className="max-lg:grid-cols-1"
      >
        <SpendTimeline />
        <CategoryChart />
      </div>

      {/* Bottom row: RecentTransactions (1fr) + TopMerchants (340px) */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: 16,
        }}
        className="max-lg:grid-cols-1"
      >
        <RecentTransactions />
        <TopMerchants />
      </div>
    </div>
  );
}

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
  const monthLabel = now.toLocaleString("en-GB", { month: "long", year: "numeric" });

  return (
    <div
      style={{
        padding: "28px 32px",
        maxWidth: "1400px",
        margin: "0 auto",
      }}
    >
      {/* Header */}
      <div style={{ marginBottom: "24px" }}>
        <h1
          style={{
            fontSize: "20px",
            fontWeight: 600,
            color: "var(--foreground)",
            letterSpacing: "-0.02em",
          }}
        >
          Dashboard
        </h1>
        <p
          style={{
            fontSize: "13px",
            color: "var(--foreground-muted)",
            marginTop: "2px",
          }}
        >
          {monthLabel}
        </p>
      </div>

      {/* KPI row */}
      <div style={{ marginBottom: "24px" }}>
        <KPICards stats={stats} isLoading={statsLoading} />
      </div>

      {/* Charts row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 340px",
          gap: "16px",
          marginBottom: "16px",
        }}
      >
        <SpendTimeline />
        <CategoryChart />
      </div>

      {/* Bottom row */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 300px",
          gap: "16px",
        }}
      >
        <RecentTransactions />
        <TopMerchants />
      </div>
    </div>
  );
}

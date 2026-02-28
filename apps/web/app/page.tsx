"use client";

import { KPICards } from "@/components/dashboard/KPICards";
import { CategoryChart } from "@/components/dashboard/CategoryChart";
import { SpendTimeline } from "@/components/dashboard/SpendTimeline";
import { RecentTransactions } from "@/components/dashboard/RecentTransactions";
import { TopMerchants } from "@/components/dashboard/TopMerchants";
import { PageWrapper, PageHeader } from "@/components/ui";
import { useDashboardStats } from "@/hooks/use-dashboard";

export default function DashboardPage() {
  const { data: stats, isLoading: statsLoading } = useDashboardStats();

  const now = new Date();
  const monthLabel = now.toLocaleString("en-GB", {
    month: "long",
    year: "numeric",
  });

  return (
    <PageWrapper maxWidth="2xl">
      <PageHeader title="Dashboard" subtitle={monthLabel} />

      {/* KPI row */}
      <div className="mb-6">
        <KPICards stats={stats} isLoading={statsLoading} />
      </div>

      {/* Charts row */}
      <div className="animate-fade-in-up stagger-3 mb-4 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_340px]">
        <SpendTimeline />
        <CategoryChart />
      </div>

      {/* Bottom row */}
      <div className="animate-fade-in-up stagger-5 grid grid-cols-1 gap-4 lg:grid-cols-[1fr_300px]">
        <RecentTransactions />
        <TopMerchants />
      </div>
    </PageWrapper>
  );
}

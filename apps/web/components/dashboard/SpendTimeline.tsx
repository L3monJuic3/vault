"use client";

import { useState } from "react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useSpendTimeline } from "@/hooks/use-dashboard";

type Granularity = "daily" | "weekly" | "monthly";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
    maximumFractionDigits: 0,
  }).format(amount);
}

function formatDate(dateStr: string, granularity: Granularity): string {
  const date = new Date(dateStr);
  if (granularity === "daily") {
    return date.toLocaleDateString("en-GB", { day: "numeric", month: "short" });
  }
  if (granularity === "weekly") {
    return `w/c ${date.toLocaleDateString("en-GB", { day: "numeric", month: "short" })}`;
  }
  return date.toLocaleDateString("en-GB", { month: "short", year: "2-digit" });
}

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ value: number; dataKey: string }>;
  label?: string;
}

function CustomTooltip({ active, payload, label }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  return (
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 shadow-md">
      <p className="mb-1 text-sm font-medium">{label}</p>
      {payload.map((entry) => (
        <p
          key={entry.dataKey}
          className="text-sm"
          style={{
            color:
              entry.dataKey === "income"
                ? "var(--success)"
                : entry.dataKey === "spending"
                  ? "var(--destructive)"
                  : "var(--primary)",
          }}
        >
          {entry.dataKey}: {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

export function SpendTimeline() {
  const [granularity, setGranularity] = useState<Granularity>("monthly");
  const { data, isLoading } = useSpendTimeline(granularity);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spend Timeline</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="h-64 w-full" />
        </CardContent>
      </Card>
    );
  }

  const chartData = (data || []).map((point) => ({
    ...point,
    dateLabel: formatDate(point.date, granularity),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Spend Timeline</CardTitle>
          <select
            value={granularity}
            onChange={(e) => setGranularity(e.target.value as Granularity)}
            className="rounded-md border border-[var(--border)] bg-[var(--background)] px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-[var(--ring)]"
          >
            <option value="daily">Daily</option>
            <option value="weekly">Weekly</option>
            <option value="monthly">Monthly</option>
          </select>
        </CardHeader>
        <CardContent>
          {!chartData.length ? (
            <p className="py-8 text-center text-[var(--muted-foreground)]">
              No timeline data yet
            </p>
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <AreaChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" stroke="var(--border)" />
                <XAxis
                  dataKey="dateLabel"
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                />
                <YAxis
                  tick={{ fontSize: 12, fill: "var(--muted-foreground)" }}
                  tickFormatter={(v: number) => formatCurrency(v)}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area
                  type="monotone"
                  dataKey="income"
                  stackId="1"
                  stroke="var(--success)"
                  fill="var(--success)"
                  fillOpacity={0.3}
                />
                <Area
                  type="monotone"
                  dataKey="spending"
                  stackId="2"
                  stroke="var(--destructive)"
                  fill="var(--destructive)"
                  fillOpacity={0.3}
                />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

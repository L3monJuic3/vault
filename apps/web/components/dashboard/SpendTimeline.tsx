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
    <div
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "10px 14px",
        boxShadow: "var(--shadow-md)",
      }}
    >
      <p
        style={{
          fontSize: 12,
          color: "var(--foreground-muted)",
          marginBottom: 6,
          fontFamily: "var(--font-mono)",
        }}
      >
        {label}
      </p>
      {payload.map((entry) => (
        <p
          key={entry.dataKey}
          style={{
            fontSize: 13,
            fontWeight: 500,
            fontFamily: "var(--font-mono)",
            color:
              entry.dataKey === "income"
                ? "var(--income)"
                : "var(--spending)",
          }}
        >
          {entry.dataKey === "income" ? "+" : ""}
          {formatCurrency(entry.value)}
        </p>
      ))}
    </div>
  );
}

const granularityOptions: { value: Granularity; label: string }[] = [
  { value: "daily", label: "D" },
  { value: "weekly", label: "W" },
  { value: "monthly", label: "M" },
];

export function SpendTimeline() {
  const [granularity, setGranularity] = useState<Granularity>("monthly");
  const { data, isLoading } = useSpendTimeline(granularity);

  if (isLoading) {
    return (
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-5)",
        }}
      >
        <div className="label" style={{ marginBottom: 16 }}>Spend Timeline</div>
        <div className="skeleton" style={{ width: "100%", height: 280 }} />
      </div>
    );
  }

  const chartData = (data || []).map((point) => ({
    ...point,
    dateLabel: formatDate(point.date, granularity),
  }));

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.1 }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-5)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            marginBottom: 20,
          }}
        >
          <span className="label">Spend Timeline</span>
          <div style={{ display: "flex", gap: 2 }}>
            {granularityOptions.map((opt) => (
              <button
                key={opt.value}
                onClick={() => setGranularity(opt.value)}
                style={{
                  padding: "4px 10px",
                  fontSize: 11,
                  fontWeight: 500,
                  fontFamily: "var(--font-mono)",
                  borderRadius: "var(--radius-sm)",
                  border: "none",
                  cursor: "pointer",
                  transition: "all 0.12s ease",
                  background:
                    granularity === opt.value
                      ? "var(--accent-muted)"
                      : "transparent",
                  color:
                    granularity === opt.value
                      ? "var(--accent)"
                      : "var(--foreground-muted)",
                }}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Chart */}
        {!chartData.length ? (
          <p
            style={{
              textAlign: "center",
              padding: "40px 0",
              fontSize: 13,
              color: "var(--foreground-muted)",
            }}
          >
            No timeline data yet
          </p>
        ) : (
          <ResponsiveContainer width="100%" height={280}>
            <AreaChart data={chartData}>
              <defs>
                <linearGradient id="incomeGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--income)" stopOpacity={0.25} />
                  <stop offset="100%" stopColor="var(--income)" stopOpacity={0} />
                </linearGradient>
                <linearGradient id="spendingGrad" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="0%" stopColor="var(--spending)" stopOpacity={0.2} />
                  <stop offset="100%" stopColor="var(--spending)" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid
                strokeDasharray="3 3"
                stroke="var(--border)"
                vertical={false}
              />
              <XAxis
                dataKey="dateLabel"
                tick={{
                  fontSize: 11,
                  fill: "var(--foreground-muted)",
                  fontFamily: "var(--font-mono)",
                }}
                axisLine={{ stroke: "var(--border)" }}
                tickLine={false}
              />
              <YAxis
                tick={{
                  fontSize: 11,
                  fill: "var(--foreground-muted)",
                  fontFamily: "var(--font-mono)",
                }}
                tickFormatter={(v: number) => `£${(v / 1000).toFixed(0)}k`}
                axisLine={false}
                tickLine={false}
                width={45}
              />
              <Tooltip content={<CustomTooltip />} />
              <Area
                type="monotone"
                dataKey="income"
                stackId="1"
                stroke="var(--income)"
                strokeWidth={1.5}
                fill="url(#incomeGrad)"
              />
              <Area
                type="monotone"
                dataKey="spending"
                stackId="2"
                stroke="var(--spending)"
                strokeWidth={1.5}
                fill="url(#spendingGrad)"
              />
            </AreaChart>
          </ResponsiveContainer>
        )}
      </div>
    </motion.div>
  );
}

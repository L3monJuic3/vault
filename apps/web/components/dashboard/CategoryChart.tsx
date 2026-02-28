"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { useCategoryBreakdown } from "@/hooks/use-dashboard";
import type { CategoryBreakdown } from "@vault/shared-types";

interface CategoryChartProps {
  onCategoryClick?: (categoryId: string) => void;
  dateFrom?: string;
  dateTo?: string;
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

/* ---------- Custom tooltip ---------- */

interface CustomTooltipProps {
  active?: boolean;
  payload?: Array<{ payload: CategoryBreakdown }>;
}

function CustomTooltip({ active, payload }: CustomTooltipProps) {
  if (!active || !payload?.length) return null;
  const data = payload[0].payload;

  return (
    <div
      style={{
        background: "var(--surface-raised)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius)",
        padding: "10px 14px",
        boxShadow: "var(--shadow-md)",
        minWidth: 140,
      }}
    >
      <p style={{ fontSize: 13, fontWeight: 500, marginBottom: 4 }}>
        {data.icon} {data.category_name}
      </p>
      <p
        style={{
          fontSize: 14,
          fontWeight: 600,
          fontFamily: "var(--font-mono)",
          color: "var(--foreground)",
        }}
      >
        {formatCurrency(data.total)}
      </p>
      <p style={{ fontSize: 11, color: "var(--foreground-muted)", marginTop: 2 }}>
        {data.percentage.toFixed(1)}% · {data.transaction_count} txns
      </p>
    </div>
  );
}

/* ---------- Legend item ---------- */

function LegendItem({ item }: { item: CategoryBreakdown }) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 8,
        fontSize: 12,
      }}
    >
      <span
        style={{
          width: 8,
          height: 8,
          borderRadius: "50%",
          background: item.colour || "#94A3B8",
          flexShrink: 0,
        }}
      />
      <span style={{ color: "var(--foreground-secondary)", flex: 1 }}>
        {item.icon} {item.category_name}
      </span>
      <span
        style={{
          fontFamily: "var(--font-mono)",
          fontSize: 12,
          color: "var(--foreground)",
        }}
      >
        {formatCurrency(item.total)}
      </span>
    </div>
  );
}

/* ---------- Main component ---------- */

export function CategoryChart({
  onCategoryClick,
  dateFrom,
  dateTo,
}: CategoryChartProps) {
  const { data, isLoading } = useCategoryBreakdown({
    date_from: dateFrom,
    date_to: dateTo,
  });

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
        <div className="label" style={{ marginBottom: 16 }}>
          By Category
        </div>
        <div
          className="skeleton"
          style={{
            width: 180,
            height: 180,
            borderRadius: "50%",
            margin: "0 auto",
          }}
        />
      </div>
    );
  }

  if (!data?.length) {
    return (
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-5)",
        }}
      >
        <div className="label" style={{ marginBottom: 16 }}>
          By Category
        </div>
        <p
          style={{
            textAlign: "center",
            padding: "40px 0",
            fontSize: 13,
            color: "var(--foreground-muted)",
          }}
        >
          No spending data yet
        </p>
      </div>
    );
  }

  const totalSpend = data.reduce((sum, d) => sum + d.total, 0);

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.97 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-5)",
        }}
      >
        <div className="label" style={{ marginBottom: 16 }}>
          By Category
        </div>

        {/* Chart with center label */}
        <div style={{ position: "relative" }}>
          <ResponsiveContainer width="100%" height={200}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={55}
                outerRadius={85}
                paddingAngle={2}
                dataKey="total"
                nameKey="category_name"
                onClick={(entry: CategoryBreakdown) =>
                  onCategoryClick?.(entry.category_id)
                }
                style={{ cursor: onCategoryClick ? "pointer" : "default" }}
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.category_id}
                    fill={entry.colour || "#94A3B8"}
                    stroke="var(--surface)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip content={<CustomTooltip />} />
            </PieChart>
          </ResponsiveContainer>

          {/* Center label */}
          <div
            style={{
              position: "absolute",
              top: "50%",
              left: "50%",
              transform: "translate(-50%, -50%)",
              textAlign: "center",
              pointerEvents: "none",
            }}
          >
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: 18,
                fontWeight: 600,
                color: "var(--foreground)",
                lineHeight: 1.2,
              }}
            >
              {formatCurrency(totalSpend)}
            </p>
            <p
              style={{
                fontSize: 10,
                color: "var(--foreground-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Total
            </p>
          </div>
        </div>

        {/* Legend */}
        <div
          style={{
            display: "flex",
            flexDirection: "column",
            gap: 6,
            marginTop: 12,
            borderTop: "1px solid var(--border)",
            paddingTop: 12,
          }}
        >
          {data.slice(0, 6).map((item) => (
            <LegendItem key={item.category_id} item={item} />
          ))}
          {data.length > 6 && (
            <p style={{ fontSize: 11, color: "var(--foreground-muted)" }}>
              +{data.length - 6} more
            </p>
          )}
        </div>
      </div>
    </motion.div>
  );
}

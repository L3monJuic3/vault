"use client";

import {
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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
    <div className="rounded-lg border border-[var(--border)] bg-[var(--card)] p-3 shadow-md">
      <p className="font-medium">
        {data.icon} {data.category_name}
      </p>
      <p className="text-sm text-[var(--muted-foreground)]">
        {formatCurrency(data.total)} ({data.percentage.toFixed(1)}%)
      </p>
      <p className="text-xs text-[var(--muted-foreground)]">
        {data.transaction_count} transactions
      </p>
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
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <Skeleton className="mx-auto h-64 w-64 rounded-full" />
        </CardContent>
      </Card>
    );
  }

  if (!data?.length) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="py-8 text-center text-[var(--muted-foreground)]">
            No spending data yet
          </p>
        </CardContent>
      </Card>
    );
  }

  return (
    <motion.div
      initial={{ opacity: 0, scale: 0.95 }}
      animate={{ opacity: 1, scale: 1 }}
      transition={{ duration: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Spending by Category</CardTitle>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <PieChart>
              <Pie
                data={data}
                cx="50%"
                cy="50%"
                innerRadius={60}
                outerRadius={100}
                paddingAngle={2}
                dataKey="total"
                nameKey="category_name"
                onClick={(entry: CategoryBreakdown) =>
                  onCategoryClick?.(entry.category_id)
                }
                className="cursor-pointer"
              >
                {data.map((entry) => (
                  <Cell
                    key={entry.category_id}
                    fill={entry.colour || "#94A3B8"}
                    stroke="var(--background)"
                    strokeWidth={2}
                  />
                ))}
              </Pie>
              <Tooltip
                content={<CustomTooltip />}
              />
              <Legend
                formatter={(value: string) => {
                  const item = data.find((d) => d.category_name === value);
                  return (
                    <span className="text-sm">
                      {item?.icon} {value} — {item ? formatCurrency(item.total) : ""}
                    </span>
                  );
                }}
              />
            </PieChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </motion.div>
  );
}

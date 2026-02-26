"use client";

import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTopMerchants } from "@/hooks/use-dashboard";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

export function TopMerchants() {
  const { data, isLoading } = useTopMerchants(5);

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Top Merchants</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-10 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const merchants = data || [];
  const maxTotal = Math.max(...merchants.map((m) => Math.abs(m.total)), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <Card>
        <CardHeader>
          <CardTitle>Top Merchants</CardTitle>
        </CardHeader>
        <CardContent>
          {!merchants.length ? (
            <p className="py-4 text-center text-[var(--muted-foreground)]">
              No merchant data yet
            </p>
          ) : (
            <div className="space-y-3">
              {merchants.map((merchant, i) => {
                const barWidth = (Math.abs(merchant.total) / maxTotal) * 100;
                return (
                  <div key={merchant.merchant_name}>
                    <div className="flex items-center justify-between text-sm">
                      <span className="font-medium">{merchant.merchant_name}</span>
                      <span className="text-[var(--muted-foreground)]">
                        {formatCurrency(Math.abs(merchant.total))}
                      </span>
                    </div>
                    <div className="mt-1 h-2 w-full overflow-hidden rounded-full bg-[var(--muted)]">
                      <motion.div
                        className="h-full rounded-full bg-[var(--primary)]"
                        initial={{ width: 0 }}
                        animate={{ width: `${barWidth}%` }}
                        transition={{ duration: 0.5, delay: i * 0.1 }}
                      />
                    </div>
                    <p className="mt-0.5 text-xs text-[var(--muted-foreground)]">
                      {merchant.transaction_count} transactions
                      {merchant.category_name ? ` \u00B7 ${merchant.category_name}` : ""}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

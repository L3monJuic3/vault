"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import { useTransactions } from "@/hooks/use-transactions";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
  });
}

export function RecentTransactions() {
  const { data, isLoading } = useTransactions({ limit: 10 });

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Recent Transactions</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  const transactions = data?.items || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
    >
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent Transactions</CardTitle>
          <Link
            href="/transactions"
            className="text-sm text-[var(--primary)] hover:underline"
          >
            View all
          </Link>
        </CardHeader>
        <CardContent>
          {!transactions.length ? (
            <p className="py-4 text-center text-[var(--muted-foreground)]">
              No transactions yet
            </p>
          ) : (
            <div className="space-y-1">
              {transactions.map((txn) => (
                <div
                  key={txn.id}
                  className="flex items-center justify-between rounded-md px-2 py-2.5 transition-colors hover:bg-[var(--muted)]"
                >
                  <div className="flex items-center gap-3 overflow-hidden">
                    <span className="shrink-0 text-xs text-[var(--muted-foreground)]">
                      {formatDate(txn.date)}
                    </span>
                    <span className="truncate text-sm">
                      {txn.merchant_name || txn.description}
                    </span>
                  </div>
                  <span
                    className={`shrink-0 text-sm font-medium ${
                      txn.amount >= 0
                        ? "text-[var(--success)]"
                        : "text-[var(--foreground)]"
                    }`}
                  >
                    {formatCurrency(txn.amount)}
                  </span>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </motion.div>
  );
}

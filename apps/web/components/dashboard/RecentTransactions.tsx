"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { ArrowRight } from "lucide-react";
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
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-5)",
        }}
      >
        <div className="label" style={{ marginBottom: 16 }}>
          Recent Transactions
        </div>
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div className="skeleton" key={i} style={{ height: 40, width: "100%" }} />
          ))}
        </div>
      </div>
    );
  }

  const transactions = data?.items || [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.2 }}
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
            marginBottom: 16,
          }}
        >
          <span className="label">Recent Transactions</span>
          <Link
            href="/transactions"
            style={{
              display: "flex",
              alignItems: "center",
              gap: 4,
              fontSize: 12,
              color: "var(--accent)",
              textDecoration: "none",
              transition: "opacity 0.12s ease",
            }}
            onMouseEnter={(e) => { e.currentTarget.style.opacity = "0.8"; }}
            onMouseLeave={(e) => { e.currentTarget.style.opacity = "1"; }}
          >
            View all <ArrowRight size={12} />
          </Link>
        </div>

        {/* Rows */}
        {!transactions.length ? (
          <p
            style={{
              textAlign: "center",
              padding: "24px 0",
              fontSize: 13,
              color: "var(--foreground-muted)",
            }}
          >
            No transactions yet
          </p>
        ) : (
          <div>
            {transactions.map((txn) => (
              <div
                key={txn.id}
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  padding: "8px 8px",
                  borderRadius: "var(--radius)",
                  transition: "background 0.12s ease",
                  cursor: "default",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "var(--surface-raised)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "transparent";
                }}
              >
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 12,
                    overflow: "hidden",
                    flex: 1,
                    minWidth: 0,
                  }}
                >
                  <span
                    style={{
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                      color: "var(--foreground-muted)",
                      flexShrink: 0,
                      width: 48,
                    }}
                  >
                    {formatDate(txn.date)}
                  </span>
                  <span
                    style={{
                      fontSize: 13,
                      color: "var(--foreground)",
                      overflow: "hidden",
                      textOverflow: "ellipsis",
                      whiteSpace: "nowrap",
                    }}
                  >
                    {txn.merchant_name || txn.description}
                  </span>
                </div>
                <span
                  style={{
                    fontFamily: "var(--font-mono)",
                    fontSize: 13,
                    fontWeight: 500,
                    flexShrink: 0,
                    color: txn.amount >= 0 ? "var(--income)" : "var(--foreground)",
                    fontVariantNumeric: "tabular-nums",
                  }}
                >
                  {txn.amount >= 0 ? "+" : ""}
                  {formatCurrency(txn.amount)}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </motion.div>
  );
}

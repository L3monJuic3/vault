"use client";

import { motion } from "framer-motion";
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
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-5)",
        }}
      >
        <div className="label" style={{ marginBottom: 16 }}>Top Merchants</div>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {Array.from({ length: 5 }).map((_, i) => (
            <div key={i}>
              <div className="skeleton" style={{ width: 120, height: 12, marginBottom: 6 }} />
              <div className="skeleton" style={{ width: "100%", height: 6 }} />
            </div>
          ))}
        </div>
      </div>
    );
  }

  const merchants = data || [];
  const maxTotal = Math.max(...merchants.map((m) => Math.abs(m.total)), 1);

  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3, delay: 0.3 }}
    >
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-5)",
        }}
      >
        <div className="label" style={{ marginBottom: 16 }}>Top Merchants</div>

        {!merchants.length ? (
          <p
            style={{
              textAlign: "center",
              padding: "24px 0",
              fontSize: 13,
              color: "var(--foreground-muted)",
            }}
          >
            No merchant data yet
          </p>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
            {merchants.map((merchant, i) => {
              const barWidth = (Math.abs(merchant.total) / maxTotal) * 100;
              return (
                <div key={merchant.merchant_name}>
                  <div
                    style={{
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "space-between",
                      marginBottom: 4,
                    }}
                  >
                    <span style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>
                      {merchant.merchant_name}
                    </span>
                    <span
                      style={{
                        fontFamily: "var(--font-mono)",
                        fontSize: 12,
                        color: "var(--foreground-secondary)",
                        fontVariantNumeric: "tabular-nums",
                      }}
                    >
                      {formatCurrency(Math.abs(merchant.total))}
                    </span>
                  </div>
                  <div
                    style={{
                      height: 4,
                      width: "100%",
                      borderRadius: "var(--radius-full)",
                      background: "var(--surface-raised)",
                      overflow: "hidden",
                    }}
                  >
                    <motion.div
                      style={{
                        height: "100%",
                        borderRadius: "var(--radius-full)",
                        background: "var(--accent)",
                      }}
                      initial={{ width: 0 }}
                      animate={{ width: `${barWidth}%` }}
                      transition={{ duration: 0.5, delay: i * 0.08, ease: "easeOut" }}
                    />
                  </div>
                  <div
                    style={{
                      fontSize: 11,
                      color: "var(--foreground-muted)",
                      marginTop: 3,
                    }}
                  >
                    {merchant.transaction_count} txns
                    {merchant.category_name ? ` · ${merchant.category_name}` : ""}
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </motion.div>
  );
}

"use client";

import { motion } from "framer-motion";
import { TransactionTable } from "@/components/transactions/TransactionTable";

export default function TransactionsPage() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{ padding: "32px 32px 48px", maxWidth: 1400, margin: "0 auto" }}
    >
      {/* Header */}
      <div style={{ marginBottom: 24 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: "-0.025em",
            color: "var(--foreground)",
            lineHeight: "32px",
          }}
        >
          Transactions
        </h1>
        <p style={{ fontSize: 13, color: "var(--foreground-muted)", marginTop: 4 }}>
          View, search, and manage your transactions
        </p>
      </div>

      <TransactionTable />
    </motion.div>
  );
}

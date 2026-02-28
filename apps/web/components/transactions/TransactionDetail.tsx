"use client";

import { useState, useEffect } from "react";
import { X } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { useUpdateTransaction } from "@/hooks/use-transactions";
import type { TransactionRead, CategoryRead } from "@vault/shared-types";

interface TransactionDetailProps {
  transaction: TransactionRead | null;
  onClose: () => void;
  categories: CategoryRead[];
}

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", {
    style: "currency",
    currency: "GBP",
  }).format(amount);
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("en-GB", {
    weekday: "short",
    day: "numeric",
    month: "long",
    year: "numeric",
  });
}

function DetailRow({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "flex-start",
        padding: "10px 0",
        borderBottom: "1px solid var(--border)",
      }}
    >
      <span className="label" style={{ paddingTop: 2 }}>
        {label}
      </span>
      <div style={{ textAlign: "right", maxWidth: "60%" }}>{children}</div>
    </div>
  );
}

export function TransactionDetail({
  transaction,
  onClose,
  categories,
}: TransactionDetailProps) {
  const [notes, setNotes] = useState("");
  const [categoryId, setCategoryId] = useState<string>("");
  const updateTransaction = useUpdateTransaction();

  useEffect(() => {
    if (transaction) {
      setNotes(transaction.notes || "");
      setCategoryId(transaction.category_id || "");
    }
  }, [transaction]);

  if (!transaction) return null;

  const category = categories.find((c) => c.id === transaction.category_id);
  const hasChanges =
    notes !== (transaction.notes || "") ||
    categoryId !== (transaction.category_id || "");

  const handleSave = () => {
    updateTransaction.mutate(
      {
        id: transaction.id,
        data: {
          notes: notes || undefined,
          category_id: categoryId || undefined,
        },
      },
      { onSuccess: () => onClose() },
    );
  };

  return (
    <>
      {/* Overlay */}
      <div
        onClick={onClose}
        style={{
          position: "fixed",
          inset: 0,
          background: "rgba(0, 0, 0, 0.5)",
          zIndex: 40,
          animation: "fadeIn 0.15s ease",
        }}
      />

      {/* Panel */}
      <div
        style={{
          position: "fixed",
          top: 0,
          right: 0,
          bottom: 0,
          width: 420,
          maxWidth: "100vw",
          background: "var(--surface)",
          borderLeft: "1px solid var(--border)",
          zIndex: 50,
          display: "flex",
          flexDirection: "column",
          animation: "slideInRight 0.2s var(--transition-snappy)",
          boxShadow: "-8px 0 30px rgba(0, 0, 0, 0.3)",
        }}
      >
        {/* Header */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            padding: "16px 20px",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <span style={{ fontSize: 15, fontWeight: 600, color: "var(--foreground)" }}>
            Transaction Detail
          </span>
          <button
            onClick={onClose}
            style={{
              width: 28,
              height: 28,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              borderRadius: "var(--radius-sm)",
              border: "none",
              background: "transparent",
              color: "var(--foreground-muted)",
              cursor: "pointer",
              transition: "background 0.1s ease",
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.background = "var(--surface-raised)";
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.background = "transparent";
            }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Amount hero */}
        <div
          style={{
            padding: "24px 20px",
            textAlign: "center",
            borderBottom: "1px solid var(--border)",
          }}
        >
          <p
            className="mono-xl"
            style={{
              color:
                transaction.amount >= 0
                  ? "var(--income)"
                  : "var(--foreground)",
            }}
          >
            {transaction.amount >= 0 ? "+" : ""}
            {formatCurrency(transaction.amount)}
          </p>
          <p
            style={{
              fontSize: 14,
              color: "var(--foreground-secondary)",
              marginTop: 4,
            }}
          >
            {transaction.merchant_name || transaction.description}
          </p>
        </div>

        {/* Details */}
        <div
          style={{
            padding: "8px 20px",
            flex: 1,
            overflow: "auto",
          }}
        >
          <DetailRow label="Date">
            <span style={{ fontSize: 13, color: "var(--foreground)" }}>
              {formatDate(transaction.date)}
            </span>
          </DetailRow>

          <DetailRow label="Description">
            <span style={{ fontSize: 13, color: "var(--foreground)" }}>
              {transaction.description}
            </span>
          </DetailRow>

          {transaction.merchant_name && (
            <DetailRow label="Merchant">
              <span style={{ fontSize: 13, color: "var(--foreground)" }}>
                {transaction.merchant_name}
              </span>
            </DetailRow>
          )}

          <DetailRow label="Category">
            {category ? (
              <Badge variant="accent">
                {category.icon} {category.name}
              </Badge>
            ) : (
              <Badge variant="muted">Uncategorised</Badge>
            )}
          </DetailRow>

          {/* Category selector */}
          <div style={{ marginTop: 20 }}>
            <span className="label" style={{ display: "block", marginBottom: 8 }}>
              Change Category
            </span>
            <select
              value={categoryId}
              onChange={(e) => setCategoryId(e.target.value)}
              style={{
                width: "100%",
                height: 36,
                padding: "0 12px",
                fontSize: 13,
                background: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                color: "var(--foreground)",
                outline: "none",
              }}
            >
              <option value="">Uncategorised</option>
              {categories.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.icon} {cat.name}
                </option>
              ))}
            </select>
          </div>

          {/* Notes */}
          <div style={{ marginTop: 20 }}>
            <span className="label" style={{ display: "block", marginBottom: 8 }}>
              Notes
            </span>
            <textarea
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Add a note..."
              rows={3}
              style={{
                width: "100%",
                padding: "10px 12px",
                fontSize: 13,
                lineHeight: "20px",
                background: "var(--background)",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius)",
                color: "var(--foreground)",
                outline: "none",
                resize: "vertical",
                fontFamily: "var(--font-sans)",
                transition: "border-color 0.12s ease",
              }}
              onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
              onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
            />
          </div>
        </div>

        {/* Footer */}
        {hasChanges && (
          <div
            style={{
              padding: "16px 20px",
              borderTop: "1px solid var(--border)",
              display: "flex",
              gap: 8,
              justifyContent: "flex-end",
            }}
          >
            <Button variant="ghost" onClick={onClose}>
              Cancel
            </Button>
            <Button
              onClick={handleSave}
              disabled={updateTransaction.isPending}
            >
              {updateTransaction.isPending ? "Saving..." : "Save"}
            </Button>
          </div>
        )}
      </div>
    </>
  );
}

"use client";

import { useState, useCallback } from "react";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  useTransactions,
  useUpdateTransaction,
} from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { TransactionFilters } from "./TransactionFilters";
import { InlineCategoryEdit } from "./InlineCategoryEdit";
import { BulkActions } from "./BulkActions";
import { TransactionDetail } from "./TransactionDetail";
import type { TransactionFilter, TransactionRead } from "@vault/shared-types";
import { Search } from "lucide-react";

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
    year: "numeric",
  });
}

export function TransactionTable() {
  const [filters, setFilters] = useState<TransactionFilter>({});
  const [search, setSearch] = useState("");
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(null);
  const [detailTxn, setDetailTxn] = useState<TransactionRead | null>(null);

  const activeFilters = { ...filters, search: search || undefined };
  const { data, isLoading } = useTransactions(activeFilters);
  const { data: categories } = useCategories();
  const updateTransaction = useUpdateTransaction();

  const transactions = data?.items || [];

  const toggleSelect = useCallback((id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    if (selectedIds.size === transactions.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(transactions.map((t) => t.id)));
    }
  }, [selectedIds.size, transactions]);

  const handleCategoryChange = useCallback(
    (transactionId: string, categoryId: string) => {
      updateTransaction.mutate(
        { id: transactionId, data: { category_id: categoryId } },
        { onSuccess: () => setEditingCategoryId(null) },
      );
    },
    [updateTransaction],
  );

  const getCategoryName = (categoryId: string | null) => {
    if (!categoryId || !categories) return null;
    const cat = categories.find((c) => c.id === categoryId);
    return cat ? `${cat.icon || ""} ${cat.name}`.trim() : null;
  };

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: 16 }}>
        {/* Search bar */}
        <div style={{ position: "relative", maxWidth: 400 }}>
          <Search
            size={14}
            style={{
              position: "absolute",
              left: 12,
              top: "50%",
              transform: "translateY(-50%)",
              color: "var(--foreground-muted)",
            }}
          />
          <input
            placeholder="Search transactions..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: "100%",
              height: 36,
              paddingLeft: 34,
              paddingRight: 12,
              fontSize: 13,
              background: "var(--surface)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius)",
              color: "var(--foreground)",
              outline: "none",
              transition: "border-color 0.12s ease",
            }}
            onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
            onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
          />
        </div>

        {/* Filters */}
        <TransactionFilters
          filters={filters}
          onFiltersChange={setFilters}
          categories={categories || []}
        />

        {/* Bulk actions */}
        {selectedIds.size > 0 && (
          <BulkActions
            selectedIds={Array.from(selectedIds)}
            categories={categories || []}
            onComplete={() => setSelectedIds(new Set())}
          />
        )}

        {/* Table */}
        <div
          style={{
            background: "var(--surface)",
            border: "1px solid var(--border)",
            borderRadius: "var(--radius-lg)",
            overflow: "hidden",
          }}
        >
          <div style={{ overflowX: "auto" }}>
            <table style={{ width: "100%", borderCollapse: "collapse" }}>
              <thead>
                <tr style={{ borderBottom: "1px solid var(--border)" }}>
                  <th style={{ padding: "10px 14px", textAlign: "left", width: 40 }}>
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.size === transactions.length &&
                        transactions.length > 0
                      }
                      onChange={toggleSelectAll}
                      style={{ accentColor: "var(--accent)" }}
                    />
                  </th>
                  <th className="label" style={{ padding: "10px 14px", textAlign: "left" }}>
                    Date
                  </th>
                  <th className="label" style={{ padding: "10px 14px", textAlign: "left" }}>
                    Description
                  </th>
                  <th className="label" style={{ padding: "10px 14px", textAlign: "left" }}>
                    Category
                  </th>
                  <th className="label" style={{ padding: "10px 14px", textAlign: "right" }}>
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i} style={{ borderBottom: "1px solid var(--border)" }}>
                        <td style={{ padding: "10px 14px" }}>
                          <div className="skeleton" style={{ width: 16, height: 16 }} />
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <div className="skeleton" style={{ width: 80, height: 14 }} />
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <div className="skeleton" style={{ width: 160, height: 14 }} />
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <div className="skeleton" style={{ width: 96, height: 14 }} />
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <div className="skeleton" style={{ width: 64, height: 14, marginLeft: "auto" }} />
                        </td>
                      </tr>
                    ))
                  : transactions.map((txn) => (
                      <tr
                        key={txn.id}
                        onClick={() => setDetailTxn(txn)}
                        style={{
                          borderBottom: "1px solid var(--border)",
                          cursor: "pointer",
                          transition: "background 0.1s ease",
                          background:
                            detailTxn?.id === txn.id
                              ? "var(--accent-muted)"
                              : "transparent",
                        }}
                        onMouseEnter={(e) => {
                          if (detailTxn?.id !== txn.id) {
                            e.currentTarget.style.background = "var(--surface-raised)";
                          }
                        }}
                        onMouseLeave={(e) => {
                          if (detailTxn?.id !== txn.id) {
                            e.currentTarget.style.background = "transparent";
                          }
                        }}
                      >
                        <td
                          style={{ padding: "10px 14px" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          <input
                            type="checkbox"
                            checked={selectedIds.has(txn.id)}
                            onChange={() => toggleSelect(txn.id)}
                            style={{ accentColor: "var(--accent)" }}
                          />
                        </td>
                        <td
                          style={{
                            padding: "10px 14px",
                            fontSize: 12,
                            fontFamily: "var(--font-mono)",
                            color: "var(--foreground-muted)",
                            whiteSpace: "nowrap",
                          }}
                        >
                          {formatDate(txn.date)}
                        </td>
                        <td style={{ padding: "10px 14px" }}>
                          <div>
                            <p style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>
                              {txn.merchant_name || txn.description}
                            </p>
                            {txn.merchant_name &&
                              txn.description !== txn.merchant_name && (
                                <p style={{ fontSize: 11, color: "var(--foreground-muted)", marginTop: 1 }}>
                                  {txn.description}
                                </p>
                              )}
                          </div>
                        </td>
                        <td
                          style={{ padding: "10px 14px" }}
                          onClick={(e) => e.stopPropagation()}
                        >
                          {editingCategoryId === txn.id ? (
                            <InlineCategoryEdit
                              categories={categories || []}
                              currentCategoryId={txn.category_id}
                              onSelect={(catId) =>
                                handleCategoryChange(txn.id, catId)
                              }
                              onCancel={() => setEditingCategoryId(null)}
                            />
                          ) : (
                            <button
                              onClick={() => setEditingCategoryId(txn.id)}
                              style={{
                                background: "none",
                                border: "none",
                                padding: 0,
                                cursor: "pointer",
                              }}
                            >
                              {txn.category_id ? (
                                <Badge variant="accent">
                                  {getCategoryName(txn.category_id) || "Unknown"}
                                </Badge>
                              ) : (
                                <Badge variant="muted">Uncategorised</Badge>
                              )}
                            </button>
                          )}
                        </td>
                        <td
                          style={{
                            padding: "10px 14px",
                            textAlign: "right",
                            fontFamily: "var(--font-mono)",
                            fontSize: 13,
                            fontWeight: 500,
                            fontVariantNumeric: "tabular-nums",
                            color:
                              txn.amount >= 0
                                ? "var(--income)"
                                : "var(--foreground)",
                          }}
                        >
                          {txn.amount >= 0 ? "+" : ""}
                          {formatCurrency(txn.amount)}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {!isLoading && !transactions.length && (
            <p
              style={{
                textAlign: "center",
                padding: "40px 0",
                fontSize: 13,
                color: "var(--foreground-muted)",
              }}
            >
              No transactions found
            </p>
          )}
        </div>

        {/* Load more */}
        {data?.has_more && (
          <div style={{ display: "flex", justifyContent: "center" }}>
            <Button variant="outline" disabled>
              Load more
            </Button>
          </div>
        )}
      </div>

      {/* Slide-over detail panel */}
      <TransactionDetail
        transaction={detailTxn}
        onClose={() => setDetailTxn(null)}
        categories={categories || []}
      />
    </>
  );
}

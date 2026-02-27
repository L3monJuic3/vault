"use client";

import { useState, useCallback } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useTransactions,
  useUpdateTransaction,
} from "@/hooks/use-transactions";
import { useCategories } from "@/hooks/use-categories";
import { TransactionFilters } from "./TransactionFilters";
import { InlineCategoryEdit } from "./InlineCategoryEdit";
import { BulkActions } from "./BulkActions";
import type { TransactionFilter } from "@vault/shared-types";

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
  const [editingCategoryId, setEditingCategoryId] = useState<string | null>(
    null,
  );

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
    <div className="space-y-4">
      {/* Search */}
      <Input
        placeholder="Search transactions..."
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="max-w-md"
      />

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
      <Card>
        <CardContent className="p-0">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--border)]">
                  <th className="p-3 text-left">
                    <input
                      type="checkbox"
                      checked={
                        selectedIds.size === transactions.length &&
                        transactions.length > 0
                      }
                      onChange={toggleSelectAll}
                      className="rounded"
                    />
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-[var(--muted-foreground)]">
                    Date
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-[var(--muted-foreground)]">
                    Description
                  </th>
                  <th className="p-3 text-left text-sm font-medium text-[var(--muted-foreground)]">
                    Category
                  </th>
                  <th className="p-3 text-right text-sm font-medium text-[var(--muted-foreground)]">
                    Amount
                  </th>
                </tr>
              </thead>
              <tbody>
                {isLoading
                  ? Array.from({ length: 10 }).map((_, i) => (
                      <tr key={i} className="border-b border-[var(--border)]">
                        <td className="p-3">
                          <Skeleton className="h-4 w-4" />
                        </td>
                        <td className="p-3">
                          <Skeleton className="h-4 w-20" />
                        </td>
                        <td className="p-3">
                          <Skeleton className="h-4 w-40" />
                        </td>
                        <td className="p-3">
                          <Skeleton className="h-4 w-24" />
                        </td>
                        <td className="p-3">
                          <Skeleton className="ml-auto h-4 w-16" />
                        </td>
                      </tr>
                    ))
                  : transactions.map((txn, index) => (
                      <tr
                        key={txn.id}
                        className="animate-fade-in-up border-b border-[var(--border)] transition-all duration-150 hover:bg-[var(--accent)]"
                        style={{
                          animationDelay: `${Math.min(index * 30, 300)}ms`,
                          position: "relative",
                        }}
                      >
                        <td className="p-3">
                          <input
                            type="checkbox"
                            checked={selectedIds.has(txn.id)}
                            onChange={() => toggleSelect(txn.id)}
                            className="rounded"
                          />
                        </td>
                        <td className="p-3 text-sm text-[var(--muted-foreground)]">
                          {formatDate(txn.date)}
                        </td>
                        <td className="p-3">
                          <div>
                            <p className="text-sm font-medium">
                              {txn.merchant_name || txn.description}
                            </p>
                            {txn.merchant_name &&
                              txn.description !== txn.merchant_name && (
                                <p className="text-xs text-[var(--muted-foreground)]">
                                  {txn.description}
                                </p>
                              )}
                          </div>
                        </td>
                        <td className="p-3">
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
                              className="cursor-pointer"
                            >
                              {txn.category_id ? (
                                <Badge variant="info">
                                  {getCategoryName(txn.category_id) ||
                                    "Unknown"}
                                </Badge>
                              ) : (
                                <Badge variant="outline">Uncategorised</Badge>
                              )}
                            </button>
                          )}
                        </td>
                        <td
                          className={`p-3 text-right text-sm font-medium ${
                            txn.amount >= 0 ? "text-[var(--success)]" : "text-[var(--destructive)]"
                          }`}
                          style={{ fontFamily: "var(--font-mono)" }}
                        >
                          {formatCurrency(txn.amount)}
                        </td>
                      </tr>
                    ))}
              </tbody>
            </table>
          </div>

          {/* Empty state */}
          {!isLoading && !transactions.length && (
            <p className="py-8 text-center text-[var(--muted-foreground)]">
              No transactions found
            </p>
          )}
        </CardContent>
      </Card>

      {/* Load more */}
      {data?.has_more && (
        <div className="flex justify-center">
          <Button variant="outline" disabled>
            Load more
          </Button>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { useBulkCategoryAssign } from "@/hooks/use-transactions";
import type { CategoryRead } from "@vault/shared-types";

interface BulkActionsProps {
  selectedIds: string[];
  categories: CategoryRead[];
  onComplete: () => void;
}

export function BulkActions({
  selectedIds,
  categories,
  onComplete,
}: BulkActionsProps) {
  const [categoryId, setCategoryId] = useState("");
  const bulkAssign = useBulkCategoryAssign();

  const handleAssign = () => {
    if (!categoryId) return;
    bulkAssign.mutate(
      { transaction_ids: selectedIds, category_id: categoryId },
      { onSuccess: onComplete },
    );
  };

  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "10px 14px",
        borderRadius: "var(--radius)",
        border: "1px solid var(--border-accent)",
        background: "var(--accent-glow)",
      }}
    >
      <span
        style={{
          fontSize: 13,
          fontWeight: 500,
          color: "var(--foreground)",
          fontVariantNumeric: "tabular-nums",
        }}
      >
        {selectedIds.length} selected
      </span>
      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        style={{
          height: 32,
          padding: "0 10px",
          fontSize: 13,
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          color: "var(--foreground)",
          outline: "none",
          width: 180,
        }}
      >
        <option value="">Assign category...</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.icon} {cat.name}
          </option>
        ))}
      </select>
      <Button
        size="sm"
        onClick={handleAssign}
        disabled={!categoryId || bulkAssign.isPending}
      >
        {bulkAssign.isPending ? "Assigning..." : "Apply"}
      </Button>
      <Button size="sm" variant="ghost" onClick={onComplete}>
        Cancel
      </Button>
    </div>
  );
}

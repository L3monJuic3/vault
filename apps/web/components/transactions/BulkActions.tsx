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
    <div className="flex items-center gap-3 rounded-lg border border-[var(--primary)] bg-[var(--primary)]/5 p-3">
      <span className="text-sm font-medium">
        {selectedIds.length} selected
      </span>
      <select
        value={categoryId}
        onChange={(e) => setCategoryId(e.target.value)}
        className="h-8 rounded-md border border-[var(--border)] bg-[var(--background)] px-2 text-sm"
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

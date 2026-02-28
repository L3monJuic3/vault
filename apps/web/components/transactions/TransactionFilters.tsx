"use client";

import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import type { TransactionFilter, CategoryRead } from "@vault/shared-types";

interface TransactionFiltersProps {
  filters: TransactionFilter;
  onFiltersChange: (filters: TransactionFilter) => void;
  categories: CategoryRead[];
}

export function TransactionFilters({
  filters,
  onFiltersChange,
  categories,
}: TransactionFiltersProps) {
  return (
    <div className="flex flex-wrap gap-3">
      <Input
        type="date"
        placeholder="From"
        value={filters.date_from || ""}
        onChange={(e) =>
          onFiltersChange({ ...filters, date_from: e.target.value || undefined })
        }
        className="w-40"
      />
      <Input
        type="date"
        placeholder="To"
        value={filters.date_to || ""}
        onChange={(e) =>
          onFiltersChange({ ...filters, date_to: e.target.value || undefined })
        }
        className="w-40"
      />
      <Select
        value={filters.category_id || ""}
        onChange={(e) =>
          onFiltersChange({
            ...filters,
            category_id: e.target.value || undefined,
          })
        }
        className="w-44"
      >
        <option value="">All categories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.icon} {cat.name}
          </option>
        ))}
      </Select>
      <Input
        type="number"
        placeholder="Min amount"
        value={filters.amount_min ?? ""}
        onChange={(e) =>
          onFiltersChange({
            ...filters,
            amount_min: e.target.value ? Number(e.target.value) : undefined,
          })
        }
        className="w-32"
      />
      <Input
        type="number"
        placeholder="Max amount"
        value={filters.amount_max ?? ""}
        onChange={(e) =>
          onFiltersChange({
            ...filters,
            amount_max: e.target.value ? Number(e.target.value) : undefined,
          })
        }
        className="w-32"
      />
    </div>
  );
}

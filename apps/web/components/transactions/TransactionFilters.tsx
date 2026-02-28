"use client";

import type { TransactionFilter, CategoryRead } from "@vault/shared-types";

interface TransactionFiltersProps {
  filters: TransactionFilter;
  onFiltersChange: (filters: TransactionFilter) => void;
  categories: CategoryRead[];
}

const inputStyle: React.CSSProperties = {
  height: 34,
  padding: "0 10px",
  fontSize: 13,
  background: "var(--surface)",
  border: "1px solid var(--border)",
  borderRadius: "var(--radius)",
  color: "var(--foreground)",
  outline: "none",
  transition: "border-color 0.12s ease",
};

export function TransactionFilters({
  filters,
  onFiltersChange,
  categories,
}: TransactionFiltersProps) {
  return (
    <div style={{ display: "flex", flexWrap: "wrap", gap: 8 }}>
      <input
        type="date"
        value={filters.date_from || ""}
        onChange={(e) =>
          onFiltersChange({ ...filters, date_from: e.target.value || undefined })
        }
        style={{ ...inputStyle, width: 150 }}
        onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
        onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
      />
      <input
        type="date"
        value={filters.date_to || ""}
        onChange={(e) =>
          onFiltersChange({ ...filters, date_to: e.target.value || undefined })
        }
        style={{ ...inputStyle, width: 150 }}
        onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
        onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
      />
      <select
        value={filters.category_id || ""}
        onChange={(e) =>
          onFiltersChange({
            ...filters,
            category_id: e.target.value || undefined,
          })
        }
        style={{ ...inputStyle, width: 170 }}
      >
        <option value="">All categories</option>
        {categories.map((cat) => (
          <option key={cat.id} value={cat.id}>
            {cat.icon} {cat.name}
          </option>
        ))}
      </select>
      <input
        type="number"
        placeholder="Min £"
        value={filters.amount_min ?? ""}
        onChange={(e) =>
          onFiltersChange({
            ...filters,
            amount_min: e.target.value ? Number(e.target.value) : undefined,
          })
        }
        style={{ ...inputStyle, width: 100, fontFamily: "var(--font-mono)", fontSize: 12 }}
        onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
        onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
      />
      <input
        type="number"
        placeholder="Max £"
        value={filters.amount_max ?? ""}
        onChange={(e) =>
          onFiltersChange({
            ...filters,
            amount_max: e.target.value ? Number(e.target.value) : undefined,
          })
        }
        style={{ ...inputStyle, width: 100, fontFamily: "var(--font-mono)", fontSize: 12 }}
        onFocus={(e) => { e.target.style.borderColor = "var(--accent)"; }}
        onBlur={(e) => { e.target.style.borderColor = "var(--border)"; }}
      />
    </div>
  );
}

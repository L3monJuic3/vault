"use client";

import type { CategoryRead } from "@vault/shared-types";

interface InlineCategoryEditProps {
  categories: CategoryRead[];
  currentCategoryId: string | null;
  onSelect: (categoryId: string) => void;
  onCancel: () => void;
}

export function InlineCategoryEdit({
  categories,
  currentCategoryId,
  onSelect,
  onCancel,
}: InlineCategoryEditProps) {
  return (
    <select
      autoFocus
      defaultValue={currentCategoryId || ""}
      onChange={(e) => {
        if (e.target.value) onSelect(e.target.value);
        else onCancel();
      }}
      onBlur={onCancel}
      className="h-8 rounded-md border border-[var(--ring)] bg-[var(--background)] px-2 text-sm focus:outline-none"
    >
      <option value="">Select...</option>
      {categories.map((cat) => (
        <option key={cat.id} value={cat.id}>
          {cat.icon} {cat.name}
        </option>
      ))}
    </select>
  );
}

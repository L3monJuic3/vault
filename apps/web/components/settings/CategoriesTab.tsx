"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  useCategories,
  useCreateCategory,
  useUpdateCategory,
  useDeleteCategory,
} from "@/hooks/use-categories";
import type { CategoryRead } from "@vault/shared-types";

export function CategoriesTab() {
  const { data: categories, isLoading } = useCategories();
  const createCategory = useCreateCategory();
  const updateCategory = useUpdateCategory();
  const deleteCategory = useDeleteCategory();

  const [showForm, setShowForm] = useState(false);
  const [newName, setNewName] = useState("");
  const [newIcon, setNewIcon] = useState("");
  const [newColour, setNewColour] = useState("#6366F1");
  const [newBudget, setNewBudget] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");
  const [editBudget, setEditBudget] = useState("");

  const handleCreate = () => {
    if (!newName.trim()) return;
    createCategory.mutate(
      {
        name: newName.trim(),
        icon: newIcon || undefined,
        colour: newColour || undefined,
        budget_monthly: newBudget ? Number(newBudget) : undefined,
      },
      {
        onSuccess: () => {
          setNewName("");
          setNewIcon("");
          setNewColour("#6366F1");
          setNewBudget("");
          setShowForm(false);
        },
      }
    );
  };

  const handleUpdate = (id: string) => {
    updateCategory.mutate(
      {
        id,
        data: {
          name: editName || undefined,
          budget_monthly: editBudget ? Number(editBudget) : undefined,
        },
      },
      { onSuccess: () => setEditingId(null) }
    );
  };

  const handleDelete = (id: string) => {
    deleteCategory.mutate(id);
  };

  const startEditing = (cat: CategoryRead) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditBudget(cat.budget_monthly?.toString() || "");
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Categories</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 5 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      {/* Add category form */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Categories</CardTitle>
          <Button size="sm" onClick={() => setShowForm(!showForm)}>
            {showForm ? "Cancel" : "Add Category"}
          </Button>
        </CardHeader>
        {showForm && (
          <CardContent>
            <div className="flex flex-wrap gap-3">
              <Input
                placeholder="Name"
                value={newName}
                onChange={(e) => setNewName(e.target.value)}
                className="w-40"
              />
              <Input
                placeholder="Icon (emoji)"
                value={newIcon}
                onChange={(e) => setNewIcon(e.target.value)}
                className="w-24"
              />
              <Input
                type="color"
                value={newColour}
                onChange={(e) => setNewColour(e.target.value)}
                className="w-16 p-1"
              />
              <Input
                type="number"
                placeholder="Monthly budget"
                value={newBudget}
                onChange={(e) => setNewBudget(e.target.value)}
                className="w-36"
              />
              <Button
                onClick={handleCreate}
                disabled={createCategory.isPending}
              >
                {createCategory.isPending ? "Creating..." : "Create"}
              </Button>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Category list */}
      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-[var(--border)]">
            {(categories || []).map((cat) => (
              <div
                key={cat.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {cat.colour && (
                    <div
                      className="h-4 w-4 rounded-full"
                      style={{ backgroundColor: cat.colour }}
                    />
                  )}
                  <span className="text-lg">{cat.icon}</span>
                  {editingId === cat.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 w-32"
                      />
                      <Input
                        type="number"
                        placeholder="Budget"
                        value={editBudget}
                        onChange={(e) => setEditBudget(e.target.value)}
                        className="h-8 w-24"
                      />
                      <Button size="sm" onClick={() => handleUpdate(cat.id)}>
                        Save
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => setEditingId(null)}
                      >
                        Cancel
                      </Button>
                    </div>
                  ) : (
                    <>
                      <span className="text-sm font-medium">{cat.name}</span>
                      {cat.budget_monthly && (
                        <span className="text-xs text-[var(--muted-foreground)]">
                          Budget: {"\u00A3"}
                          {cat.budget_monthly}/mo
                        </span>
                      )}
                    </>
                  )}
                </div>
                <div className="flex gap-2">
                  {cat.user_id && editingId !== cat.id && (
                    <>
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(cat)}
                      >
                        Edit
                      </Button>
                      <Button
                        size="sm"
                        variant="destructive"
                        onClick={() => handleDelete(cat.id)}
                        disabled={deleteCategory.isPending}
                      >
                        Delete
                      </Button>
                    </>
                  )}
                  {!cat.user_id && (
                    <span className="text-xs text-[var(--muted-foreground)]">
                      System
                    </span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

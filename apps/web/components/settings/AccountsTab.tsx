"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useAccounts, useUpdateAccount } from "@/hooks/use-accounts";
import type { AccountRead } from "@vault/shared-types";

const TYPE_LABELS: Record<AccountRead["type"], string> = {
  current: "Current",
  savings: "Savings",
  credit_card: "Credit Card",
  investment: "Investment",
  loan: "Loan",
  mortgage: "Mortgage",
  pension: "Pension",
};

export function AccountsTab() {
  const { data: accounts, isLoading } = useAccounts();
  const updateAccount = useUpdateAccount();

  const [editingId, setEditingId] = useState<string | null>(null);
  const [editName, setEditName] = useState("");

  const startEditing = (account: AccountRead) => {
    setEditingId(account.id);
    setEditName(account.name);
  };

  const handleRename = (id: string) => {
    if (!editName.trim()) return;
    updateAccount.mutate(
      { id, data: { name: editName.trim() } },
      { onSuccess: () => setEditingId(null) }
    );
  };

  const handleToggleActive = (account: AccountRead) => {
    updateAccount.mutate({
      id: account.id,
      data: { is_active: !account.is_active },
    });
  };

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 3 }).map((_, i) => (
            <Skeleton key={i} className="h-14 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Accounts</CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-0">
          <div className="divide-y divide-[var(--border)]">
            {(accounts || []).length === 0 && (
              <div className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
                No accounts yet. Import a bank statement to create one.
              </div>
            )}
            {(accounts || []).map((account) => (
              <div
                key={account.id}
                className="flex items-center justify-between px-4 py-3"
              >
                <div className="flex items-center gap-3">
                  {editingId === account.id ? (
                    <div className="flex gap-2">
                      <Input
                        value={editName}
                        onChange={(e) => setEditName(e.target.value)}
                        className="h-8 w-40"
                        onKeyDown={(e) => {
                          if (e.key === "Enter") handleRename(account.id);
                          if (e.key === "Escape") setEditingId(null);
                        }}
                      />
                      <Button
                        size="sm"
                        onClick={() => handleRename(account.id)}
                        disabled={updateAccount.isPending}
                      >
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
                      <div>
                        <span className="text-sm font-medium">
                          {account.name}
                        </span>
                        <span className="ml-2 text-xs text-[var(--muted-foreground)]">
                          {TYPE_LABELS[account.type]}
                        </span>
                      </div>
                    </>
                  )}
                </div>

                <div className="flex items-center gap-3">
                  <span className="text-sm font-medium tabular-nums">
                    {account.currency === "GBP" ? "\u00A3" : account.currency}{" "}
                    {account.current_balance.toLocaleString("en-GB", {
                      minimumFractionDigits: 2,
                      maximumFractionDigits: 2,
                    })}
                  </span>

                  <Badge variant={account.is_active ? "default" : "secondary"}>
                    {account.is_active ? "Active" : "Inactive"}
                  </Badge>

                  {editingId !== account.id && (
                    <div className="flex gap-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        onClick={() => startEditing(account)}
                      >
                        Rename
                      </Button>
                      <Button
                        size="sm"
                        variant="outline"
                        onClick={() => handleToggleActive(account)}
                        disabled={updateAccount.isPending}
                      >
                        {account.is_active ? "Deactivate" : "Activate"}
                      </Button>
                    </div>
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

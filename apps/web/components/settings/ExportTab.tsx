"use client";

import { useState } from "react";
import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { apiFetch } from "@/lib/api-client";
import type { CursorPage, TransactionRead } from "@vault/shared-types";

export function ExportTab() {
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async () => {
    setIsExporting(true);
    try {
      const params = new URLSearchParams();
      if (dateFrom) params.set("date_from", dateFrom);
      if (dateTo) params.set("date_to", dateTo);
      params.set("limit", "10000");

      const query = params.toString();
      const data = await apiFetch<CursorPage<TransactionRead>>(
        `/api/v1/transactions${query ? `?${query}` : ""}`
      );
      const transactions = data.items || [];

      if (!transactions.length) {
        alert("No transactions to export");
        return;
      }

      // Generate CSV
      const headers = [
        "Date",
        "Description",
        "Merchant",
        "Amount",
        "Category",
        "Tags",
      ];
      const rows = transactions.map((t) => [
        t.date,
        t.description,
        t.merchant_name || "",
        String(t.amount),
        t.category_id || "",
        Array.isArray(t.tags) ? t.tags.join("; ") : "",
      ]);

      const csv = [
        headers.join(","),
        ...rows.map((row) =>
          row
            .map((cell) => `"${String(cell).replace(/"/g, '""')}"`)
            .join(",")
        ),
      ].join("\n");

      // Download
      const blob = new Blob([csv], { type: "text/csv" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `vault-transactions-${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Please try again.");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Export Transactions</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="text-sm text-[var(--muted-foreground)]">
          Download your transactions as a CSV file. Optionally filter by date
          range.
        </p>
        <div className="flex flex-wrap gap-3">
          <div>
            <label className="mb-1 block text-sm text-[var(--muted-foreground)]">
              From
            </label>
            <Input
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              className="w-44"
            />
          </div>
          <div>
            <label className="mb-1 block text-sm text-[var(--muted-foreground)]">
              To
            </label>
            <Input
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              className="w-44"
            />
          </div>
        </div>
        <Button onClick={handleExport} disabled={isExporting}>
          {isExporting ? "Exporting..." : "Download CSV"}
        </Button>
      </CardContent>
    </Card>
  );
}

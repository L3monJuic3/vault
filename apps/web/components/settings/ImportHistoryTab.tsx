"use client";

import { Card, CardHeader, CardTitle, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { useImports } from "@/hooks/use-imports";
import type { ImportRead } from "@vault/shared-types";

const STATUS_VARIANT: Record<string, "default" | "secondary" | "outline"> = {
  completed: "default",
  processing: "outline",
  failed: "secondary",
};

function formatDate(iso: string): string {
  const parts = iso.split("T")[0].split("-").map(Number);
  const utcDate = new Date(Date.UTC(parts[0], parts[1] - 1, parts[2]));
  return utcDate.toLocaleDateString("en-GB", {
    timeZone: "UTC",
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

function formatDateRange(imp: ImportRead): string {
  if (!imp.date_range_start || !imp.date_range_end) return "\u2014";
  return `${formatDate(imp.date_range_start)} \u2013 ${formatDate(imp.date_range_end)}`;
}

export function ImportHistoryTab() {
  const { data: imports, isLoading, error } = useImports();

  if (error) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">
            Failed to load import history. Please try again.
          </p>
        </CardContent>
      </Card>
    );
  }

  if (isLoading) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          {Array.from({ length: 4 }).map((_, i) => (
            <Skeleton key={i} className="h-12 w-full" />
          ))}
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-4">
      <Card>
        <CardHeader>
          <CardTitle>Import History</CardTitle>
        </CardHeader>
      </Card>

      <Card>
        <CardContent className="p-0">
          {(imports || []).length === 0 ? (
            <div className="px-4 py-8 text-center text-sm text-[var(--muted-foreground)]">
              No imports yet. Upload a bank statement to get started.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-[var(--border)] text-left text-xs text-[var(--muted-foreground)]">
                    <th className="px-4 py-3 font-medium">Filename</th>
                    <th className="px-4 py-3 font-medium">Date Imported</th>
                    <th className="px-4 py-3 font-medium text-right">Rows</th>
                    <th className="px-4 py-3 font-medium text-right">
                      Duplicates Skipped
                    </th>
                    <th className="px-4 py-3 font-medium">Status</th>
                    <th className="px-4 py-3 font-medium">Date Range</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-[var(--border)]">
                  {(imports || []).map((imp) => (
                    <tr key={imp.id}>
                      <td className="px-4 py-3 font-medium">{imp.filename}</td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">
                        {formatDate(imp.created_at)}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {imp.row_count}
                      </td>
                      <td className="px-4 py-3 text-right tabular-nums">
                        {imp.duplicates_skipped}
                      </td>
                      <td className="px-4 py-3">
                        <Badge variant={STATUS_VARIANT[imp.status] || "outline"}>
                          {imp.status}
                        </Badge>
                      </td>
                      <td className="px-4 py-3 text-[var(--muted-foreground)]">
                        {formatDateRange(imp)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

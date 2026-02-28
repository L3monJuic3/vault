"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type {
  CursorPage,
  TransactionRead,
  TransactionUpdate,
  TransactionFilter,
  BulkCategoryRequest,
} from "@vault/shared-types";

export function useTransactions(filters?: TransactionFilter & { cursor?: string; limit?: number }) {
  const params = new URLSearchParams();
  if (filters) {
    Object.entries(filters).forEach(([key, value]) => {
      if (value !== undefined && value !== null) {
        params.set(key, String(value));
      }
    });
  }
  const query = params.toString();

  return useQuery<CursorPage<TransactionRead>>({
    // TODO: scope query key to userId when multi-user auth is enabled
    queryKey: ["transactions", filters],
    queryFn: () => apiFetch(`/api/v1/transactions${query ? `?${query}` : ""}`),
  });
}

export function useTransaction(id: string) {
  return useQuery<TransactionRead>({
    // TODO: scope query key to userId when multi-user auth is enabled
    queryKey: ["transactions", id],
    queryFn: () => apiFetch(`/api/v1/transactions/${id}`),
    enabled: !!id,
  });
}

export function useUpdateTransaction() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: TransactionUpdate }) =>
      apiFetch<TransactionRead>(`/api/v1/transactions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

export function useBulkCategoryAssign() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: BulkCategoryRequest) =>
      apiFetch<{ updated: number }>("/api/v1/transactions/bulk", {
        method: "POST",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
    },
  });
}

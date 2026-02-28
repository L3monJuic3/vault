"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { AccountRead, AccountUpdate } from "@vault/shared-types";

export function useAccounts() {
  return useQuery<AccountRead[]>({
    // TODO: scope query key to userId when multi-user auth is enabled
    queryKey: ["accounts"],
    queryFn: () => apiFetch("/api/v1/accounts"),
  });
}

export function useUpdateAccount() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: AccountUpdate }) =>
      apiFetch<AccountRead>(`/api/v1/accounts/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["accounts"] });
    },
  });
}

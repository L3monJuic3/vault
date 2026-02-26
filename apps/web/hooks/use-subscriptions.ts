"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type {
  SubscriptionListResponse,
  RecurringGroupRead,
  RecurringGroupUpdate,
} from "@vault/shared-types";

export function useSubscriptions() {
  return useQuery<SubscriptionListResponse>({
    queryKey: ["subscriptions"],
    queryFn: () => apiFetch("/api/v1/subscriptions"),
  });
}

export function useUpdateSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: RecurringGroupUpdate }) =>
      apiFetch<RecurringGroupRead>(`/api/v1/subscriptions/${id}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}

export function useDismissSubscription() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (id: string) =>
      apiFetch<RecurringGroupRead>(`/api/v1/subscriptions/${id}/dismiss`, {
        method: "POST",
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    },
  });
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type {
  DashboardStats,
  CategoryBreakdown,
  SpendTimelinePoint,
  TopMerchant,
} from "@vault/shared-types";

export function useDashboardStats() {
  return useQuery<DashboardStats>({
    // TODO: scope query key to userId when multi-user auth is enabled
    queryKey: ["dashboard", "stats"],
    queryFn: () => apiFetch("/api/v1/analytics/dashboard"),
  });
}

export function useCategoryBreakdown(params?: { date_from?: string; date_to?: string }) {
  return useQuery<CategoryBreakdown[]>({
    // TODO: scope query key to userId when multi-user auth is enabled
    queryKey: ["dashboard", "categories", params],
    queryFn: () => {
      const query = new URLSearchParams();
      if (params?.date_from) query.set("date_from", params.date_from);
      if (params?.date_to) query.set("date_to", params.date_to);
      const qs = query.toString();
      return apiFetch(`/api/v1/analytics/categories${qs ? `?${qs}` : ""}`);
    },
  });
}

export function useSpendTimeline(granularity: "daily" | "weekly" | "monthly" = "monthly") {
  return useQuery<SpendTimelinePoint[]>({
    // TODO: scope query key to userId when multi-user auth is enabled
    queryKey: ["dashboard", "timeline", granularity],
    queryFn: () => apiFetch(`/api/v1/analytics/timeline?granularity=${granularity}`),
  });
}

export function useTopMerchants(limit: number = 5) {
  return useQuery<TopMerchant[]>({
    // TODO: scope query key to userId when multi-user auth is enabled
    queryKey: ["dashboard", "merchants", limit],
    queryFn: () => apiFetch(`/api/v1/analytics/top-merchants?limit=${limit}`),
  });
}

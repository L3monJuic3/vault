"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

export interface ServiceHealth {
  status: "ok" | "warning" | "error";
  latency_ms?: number;
  error?: string;
  workers?: number;
}

export interface HealthResponse {
  status: "ok" | "warning" | "degraded";
  timestamp: string;
  environment: string;
  services: {
    database: ServiceHealth;
    redis: ServiceHealth;
    celery: ServiceHealth;
    ai: ServiceHealth;
  };
}

export interface LogEntry {
  id: string;
  level: "DEBUG" | "INFO" | "WARNING" | "ERROR" | "CRITICAL";
  category: string;
  message: string;
  detail: Record<string, unknown> | null;
  created_at: string;
}

export interface LogsResponse {
  logs: LogEntry[];
  counts: Record<string, number>;
  total: number;
}

export function useHealth(autoRefresh = false) {
  return useQuery<HealthResponse>({
    // TODO: scope query key to userId when multi-user auth is enabled
    queryKey: ["debug", "health"],
    queryFn: () => apiFetch("/api/v1/debug/health"),
    refetchInterval: autoRefresh ? 10000 : false,
    staleTime: 5000,
  });
}

export function useLogs(params?: { level?: string; category?: string; limit?: number; autoRefresh?: boolean }) {
  const query = new URLSearchParams();
  if (params?.level) query.set("level", params.level);
  if (params?.category) query.set("category", params.category);
  if (params?.limit) query.set("limit", String(params.limit));
  const qs = query.toString();

  return useQuery<LogsResponse>({
    // TODO: scope query key to userId when multi-user auth is enabled
    queryKey: ["debug", "logs", params],
    queryFn: () => apiFetch(`/api/v1/debug/logs${qs ? `?${qs}` : ""}`),
    refetchInterval: params?.autoRefresh !== false ? 5000 : false,
    staleTime: 2000,
  });
}

export function useClearLogs() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch("/api/v1/debug/logs", { method: "DELETE" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["debug", "logs"] }),
  });
}

export function useTestLog() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: () => apiFetch("/api/v1/debug/logs/test", { method: "POST" }),
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ["debug", "logs"] }),
  });
}

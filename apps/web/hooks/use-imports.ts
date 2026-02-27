"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { ImportRead } from "@vault/shared-types";

export function useImports() {
  return useQuery<ImportRead[]>({
    queryKey: ["imports"],
    queryFn: () => apiFetch("/api/v1/imports"),
  });
}

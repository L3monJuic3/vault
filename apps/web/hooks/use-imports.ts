"use client";

import { useQuery } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";
import type { ImportRead } from "@vault/shared-types";

export function useImports() {
  return useQuery<ImportRead[]>({
    // TODO: scope query key to userId when multi-user auth is enabled
    queryKey: ["imports"],
    queryFn: () => apiFetch("/api/v1/imports"),
  });
}

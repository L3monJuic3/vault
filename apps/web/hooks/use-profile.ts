"use client";

import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { apiFetch } from "@/lib/api-client";

interface UserProfile {
  id: string;
  email: string;
  name: string;
  currency: string;
  created_at: string;
}

interface UserProfileUpdate {
  name?: string;
  currency?: string;
}

export function useProfile() {
  return useQuery<UserProfile>({
    // TODO: scope query key to userId when multi-user auth is enabled
    queryKey: ["profile"],
    queryFn: () => apiFetch<UserProfile>("/api/v1/auth/me"),
  });
}

export function useUpdateProfile() {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: UserProfileUpdate) =>
      apiFetch<UserProfile>("/api/v1/auth/me", {
        method: "PATCH",
        body: JSON.stringify(data),
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["profile"] });
    },
  });
}

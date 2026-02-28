"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";

const CURRENCIES = [
  { value: "GBP", label: "GBP (\u00A3)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (\u20AC)" },
  { value: "NZD", label: "NZD ($)" },
];

export function ProfileTab() {
  const { data: profile, isLoading } = useProfile();
  const updateProfile = useUpdateProfile();

  const [name, setName] = useState("");
  const [currency, setCurrency] = useState("GBP");
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    if (profile) {
      setName(profile.name);
      setCurrency(profile.currency);
    }
  }, [profile]);

  const handleSave = () => {
    setSaved(false);
    updateProfile.mutate(
      { name, currency },
      {
        onSuccess: () => {
          setSaved(true);
          setTimeout(() => setSaved(false), 2000);
        },
      },
    );
  };

  const hasChanges =
    profile && (name !== profile.name || currency !== profile.currency);

  if (isLoading) {
    return (
      <Card className="max-w-md">
        <CardContent className="space-y-4 p-5">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-9 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="max-w-md">
      <Card>
        <CardContent className="p-5">
          <div className="flex flex-col gap-5">
            {/* Name */}
            <div>
              <label className="text-field-label">Name</label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label className="text-field-label">Email</label>
              <Input
                value={profile?.email ?? ""}
                disabled
                className="opacity-60"
              />
              <p className="text-hint mt-1">Email cannot be changed.</p>
            </div>

            {/* Currency */}
            <div>
              <label className="text-field-label">Currency</label>
              <Select
                value={currency}
                onChange={(e) => setCurrency(e.target.value)}
              >
                {CURRENCIES.map((c) => (
                  <option key={c.value} value={c.value}>
                    {c.label}
                  </option>
                ))}
              </Select>
            </div>

            {/* Save */}
            <div className="flex items-center gap-3">
              <Button
                onClick={handleSave}
                disabled={!hasChanges || updateProfile.isPending}
              >
                {updateProfile.isPending ? "Saving..." : "Save changes"}
              </Button>
              {saved && (
                <span className="text-sm font-medium text-[var(--success)]">
                  Saved
                </span>
              )}
              {updateProfile.isError && (
                <span className="text-sm font-medium text-[var(--destructive)]">
                  Failed to save
                </span>
              )}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}

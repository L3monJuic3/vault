"use client";

import { useState, useEffect } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select } from "@/components/ui/select";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { useProfile, useUpdateProfile } from "@/hooks/use-profile";

const CURRENCIES = [
  { value: "GBP", label: "GBP (£)" },
  { value: "USD", label: "USD ($)" },
  { value: "EUR", label: "EUR (€)" },
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
      <Card>
        <CardContent className="p-6 space-y-4">
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
          <Skeleton className="h-4 w-24" />
          <Skeleton className="h-10 w-full" />
        </CardContent>
      </Card>
    );
  }

  return (
    <div style={{ maxWidth: "480px" }}>
      <Card>
        <CardContent className="p-6">
          <div style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
            {/* Name */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--foreground)",
                  marginBottom: "6px",
                }}
              >
                Name
              </label>
              <Input
                value={name}
                onChange={(e) => setName(e.target.value)}
                placeholder="Your name"
              />
            </div>

            {/* Email (read-only) */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--foreground)",
                  marginBottom: "6px",
                }}
              >
                Email
              </label>
              <Input
                value={profile?.email ?? ""}
                disabled
                style={{ opacity: 0.6 }}
              />
              <p
                style={{
                  fontSize: "12px",
                  color: "var(--muted-foreground)",
                  marginTop: "4px",
                }}
              >
                Email cannot be changed.
              </p>
            </div>

            {/* Currency */}
            <div>
              <label
                style={{
                  display: "block",
                  fontSize: "13px",
                  fontWeight: 500,
                  color: "var(--foreground)",
                  marginBottom: "6px",
                }}
              >
                Currency
              </label>
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
            <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
              <Button
                onClick={handleSave}
                disabled={!hasChanges || updateProfile.isPending}
              >
                {updateProfile.isPending ? "Saving..." : "Save changes"}
              </Button>
              {saved && (
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--success)",
                    fontWeight: 500,
                  }}
                >
                  Saved
                </span>
              )}
              {updateProfile.isError && (
                <span
                  style={{
                    fontSize: "13px",
                    color: "var(--destructive)",
                    fontWeight: 500,
                  }}
                >
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

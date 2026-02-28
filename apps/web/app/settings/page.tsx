"use client";

import { useState } from "react";
import { PageWrapper, PageHeader } from "@/components/ui";
import { AppearanceTab } from "@/components/settings/AppearanceTab";
import { ProfileTab } from "@/components/settings/ProfileTab";
import { CategoriesTab } from "@/components/settings/CategoriesTab";
import { AccountsTab } from "@/components/settings/AccountsTab";
import { ImportHistoryTab } from "@/components/settings/ImportHistoryTab";
import { ExportTab } from "@/components/settings/ExportTab";
import { cn } from "@/lib/utils";

const tabs = [
  { id: "appearance", label: "Appearance" },
  { id: "profile", label: "Profile" },
  { id: "categories", label: "Categories" },
  { id: "accounts", label: "Accounts" },
  { id: "imports", label: "Import History" },
  { id: "export", label: "Export" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("appearance");

  return (
    <PageWrapper maxWidth="lg">
      <PageHeader
        title="Settings"
        subtitle="Manage your preferences and account settings"
      />

      {/* Pill tab navigation */}
      <div className="mb-8 flex gap-1 rounded-[var(--radius-lg)] bg-[var(--surface)] p-1">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={cn(
              "rounded-[var(--radius)] px-3.5 py-1.5 text-sm font-medium transition-all duration-150",
              activeTab === tab.id
                ? "bg-[var(--surface-raised)] text-[var(--foreground)] shadow-[var(--shadow-xs)]"
                : "text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
            )}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === "appearance" && <AppearanceTab />}
      {activeTab === "profile" && <ProfileTab />}
      {activeTab === "categories" && <CategoriesTab />}
      {activeTab === "accounts" && <AccountsTab />}
      {activeTab === "imports" && <ImportHistoryTab />}
      {activeTab === "export" && <ExportTab />}
    </PageWrapper>
  );
}

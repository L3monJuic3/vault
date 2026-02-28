"use client";

import { useState } from "react";
import { AppearanceTab } from "@/components/settings/AppearanceTab";
import { ProfileTab } from "@/components/settings/ProfileTab";
import { CategoriesTab } from "@/components/settings/CategoriesTab";
import { AccountsTab } from "@/components/settings/AccountsTab";
import { ImportHistoryTab } from "@/components/settings/ImportHistoryTab";
import { ExportTab } from "@/components/settings/ExportTab";

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
    <main className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-[var(--muted-foreground)]">
          Manage your preferences and account settings
        </p>
      </div>

      {/* Tab navigation */}
      <div className="mb-6 flex gap-1 border-b border-[var(--border)]">
        {tabs.map((tab) => (
          <button
            key={tab.id}
            onClick={() => setActiveTab(tab.id)}
            className={`px-4 py-2 text-sm font-medium transition-colors ${
              activeTab === tab.id
                ? "border-b-2 border-[var(--primary)] text-[var(--foreground)]"
                : "text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            }`}
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
    </main>
  );
}

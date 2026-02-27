"use client";

import { useState } from "react";
import { CategoriesTab } from "@/components/settings/CategoriesTab";
import { ExportTab } from "@/components/settings/ExportTab";
import { AccountsTab } from "@/components/settings/AccountsTab";

const tabs = [
  { id: "categories", label: "Categories" },
  { id: "accounts", label: "Accounts" },
  { id: "export", label: "Export" },
] as const;

type TabId = (typeof tabs)[number]["id"];

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState<TabId>("categories");

  return (
    <main className="mx-auto max-w-4xl p-4 sm:p-6 lg:p-8">
      <div className="mb-6">
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-[var(--muted-foreground)]">
          Manage categories, accounts, and export your data
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

      {activeTab === "categories" && <CategoriesTab />}
      {activeTab === "accounts" && <AccountsTab />}
      {activeTab === "export" && <ExportTab />}
    </main>
  );
}

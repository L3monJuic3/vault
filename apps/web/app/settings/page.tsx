"use client";

import { useState } from "react";
import { motion } from "framer-motion";
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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{ padding: "32px 32px 48px", maxWidth: 960, margin: "0 auto" }}
    >
      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h1
          style={{
            fontSize: 24,
            fontWeight: 600,
            letterSpacing: "-0.025em",
            color: "var(--foreground)",
            lineHeight: "32px",
          }}
        >
          Settings
        </h1>
        <p style={{ fontSize: 13, color: "var(--foreground-muted)", marginTop: 4 }}>
          Manage your preferences and account settings
        </p>
      </div>

      {/* Tab navigation */}
      <div
        style={{
          display: "flex",
          gap: 2,
          marginBottom: 28,
          padding: 3,
          borderRadius: "var(--radius-lg)",
          background: "var(--surface)",
          border: "1px solid var(--border)",
        }}
      >
        {tabs.map((tab) => {
          const isActive = activeTab === tab.id;
          return (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              style={{
                padding: "7px 14px",
                fontSize: 13,
                fontWeight: isActive ? 500 : 400,
                borderRadius: "var(--radius)",
                border: "none",
                cursor: "pointer",
                transition: "all 0.12s ease",
                background: isActive ? "var(--surface-raised)" : "transparent",
                color: isActive ? "var(--foreground)" : "var(--foreground-muted)",
                boxShadow: isActive ? "var(--shadow-xs)" : "none",
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--foreground)";
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.color = "var(--foreground-muted)";
                }
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tab content */}
      {activeTab === "appearance" && <AppearanceTab />}
      {activeTab === "profile" && <ProfileTab />}
      {activeTab === "categories" && <CategoriesTab />}
      {activeTab === "accounts" && <AccountsTab />}
      {activeTab === "imports" && <ImportHistoryTab />}
      {activeTab === "export" && <ExportTab />}
    </motion.div>
  );
}

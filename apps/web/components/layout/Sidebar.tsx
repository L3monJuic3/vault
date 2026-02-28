"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: BarChartIcon },
  { href: "/upload", label: "Upload", icon: UploadIcon },
  { href: "/transactions", label: "Transactions", icon: ListIcon },
  { href: "/subscriptions", label: "Subscriptions", icon: RepeatIcon },
  { href: "/settings", label: "Settings", icon: SettingsIcon },
  { href: "/debug", label: "Debug", icon: BugIcon },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      style={{
        width: "220px",
        minHeight: "100vh",
        background: "var(--sidebar)",
        borderRight: "1px solid var(--sidebar-border)",
        display: "flex",
        flexDirection: "column",
        flexShrink: 0,
      }}
      className="sidebar-root"
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 16px 16px",
          borderBottom: "1px solid var(--sidebar-border)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div
            style={{
              width: "28px",
              height: "28px",
              background: "var(--primary)",
              borderRadius: "var(--radius-sm)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <VaultIcon />
          </div>
          <span
            style={{
              fontFamily: "var(--font-mono)",
              fontWeight: 600,
              fontSize: "15px",
              color: "var(--foreground)",
              letterSpacing: "-0.02em",
            }}
          >
            vault
          </span>
        </div>
      </div>

      {/* Nav items */}
      <nav style={{ flex: 1, padding: "8px 8px 0" }}>
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/"
              ? pathname === "/"
              : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className="sidebar-nav-item"
              style={{
                display: "flex",
                alignItems: "center",
                gap: "8px",
                padding: "7px 10px",
                marginBottom: "2px",
                borderRadius: "var(--radius)",
                borderLeft: isActive
                  ? "2px solid var(--sidebar-item-active-border)"
                  : "2px solid transparent",
                background: isActive ? "var(--sidebar-item-active)" : "transparent",
                color: isActive ? "var(--foreground)" : "var(--foreground-muted)",
                textDecoration: "none",
                fontSize: "13px",
                fontWeight: isActive ? 500 : 400,
                transition: "background 0.15s ease, color 0.15s ease",
              }}
            >
              <Icon active={isActive} />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--sidebar-border)",
          fontSize: "11px",
          color: "var(--foreground-subtle)",
          fontFamily: "var(--font-mono)",
        }}
      >
        v0.1.0
      </div>

      <style jsx>{`
        @media (max-width: 768px) {
          .sidebar-root {
            display: none;
          }
        }
        .sidebar-nav-item:hover {
          background: var(--sidebar-item-hover) !important;
          color: var(--foreground) !important;
        }
      `}</style>
    </aside>
  );
}

/* ─── Inline SVG icons ─────────────────────────────────────── */

function VaultIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="3" width="14" height="10" rx="1.5" stroke="white" strokeWidth="1.5" />
      <circle cx="8" cy="8" r="2" stroke="white" strokeWidth="1.5" />
      <line x1="8" y1="6" x2="8" y2="4" stroke="white" strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function BarChartIcon({ active }: { active: boolean }) {
  const c = active ? "var(--primary)" : "currentColor";
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <rect x="1" y="9" width="3" height="6" rx="1" fill={c} />
      <rect x="6" y="5" width="3" height="10" rx="1" fill={c} />
      <rect x="11" y="2" width="3" height="13" rx="1" fill={c} />
    </svg>
  );
}

function UploadIcon({ active }: { active: boolean }) {
  const c = active ? "var(--primary)" : "currentColor";
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M8 2L8 10" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 5L8 2L11 5" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M2 12V13C2 13.55 2.45 14 3 14H13C13.55 14 14 13.55 14 13V12" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

function ListIcon({ active }: { active: boolean }) {
  const c = active ? "var(--primary)" : "currentColor";
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <line x1="5" y1="4" x2="14" y2="4" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5" y1="8" x2="14" y2="8" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <line x1="5" y1="12" x2="14" y2="12" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <circle cx="2.5" cy="4" r="1" fill={c} />
      <circle cx="2.5" cy="8" r="1" fill={c} />
      <circle cx="2.5" cy="12" r="1" fill={c} />
    </svg>
  );
}

function RepeatIcon({ active }: { active: boolean }) {
  const c = active ? "var(--primary)" : "currentColor";
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M2 6C2 4.34 3.34 3 5 3H13" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M11 1L13 3L11 5" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
      <path d="M14 10C14 11.66 12.66 13 11 13H3" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
      <path d="M5 11L3 13L5 15" stroke={c} strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    </svg>
  );
}

function SettingsIcon({ active }: { active: boolean }) {
  const c = active ? "var(--primary)" : "currentColor";
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <circle cx="8" cy="8" r="2.5" stroke={c} strokeWidth="1.5" />
      <path
        d="M8 1.5V3M8 13V14.5M1.5 8H3M13 8H14.5M3.22 3.22L4.28 4.28M11.72 11.72L12.78 12.78M3.22 12.78L4.28 11.72M11.72 4.28L12.78 3.22"
        stroke={c}
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BugIcon({ active }: { active: boolean }) {
  const c = active ? "var(--primary)" : "currentColor";
  return (
    <svg width="15" height="15" viewBox="0 0 16 16" fill="none">
      <path d="M8 3a3 3 0 0 0-3 3v3a3 3 0 0 0 6 0V6a3 3 0 0 0-3-3Z" stroke={c} strokeWidth="1.5" />
      <path d="M5 6H2M14 6h-3M5 9H2M14 9h-3M6 13l-2 2M10 13l2 2M6 3l-1-2M10 3l1-2" stroke={c} strokeWidth="1.5" strokeLinecap="round" />
    </svg>
  );
}

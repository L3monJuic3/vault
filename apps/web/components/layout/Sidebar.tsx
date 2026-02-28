"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  LayoutDashboard,
  Upload,
  List,
  RefreshCcw,
  Settings,
  Bug,
  Landmark,
} from "lucide-react";

const MAIN_NAV = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/transactions", label: "Transactions", icon: List },
  { href: "/subscriptions", label: "Subscriptions", icon: RefreshCcw },
];

const SYSTEM_NAV = [
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/debug", label: "Debug", icon: Bug },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside
      className="max-md:hidden"
      style={{
        width: 220,
        flexShrink: 0,
        height: "100vh",
        display: "flex",
        flexDirection: "column",
        background: "var(--sidebar-bg)",
        borderRight: "1px solid var(--sidebar-border)",
        position: "sticky",
        top: 0,
      }}
    >
      {/* Logo */}
      <div
        style={{
          padding: "20px 16px 16px",
          display: "flex",
          alignItems: "center",
          gap: 10,
        }}
      >
        <div
          style={{
            width: 28,
            height: 28,
            borderRadius: "var(--radius)",
            background: "var(--accent)",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            flexShrink: 0,
          }}
        >
          <Landmark size={14} color="#fff" />
        </div>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 15,
            fontWeight: 600,
            letterSpacing: "-0.02em",
            color: "var(--foreground)",
          }}
        >
          vault
        </span>
      </div>

      {/* Main nav group */}
      <nav style={{ flex: 1, padding: "4px 8px" }}>
        <div
          className="label"
          style={{ padding: "8px 12px 6px", marginBottom: 2 }}
        >
          Menu
        </div>
        {MAIN_NAV.map((item) => (
          <NavItem key={item.href} {...item} pathname={pathname} />
        ))}

        {/* System nav group */}
        <div
          className="label"
          style={{ padding: "20px 12px 6px", marginBottom: 2 }}
        >
          System
        </div>
        {SYSTEM_NAV.map((item) => (
          <NavItem key={item.href} {...item} pathname={pathname} />
        ))}
      </nav>

      {/* Footer */}
      <div
        style={{
          padding: "12px 16px",
          borderTop: "1px solid var(--sidebar-border)",
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--foreground-muted)",
        }}
      >
        v0.1.0
      </div>
    </aside>
  );
}

function NavItem({
  href,
  label,
  icon: Icon,
  pathname,
}: {
  href: string;
  label: string;
  icon: React.ComponentType<{ size?: number; style?: React.CSSProperties }>;
  pathname: string;
}) {
  const isActive =
    href === "/" ? pathname === "/" : pathname === href || pathname.startsWith(href + "/");

  return (
    <Link
      href={href}
      style={{
        display: "flex",
        alignItems: "center",
        gap: 10,
        padding: "8px 12px",
        borderRadius: "var(--radius)",
        fontSize: 13,
        fontWeight: isActive ? 500 : 400,
        textDecoration: "none",
        transition: "all 0.12s ease",
        position: "relative",
        color: isActive ? "var(--foreground)" : "var(--foreground-secondary)",
        background: isActive ? "var(--sidebar-item-active)" : "transparent",
      }}
      onMouseEnter={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "var(--sidebar-item-hover)";
          e.currentTarget.style.color = "var(--foreground)";
        }
      }}
      onMouseLeave={(e) => {
        if (!isActive) {
          e.currentTarget.style.background = "transparent";
          e.currentTarget.style.color = "var(--foreground-secondary)";
        }
      }}
    >
      {/* Active accent bar */}
      {isActive && (
        <span
          style={{
            position: "absolute",
            left: 0,
            top: "50%",
            transform: "translateY(-50%)",
            width: 3,
            height: 16,
            borderRadius: "0 2px 2px 0",
            background: "var(--sidebar-accent)",
          }}
        />
      )}
      <Icon
        size={16}
        style={{
          flexShrink: 0,
          color: isActive ? "var(--accent)" : "var(--foreground-muted)",
        }}
      />
      {label}
    </Link>
  );
}

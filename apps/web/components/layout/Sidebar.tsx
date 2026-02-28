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
import { cn } from "@/lib/utils";

const NAV_ITEMS = [
  { href: "/", label: "Dashboard", icon: LayoutDashboard },
  { href: "/upload", label: "Upload", icon: Upload },
  { href: "/transactions", label: "Transactions", icon: List },
  { href: "/subscriptions", label: "Subscriptions", icon: RefreshCcw },
  { href: "/settings", label: "Settings", icon: Settings },
  { href: "/debug", label: "Debug", icon: Bug },
];

export function Sidebar() {
  const pathname = usePathname();

  return (
    <aside className="flex h-screen w-[220px] flex-shrink-0 flex-col border-r border-[var(--sidebar-border)] bg-[var(--sidebar)] max-md:hidden">
      {/* Logo */}
      <div className="border-b border-[var(--sidebar-border)] px-4 py-5">
        <div className="flex items-center gap-2.5">
          <div className="flex h-7 w-7 flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary)]">
            <Landmark size={14} className="text-white" />
          </div>
          <span className="font-mono text-[15px] font-semibold tracking-tight text-[var(--foreground)]">
            vault
          </span>
        </div>
      </div>

      {/* Nav items */}
      <nav className="flex-1 space-y-0.5 px-2.5 py-3">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive =
            href === "/" ? pathname === "/" : pathname.startsWith(href);

          return (
            <Link
              key={href}
              href={href}
              className={cn(
                "flex items-center gap-2.5 rounded-[var(--radius)] px-3 py-2 text-[13px] no-underline transition-all duration-150",
                isActive
                  ? "bg-[var(--sidebar-item-active)] font-medium text-[var(--foreground)]"
                  : "text-[var(--foreground-muted)] hover:bg-[var(--sidebar-item-hover)] hover:text-[var(--foreground)]",
              )}
            >
              <Icon
                size={16}
                className={cn(
                  "flex-shrink-0",
                  isActive
                    ? "text-[var(--primary)]"
                    : "text-[var(--foreground-subtle)]",
                )}
              />
              {label}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="border-t border-[var(--sidebar-border)] px-4 py-3 font-mono text-[11px] text-[var(--foreground-subtle)]">
        v0.1.0
      </div>
    </aside>
  );
}

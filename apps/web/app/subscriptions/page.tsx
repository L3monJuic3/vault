"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { EmptyState } from "@/components/ui/EmptyState";
import { Wallet } from "lucide-react";
import { useCountUp } from "@/hooks/use-count-up";
import { useSubscriptions, useDismissSubscription } from "@/hooks/use-subscriptions";
import type { RecurringGroupRead } from "@vault/shared-types";

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-GB", { style: "currency", currency: "GBP" }).format(amount);
}

function frequencyLabel(freq: string): string {
  const map: Record<string, string> = {
    weekly: "Weekly",
    monthly: "Monthly",
    quarterly: "Quarterly",
    annual: "Annually",
  };
  return map[freq] ?? freq;
}

function monthlyEquivalent(sub: RecurringGroupRead): number {
  const amount = sub.estimated_amount ?? 0;
  switch (sub.frequency) {
    case "weekly": return amount * 52 / 12;
    case "quarterly": return amount / 3;
    case "annual": return amount / 12;
    default: return amount;
  }
}

function AnimatedTotal({ value }: { value: number }) {
  const animated = useCountUp(value, 800);
  return (
    <span className="mono-lg" style={{ color: "var(--gold)" }}>
      {formatCurrency(animated)}
    </span>
  );
}

const statusVariant: Record<string, "success" | "danger" | "warning" | "muted"> = {
  active: "success",
  cancelled: "danger",
  paused: "warning",
  uncertain: "muted",
};

function StatusBadge({ status }: { status: RecurringGroupRead["status"] }) {
  const variant = statusVariant[status] ?? "muted";
  return (
    <Badge variant={variant}>
      {status === "active" && (
        <span
          style={{
            display: "inline-block",
            width: 6,
            height: 6,
            borderRadius: "50%",
            background: "var(--income)",
            marginRight: 4,
          }}
        />
      )}
      {status}
    </Badge>
  );
}

function SubscriptionCard({ sub, index }: { sub: RecurringGroupRead; index: number }) {
  const dismiss = useDismissSubscription();
  const monthly = monthlyEquivalent(sub);
  const [showSteps, setShowSteps] = useState(false);

  return (
    <div
      className={`animate-card-enter stagger-${Math.min(index + 1, 6)}`}
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderLeft: sub.status === "active" ? "2px solid var(--accent)" : "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "16px",
        transition: "all 0.12s ease",
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = "var(--border-hover)";
        e.currentTarget.style.transform = "translateY(-1px)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = "";
        e.currentTarget.style.transform = "";
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", gap: 8 }}>
        <div style={{ minWidth: 0, flex: 1 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 4 }}>
            <p
              style={{
                fontSize: 14,
                fontWeight: 600,
                color: "var(--foreground)",
                overflow: "hidden",
                textOverflow: "ellipsis",
                whiteSpace: "nowrap",
              }}
            >
              {sub.merchant_name ?? sub.name}
            </p>
            <StatusBadge status={sub.status} />
          </div>
          <p style={{ fontSize: 12, color: "var(--foreground-muted)" }}>
            {frequencyLabel(sub.frequency)}
            {sub.next_expected_date && (
              <> · Next {new Date(sub.next_expected_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</>
            )}
          </p>
        </div>

        <div style={{ flexShrink: 0, textAlign: "right" }}>
          <p
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 15,
              fontWeight: 600,
              color: "var(--foreground)",
              fontVariantNumeric: "tabular-nums",
            }}
          >
            {formatCurrency(sub.estimated_amount ?? 0)}
          </p>
          <p style={{ fontSize: 11, color: "var(--foreground-muted)", marginTop: 2 }}>
            {monthly !== (sub.estimated_amount ?? 0)
              ? `${formatCurrency(monthly)}/mo`
              : "per month"}
          </p>
        </div>
      </div>

      {/* Actions */}
      <div style={{ marginTop: 12, display: "flex", gap: 6 }}>
        {sub.cancel_url && (
          <a href={sub.cancel_url} target="_blank" rel="noreferrer">
            <Button variant="outline" size="sm">
              Cancel
            </Button>
          </a>
        )}
        {sub.cancel_steps && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowSteps((v) => !v)}
          >
            {showSteps ? "Hide steps" : "How to cancel"}
          </Button>
        )}
        {sub.status === "active" && (
          <Button
            variant="ghost"
            size="sm"
            onClick={() => dismiss.mutate(sub.id)}
            disabled={dismiss.isPending}
          >
            Dismiss
          </Button>
        )}
      </div>

      {/* Cancellation steps */}
      {showSteps && sub.cancel_steps && (
        <div
          style={{
            marginTop: 10,
            padding: "10px 12px",
            borderRadius: "var(--radius-md, 6px)",
            background: "var(--surface-raised, rgba(255,255,255,0.03))",
            border: "1px solid var(--border)",
          }}
        >
          <p
            style={{
              fontSize: 13,
              color: "var(--foreground)",
              whiteSpace: "pre-line",
              lineHeight: 1.6,
            }}
          >
            {sub.cancel_steps}
          </p>
          <p style={{ fontSize: 10, color: "var(--foreground-muted)", marginTop: 8 }}>
            AI-generated — may be outdated
          </p>
        </div>
      )}
    </div>
  );
}

function SkeletonCard() {
  return (
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: 16,
      }}
    >
      <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
        <div className="skeleton" style={{ width: 140, height: 14 }} />
        <div className="skeleton" style={{ width: 60, height: 14 }} />
      </div>
      <div className="skeleton" style={{ width: 100, height: 12, marginBottom: 12 }} />
      <div className="skeleton" style={{ width: 80, height: 28 }} />
    </div>
  );
}

export default function SubscriptionsPage() {
  const { data, isLoading } = useSubscriptions();

  const active = data?.items.filter((s) => s.status === "active") ?? [];
  const inactive = data?.items.filter((s) => s.status !== "active") ?? [];

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{ padding: "32px 32px 48px", maxWidth: 1080, margin: "0 auto" }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 28,
          flexWrap: "wrap",
          gap: 16,
        }}
      >
        <div>
          <h1
            style={{
              fontSize: 24,
              fontWeight: 600,
              letterSpacing: "-0.025em",
              color: "var(--foreground)",
              lineHeight: "32px",
            }}
          >
            Subscriptions
          </h1>
          <p style={{ fontSize: 13, color: "var(--foreground-muted)", marginTop: 4 }}>
            Recurring payments detected from your statements
          </p>
        </div>

        {data && (
          <div
            style={{
              padding: "12px 20px",
              borderRadius: "var(--radius-lg)",
              border: "1px solid var(--border)",
              background: "var(--surface)",
              textAlign: "right",
            }}
          >
            <p className="label" style={{ marginBottom: 4 }}>
              Total Monthly
            </p>
            <AnimatedTotal value={data.monthly_total} />
          </div>
        )}
      </div>

      {/* Active subscriptions */}
      <div style={{ marginBottom: 32 }}>
        <h2 className="label" style={{ marginBottom: 12 }}>
          Active · {isLoading ? "—" : active.length}
        </h2>

        {isLoading ? (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 12,
            }}
          >
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : active.length === 0 ? (
          <EmptyState
            icon={Wallet}
            title="No active subscriptions detected yet"
            description="Upload a bank statement to automatically detect recurring payments."
            action={
              <a href="/upload" style={{ textDecoration: "none" }}>
                <Button variant="outline">Upload statement</Button>
              </a>
            }
          />
        ) : (
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 12,
            }}
          >
            {active.map((sub, i) => (
              <SubscriptionCard key={sub.id} sub={sub} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Inactive */}
      {inactive.length > 0 && (
        <div>
          <h2 className="label" style={{ marginBottom: 12 }}>
            Inactive · {inactive.length}
          </h2>
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))",
              gap: 12,
            }}
          >
            {inactive.map((sub, i) => (
              <SubscriptionCard key={sub.id} sub={sub} index={i} />
            ))}
          </div>
        </div>
      )}
    </motion.div>
  );
}

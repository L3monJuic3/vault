"use client";

import { Card, CardContent } from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
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

function StatusBadge({ status }: { status: RecurringGroupRead["status"] }) {
  const styles: Record<string, { bg: string; color: string }> = {
    active: { bg: "rgba(16, 185, 129, 0.12)", color: "var(--success)" },
    cancelled: { bg: "rgba(239, 68, 68, 0.1)", color: "var(--destructive)" },
    paused: { bg: "rgba(245, 158, 11, 0.12)", color: "var(--warning)" },
    uncertain: { bg: "var(--muted)", color: "var(--foreground-muted)" },
  };
  const s = styles[status] ?? styles.uncertain;
  return (
    <span
      style={{
        fontSize: "11px",
        fontWeight: 500,
        padding: "2px 8px",
        borderRadius: "20px",
        background: s.bg,
        color: s.color,
      }}
    >
      {status}
    </span>
  );
}

function SubscriptionCard({ sub }: { sub: RecurringGroupRead }) {
  const dismiss = useDismissSubscription();
  const monthly = monthlyEquivalent(sub);

  return (
    <Card>
      <CardContent style={{ padding: "16px" }}>
        <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "8px" }}>
          <div style={{ flex: 1, minWidth: 0 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
              <p
                style={{
                  fontWeight: 600,
                  fontSize: "14px",
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
            <p style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
              {frequencyLabel(sub.frequency)}
              {sub.next_expected_date && (
                <> · Next {new Date(sub.next_expected_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</>
              )}
            </p>
          </div>

          <div style={{ textAlign: "right", flexShrink: 0 }}>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontWeight: 600,
                fontSize: "16px",
                color: "var(--foreground)",
              }}
            >
              {formatCurrency(sub.estimated_amount ?? 0)}
            </p>
            <p style={{ fontSize: "11px", color: "var(--foreground-muted)", marginTop: "2px" }}>
              {monthly !== (sub.estimated_amount ?? 0)
                ? `${formatCurrency(monthly)}/mo`
                : "per month"}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: "8px", marginTop: "12px" }}>
          {sub.cancel_url && (
            <a
              href={sub.cancel_url}
              target="_blank"
              rel="noreferrer"
              style={{
                fontSize: "12px",
                color: "var(--primary)",
                textDecoration: "none",
                padding: "4px 10px",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
              }}
            >
              Cancel ↗
            </a>
          )}
          {sub.status === "active" && (
            <button
              onClick={() => dismiss.mutate(sub.id)}
              disabled={dismiss.isPending}
              style={{
                fontSize: "12px",
                color: "var(--foreground-muted)",
                background: "transparent",
                border: "1px solid var(--border)",
                borderRadius: "var(--radius-sm)",
                padding: "4px 10px",
                cursor: "pointer",
              }}
            >
              Dismiss
            </button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card>
      <CardContent style={{ padding: "16px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "8px" }}>
          <Skeleton style={{ height: "16px", width: "140px" }} />
          <Skeleton style={{ height: "16px", width: "60px" }} />
        </div>
        <Skeleton style={{ height: "12px", width: "100px", marginBottom: "12px" }} />
        <Skeleton style={{ height: "28px", width: "80px" }} />
      </CardContent>
    </Card>
  );
}

export default function SubscriptionsPage() {
  const { data, isLoading } = useSubscriptions();

  const active = data?.items.filter((s) => s.status === "active") ?? [];
  const inactive = data?.items.filter((s) => s.status !== "active") ?? [];

  return (
    <div style={{ padding: "28px 32px", maxWidth: "1100px", margin: "0 auto" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: "24px",
        }}
      >
        <div>
          <h1
            style={{
              fontSize: "20px",
              fontWeight: 600,
              color: "var(--foreground)",
              letterSpacing: "-0.02em",
            }}
          >
            Subscriptions
          </h1>
          <p style={{ fontSize: "13px", color: "var(--foreground-muted)", marginTop: "2px" }}>
            Recurring payments detected from your statements.
          </p>
        </div>

        {data && (
          <div
            style={{
              textAlign: "right",
              padding: "12px 16px",
              background: "var(--surface-raised)",
              borderRadius: "var(--radius)",
              border: "1px solid var(--border)",
            }}
          >
            <p style={{ fontSize: "11px", color: "var(--foreground-muted)", marginBottom: "2px" }}>
              Total monthly
            </p>
            <p
              style={{
                fontFamily: "var(--font-mono)",
                fontSize: "22px",
                fontWeight: 700,
                color: "var(--foreground)",
              }}
            >
              {formatCurrency(data.monthly_total)}
            </p>
          </div>
        )}
      </div>

      {/* Active subscriptions */}
      <div style={{ marginBottom: "32px" }}>
        <h2
          style={{
            fontSize: "12px",
            fontWeight: 600,
            color: "var(--foreground-muted)",
            textTransform: "uppercase",
            letterSpacing: "0.06em",
            marginBottom: "12px",
          }}
        >
          Active · {isLoading ? "—" : active.length}
        </h2>

        {isLoading ? (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {Array.from({ length: 6 }).map((_, i) => <SkeletonCard key={i} />)}
          </div>
        ) : active.length === 0 ? (
          <div
            style={{
              padding: "32px",
              textAlign: "center",
              color: "var(--foreground-muted)",
              fontSize: "13px",
              border: "1px dashed var(--border)",
              borderRadius: "var(--radius)",
            }}
          >
            No active subscriptions detected yet.{" "}
            <a href="/upload" style={{ color: "var(--primary)", textDecoration: "none" }}>
              Upload a statement
            </a>{" "}
            to get started.
          </div>
        ) : (
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {active.map((sub) => <SubscriptionCard key={sub.id} sub={sub} />)}
          </div>
        )}
      </div>

      {/* Inactive / cancelled */}
      {inactive.length > 0 && (
        <div>
          <h2
            style={{
              fontSize: "12px",
              fontWeight: 600,
              color: "var(--foreground-muted)",
              textTransform: "uppercase",
              letterSpacing: "0.06em",
              marginBottom: "12px",
            }}
          >
            Inactive · {inactive.length}
          </h2>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fill, minmax(280px, 1fr))", gap: "12px" }}>
            {inactive.map((sub) => <SubscriptionCard key={sub.id} sub={sub} />)}
          </div>
        </div>
      )}
    </div>
  );
}

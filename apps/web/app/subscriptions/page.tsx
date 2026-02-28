"use client";

import { Card, CardContent, PageWrapper, PageHeader, Badge, Button } from "@/components/ui";
import { Skeleton } from "@/components/ui/skeleton";
import { Wallet } from "lucide-react";
import { useCountUp } from "@/hooks/use-count-up";
import { useSubscriptions, useDismissSubscription } from "@/hooks/use-subscriptions";
import { cn } from "@/lib/utils";
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
    <p className="text-xl font-bold font-mono text-[var(--foreground)]">
      {formatCurrency(animated)}
    </p>
  );
}

const statusVariant: Record<string, "success" | "destructive" | "warning" | "secondary"> = {
  active: "success",
  cancelled: "destructive",
  paused: "warning",
  uncertain: "secondary",
};

function StatusBadge({ status }: { status: RecurringGroupRead["status"] }) {
  const variant = statusVariant[status] ?? "secondary";
  return (
    <Badge variant={variant} className="text-[11px]">
      {status === "active" && (
        <span className="mr-1 inline-block h-1.5 w-1.5 rounded-full bg-[var(--success)]" />
      )}
      {status}
    </Badge>
  );
}

function SubscriptionCard({ sub, index }: { sub: RecurringGroupRead; index: number }) {
  const dismiss = useDismissSubscription();
  const monthly = monthlyEquivalent(sub);

  return (
    <Card
      interactive
      className={cn(
        `animate-fade-in-up stagger-${Math.min(index + 1, 6)}`,
      )}
    >
      <CardContent className="p-4">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0 flex-1">
            <div className="mb-1 flex items-center gap-2">
              <p className="truncate text-sm font-semibold text-[var(--foreground)]">
                {sub.merchant_name ?? sub.name}
              </p>
              <StatusBadge status={sub.status} />
            </div>
            <p className="text-xs text-[var(--foreground-muted)]">
              {frequencyLabel(sub.frequency)}
              {sub.next_expected_date && (
                <> · Next {new Date(sub.next_expected_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}</>
              )}
            </p>
          </div>

          <div className="flex-shrink-0 text-right">
            <p className="font-mono text-base font-semibold text-[var(--foreground)]">
              {formatCurrency(sub.estimated_amount ?? 0)}
            </p>
            <p className="mt-0.5 text-[11px] text-[var(--foreground-muted)]">
              {monthly !== (sub.estimated_amount ?? 0)
                ? `${formatCurrency(monthly)}/mo`
                : "per month"}
            </p>
          </div>
        </div>

        {/* Actions */}
        <div className="mt-3 flex gap-2">
          {sub.cancel_url && (
            <a
              href={sub.cancel_url}
              target="_blank"
              rel="noreferrer"
            >
              <Button variant="outline" size="sm" className="h-7 text-xs">
                Cancel
              </Button>
            </a>
          )}
          {sub.status === "active" && (
            <Button
              variant="ghost"
              size="sm"
              className="h-7 text-xs"
              onClick={() => dismiss.mutate(sub.id)}
              disabled={dismiss.isPending}
            >
              Dismiss
            </Button>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

function SkeletonCard() {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="mb-2 flex justify-between">
          <Skeleton className="h-4 w-[140px]" />
          <Skeleton className="h-4 w-[60px]" />
        </div>
        <Skeleton className="mb-3 h-3 w-[100px]" />
        <Skeleton className="h-7 w-[80px]" />
      </CardContent>
    </Card>
  );
}

function EmptyState() {
  return (
    <div className="animate-fade-in-up rounded-[var(--radius-lg)] border border-dashed border-[var(--border)] p-12 text-center">
      <Wallet
        size={48}
        className="mx-auto mb-4 text-[var(--foreground-muted)] opacity-40"
      />
      <p className="mb-1 text-sm text-[var(--foreground-muted)]">
        No active subscriptions detected yet.
      </p>
      <p className="text-[13px]">
        <a href="/upload" className="text-[var(--primary)] hover:underline">
          Upload a statement
        </a>{" "}
        <span className="text-[var(--foreground-muted)]">to get started.</span>
      </p>
    </div>
  );
}

export default function SubscriptionsPage() {
  const { data, isLoading } = useSubscriptions();

  const active = data?.items.filter((s) => s.status === "active") ?? [];
  const inactive = data?.items.filter((s) => s.status !== "active") ?? [];

  return (
    <PageWrapper maxWidth="xl" className="animate-fade-in-up">
      <PageHeader
        title="Subscriptions"
        subtitle="Recurring payments detected from your statements."
      >
        {data && (
          <div className="animate-fade-in-up stagger-1 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-right">
            <p className="text-[11px] text-[var(--foreground-muted)]">
              Total monthly
            </p>
            <AnimatedTotal value={data.monthly_total} />
          </div>
        )}
      </PageHeader>

      {/* Active subscriptions */}
      <div className="mb-8">
        <h2 className="text-section-label mb-3">
          Active · {isLoading ? "—" : active.length}
        </h2>

        {isLoading ? (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : active.length === 0 ? (
          <EmptyState />
        ) : (
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
            {active.map((sub, i) => (
              <SubscriptionCard key={sub.id} sub={sub} index={i} />
            ))}
          </div>
        )}
      </div>

      {/* Inactive / cancelled */}
      {inactive.length > 0 && (
        <div>
          <h2 className="text-section-label mb-3">
            Inactive · {inactive.length}
          </h2>
          <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-3">
            {inactive.map((sub, i) => (
              <SubscriptionCard key={sub.id} sub={sub} index={i} />
            ))}
          </div>
        </div>
      )}
    </PageWrapper>
  );
}

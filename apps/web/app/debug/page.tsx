"use client";

import { useState } from "react";
import { Card, CardContent, PageWrapper, PageHeader, Button } from "@/components/ui";
import { cn } from "@/lib/utils";
import {
  useHealth,
  useLogs,
  useClearLogs,
  useTestLog,
  type LogEntry,
  type ServiceHealth,
} from "@/hooks/use-debug";

// -- Helpers ------------------------------------------------------------------

function statusColour(status: string) {
  if (status === "ok") return "var(--success)";
  if (status === "warning") return "var(--warning)";
  return "var(--destructive)";
}

function levelColour(level: string) {
  switch (level) {
    case "ERROR":
    case "CRITICAL":
      return { bg: "var(--destructive-light)", text: "var(--destructive)" };
    case "WARNING":
      return { bg: "var(--warning-light)", text: "var(--warning)" };
    case "INFO":
      return { bg: "var(--primary-light)", text: "var(--primary)" };
    default:
      return { bg: "var(--muted)", text: "var(--foreground-muted)" };
  }
}

function timeSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return new Date(iso).toLocaleTimeString("en-GB");
}

// -- Service Health Card ------------------------------------------------------

function ServiceCard({
  name,
  service,
}: {
  name: string;
  service: ServiceHealth | undefined;
}) {
  const status = service?.status ?? "error";
  const colour = statusColour(status);

  return (
    <Card>
      <CardContent className="flex flex-col gap-2 p-4">
        <div className="flex items-center justify-between">
          <span className="text-section-label">{name}</span>
          <span
            className="h-2 w-2 rounded-full"
            style={{ background: colour }}
          />
        </div>
        <div
          className="text-[15px] font-semibold capitalize"
          style={{ color: colour }}
        >
          {status}
        </div>
        {service?.latency_ms !== undefined && (
          <div className="font-mono text-xs text-[var(--foreground-muted)]">
            {service.latency_ms}ms latency
          </div>
        )}
        {service?.workers !== undefined && (
          <div className="text-xs text-[var(--foreground-muted)]">
            {service.workers} worker{service.workers !== 1 ? "s" : ""} active
          </div>
        )}
        {service?.error && (
          <div className="mt-1 text-xs text-[var(--destructive)]">
            {service.error}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

// -- Log Row ------------------------------------------------------------------

function LogRow({
  log,
  expanded,
  onToggle,
}: {
  log: LogEntry;
  expanded: boolean;
  onToggle: () => void;
}) {
  const { bg, text } = levelColour(log.level);

  return (
    <div
      className={cn(
        "border-b border-[var(--border)]",
        log.detail && "cursor-pointer hover:bg-[var(--surface-raised)]",
      )}
      onClick={log.detail ? onToggle : undefined}
    >
      <div className="grid grid-cols-[60px_60px_1fr_80px] items-center gap-3 px-4 py-2.5">
        {/* Level badge */}
        <span
          className="rounded-[var(--radius-sm)] text-center font-mono text-[11px] font-semibold px-1.5 py-0.5"
          style={{ color: text, background: bg }}
        >
          {log.level}
        </span>

        {/* Category */}
        <span className="font-mono text-[11px] text-[var(--foreground-muted)]">
          {log.category}
        </span>

        {/* Message */}
        <span className="truncate font-mono text-[13px] text-[var(--foreground)]">
          {log.message}
        </span>

        {/* Time */}
        <span className="text-right font-mono text-[11px] text-[var(--foreground-muted)]">
          {timeSince(log.created_at)}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && log.detail && (
        <div className="border-t border-[var(--border)] bg-[var(--surface-raised)] px-4">
          <pre className="break-all whitespace-pre-wrap py-3 font-mono text-xs text-[var(--foreground-muted)]">
            {JSON.stringify(log.detail, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// -- Page ---------------------------------------------------------------------

const LOG_LEVELS = ["ALL", "ERROR", "WARNING", "INFO", "DEBUG"];
const LOG_CATEGORIES = ["ALL", "http", "parse", "ai", "auth", "system", "task"];

export default function DebugPage() {
  const [autoRefresh, setAutoRefresh] = useState(true);
  const [levelFilter, setLevelFilter] = useState("ALL");
  const [categoryFilter, setCategoryFilter] = useState("ALL");
  const [expandedId, setExpandedId] = useState<string | null>(null);

  const { data: health, isLoading: healthLoading } = useHealth(autoRefresh);
  const { data: logsData, isLoading: logsLoading } = useLogs({
    level: levelFilter === "ALL" ? undefined : levelFilter,
    category: categoryFilter === "ALL" ? undefined : categoryFilter,
    limit: 200,
  });
  const clearLogs = useClearLogs();
  const testLog = useTestLog();

  const overallColour = statusColour(health?.status ?? "error");

  return (
    <PageWrapper maxWidth="2xl">
      <PageHeader
        title="Debug"
        subtitle="Service health, request logs, and error history"
      >
        <Button
          variant={autoRefresh ? "default" : "outline"}
          size="sm"
          onClick={() => setAutoRefresh(!autoRefresh)}
          className="font-mono text-xs"
        >
          {autoRefresh ? "\u25CF LIVE" : "\u25CB PAUSED"}
        </Button>
        <Button
          variant="outline"
          size="sm"
          onClick={() => testLog.mutate()}
        >
          Test log
        </Button>
        <Button
          variant="outline"
          size="sm"
          className="text-[var(--destructive)]"
          onClick={() => clearLogs.mutate()}
        >
          Clear logs
        </Button>
      </PageHeader>

      {/* Overall status banner */}
      <div
        className="mb-5 flex items-center gap-2.5 rounded-[var(--radius)] bg-[var(--surface)] px-4 py-3"
        style={{ borderColor: overallColour, borderWidth: "1px", borderStyle: "solid" }}
      >
        <span
          className="h-2.5 w-2.5 flex-shrink-0 rounded-full"
          style={{ background: overallColour }}
        />
        <span
          className="text-sm font-semibold capitalize"
          style={{ color: overallColour }}
        >
          {healthLoading ? "Checking\u2026" : `System ${health?.status ?? "unknown"}`}
        </span>
        {health?.timestamp && (
          <span className="ml-auto font-mono text-xs text-[var(--foreground-muted)]">
            Last checked {timeSince(health.timestamp)}
          </span>
        )}
      </div>

      {/* Service cards */}
      <div className="mb-7 grid grid-cols-2 gap-3 lg:grid-cols-4">
        <ServiceCard name="Database" service={health?.services.database} />
        <ServiceCard name="Redis" service={health?.services.redis} />
        <ServiceCard name="Celery Worker" service={health?.services.celery} />
        <ServiceCard name="AI (Claude)" service={health?.services.ai} />
      </div>

      {/* Log counts strip */}
      {logsData?.counts && (
        <div className="mb-4 flex flex-wrap items-center gap-2">
          {(["ERROR", "WARNING", "INFO", "DEBUG"] as const).map((lvl) => {
            const count = logsData.counts[lvl] ?? 0;
            if (!count) return null;
            const active = levelFilter === lvl;
            const { bg, text } = levelColour(lvl);
            return (
              <button
                key={lvl}
                onClick={() =>
                  setLevelFilter(active ? "ALL" : lvl)
                }
                className={cn(
                  "rounded-[var(--radius-sm)] border px-2.5 py-1 font-mono text-xs transition-colors duration-150 cursor-pointer",
                  active
                    ? "font-medium"
                    : "border-[var(--border)] bg-[var(--surface)] text-[var(--foreground-muted)]",
                )}
                style={
                  active
                    ? { background: bg, color: text, borderColor: text }
                    : undefined
                }
              >
                {lvl} · {count}
              </button>
            );
          })}
          <span className="ml-auto font-mono text-xs text-[var(--foreground-muted)]">
            {logsData.total} total
          </span>
        </div>
      )}

      {/* Category filter */}
      <div className="mb-3 flex flex-wrap gap-1.5">
        {LOG_CATEGORIES.map((cat) => {
          const active = categoryFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              className={cn(
                "rounded-[var(--radius-sm)] border px-2 py-1 font-mono text-[11px] transition-colors duration-150 cursor-pointer",
                active
                  ? "border-[var(--primary)] bg-[var(--primary-lighter)] text-[var(--primary)]"
                  : "border-transparent text-[var(--foreground-muted)] hover:text-[var(--foreground)]",
              )}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Log table */}
      <Card>
        <CardContent className="overflow-hidden p-0">
          {/* Table header */}
          <div className="grid grid-cols-[60px_60px_1fr_80px] gap-3 border-b border-[var(--border)] bg-[var(--surface-raised)] px-4 py-2">
            {["LEVEL", "CAT", "MESSAGE", "TIME"].map((h) => (
              <span
                key={h}
                className="font-mono text-[11px] font-semibold tracking-wide text-[var(--foreground-subtle)]"
              >
                {h}
              </span>
            ))}
          </div>

          {/* Rows */}
          {logsLoading ? (
            <div className="py-8 text-center text-[13px] text-[var(--foreground-muted)]">
              Loading logs...
            </div>
          ) : !logsData?.logs.length ? (
            <div className="py-8 text-center text-[13px] text-[var(--foreground-muted)]">
              No logs yet. Hit &ldquo;Test log&rdquo; to verify the pipeline is working.
            </div>
          ) : (
            <div className="max-h-[600px] overflow-y-auto">
              {logsData.logs.map((log) => (
                <LogRow
                  key={log.id}
                  log={log}
                  expanded={expandedId === log.id}
                  onToggle={() =>
                    setExpandedId(expandedId === log.id ? null : log.id)
                  }
                />
              ))}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Footer note */}
      <p className="mt-3 font-mono text-xs text-[var(--foreground-subtle)]">
        Click any log row to expand full detail and traceback. Logs auto-refresh
        every 5s when live mode is on.
      </p>
    </PageWrapper>
  );
}

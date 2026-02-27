"use client";

import { useState } from "react";
import {
  useHealth,
  useLogs,
  useClearLogs,
  useTestLog,
  type LogEntry,
  type ServiceHealth,
} from "@/hooks/use-debug";

// ── Helpers ────────────────────────────────────────────────────────────────────

function statusColour(status: string) {
  if (status === "ok") return "var(--income)";
  if (status === "warning") return "#f59e0b";
  return "var(--spending)";
}

function levelColour(level: string) {
  switch (level) {
    case "ERROR":
    case "CRITICAL":
      return { bg: "rgba(239,68,68,0.1)", text: "var(--spending)" };
    case "WARNING":
      return { bg: "rgba(245,158,11,0.1)", text: "#f59e0b" };
    case "INFO":
      return { bg: "rgba(99,102,241,0.1)", text: "var(--primary)" };
    default:
      return { bg: "var(--surface-raised)", text: "var(--foreground-muted)" };
  }
}

function timeSince(iso: string) {
  const diff = Date.now() - new Date(iso).getTime();
  if (diff < 60000) return `${Math.floor(diff / 1000)}s ago`;
  if (diff < 3600000) return `${Math.floor(diff / 60000)}m ago`;
  return new Date(iso).toLocaleTimeString("en-GB");
}

// ── Service Health Card ────────────────────────────────────────────────────────

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
    <div
      style={{
        background: "var(--surface)",
        border: `1px solid var(--border)`,
        borderRadius: "var(--radius)",
        padding: "16px",
        display: "flex",
        flexDirection: "column",
        gap: "8px",
      }}
    >
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <span style={{ fontSize: "13px", color: "var(--foreground-muted)", textTransform: "uppercase", letterSpacing: "0.05em" }}>
          {name}
        </span>
        <span
          style={{
            width: "8px",
            height: "8px",
            borderRadius: "50%",
            background: colour,
            boxShadow: `0 0 6px ${colour}`,
          }}
        />
      </div>
      <div style={{ fontSize: "15px", fontWeight: 600, color: colour, textTransform: "capitalize" }}>
        {status}
      </div>
      {service?.latency_ms !== undefined && (
        <div style={{ fontSize: "12px", color: "var(--foreground-muted)", fontFamily: "var(--font-mono)" }}>
          {service.latency_ms}ms latency
        </div>
      )}
      {service?.workers !== undefined && (
        <div style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>
          {service.workers} worker{service.workers !== 1 ? "s" : ""} active
        </div>
      )}
      {service?.error && (
        <div style={{ fontSize: "12px", color: "var(--spending)", marginTop: "4px" }}>
          {service.error}
        </div>
      )}
    </div>
  );
}

// ── Log Row ────────────────────────────────────────────────────────────────────

function LogRow({ log, expanded, onToggle }: { log: LogEntry; expanded: boolean; onToggle: () => void }) {
  const { bg, text } = levelColour(log.level);

  return (
    <div
      style={{
        borderBottom: "1px solid var(--border)",
        cursor: log.detail ? "pointer" : "default",
      }}
      onClick={log.detail ? onToggle : undefined}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "60px 60px 1fr 80px",
          gap: "12px",
          padding: "10px 16px",
          alignItems: "center",
        }}
      >
        {/* Level badge */}
        <span
          style={{
            fontSize: "11px",
            fontWeight: 600,
            fontFamily: "var(--font-mono)",
            color: text,
            background: bg,
            padding: "2px 6px",
            borderRadius: "3px",
            textAlign: "center",
          }}
        >
          {log.level}
        </span>

        {/* Category */}
        <span
          style={{
            fontSize: "11px",
            color: "var(--foreground-muted)",
            fontFamily: "var(--font-mono)",
          }}
        >
          {log.category}
        </span>

        {/* Message */}
        <span
          style={{
            fontSize: "13px",
            color: "var(--foreground)",
            fontFamily: "var(--font-mono)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {log.message}
        </span>

        {/* Time */}
        <span
          style={{
            fontSize: "11px",
            color: "var(--foreground-muted)",
            fontFamily: "var(--font-mono)",
            textAlign: "right",
          }}
        >
          {timeSince(log.created_at)}
        </span>
      </div>

      {/* Expanded detail */}
      {expanded && log.detail && (
        <div
          style={{
            padding: "0 16px 12px",
            background: "var(--surface-raised)",
            borderTop: "1px solid var(--border)",
          }}
        >
          <pre
            style={{
              fontSize: "12px",
              color: "var(--foreground-muted)",
              fontFamily: "var(--font-mono)",
              margin: 0,
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              padding: "12px 0",
            }}
          >
            {JSON.stringify(log.detail, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// ── Page ───────────────────────────────────────────────────────────────────────

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
    <div style={{ padding: "28px 32px", maxWidth: "1400px", margin: "0 auto" }}>

      {/* Header */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: "28px" }}>
        <div>
          <h1 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.02em" }}>
            Debug
          </h1>
          <p style={{ fontSize: "13px", color: "var(--foreground-muted)", marginTop: "2px" }}>
            Service health, request logs, and error history
          </p>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <button
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              fontFamily: "var(--font-mono)",
              background: autoRefresh ? "rgba(99,102,241,0.15)" : "var(--surface)",
              color: autoRefresh ? "var(--primary)" : "var(--foreground-muted)",
              border: `1px solid ${autoRefresh ? "var(--primary)" : "var(--border)"}`,
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
            }}
          >
            {autoRefresh ? "● LIVE" : "○ PAUSED"}
          </button>
          <button
            onClick={() => testLog.mutate()}
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              background: "var(--surface)",
              color: "var(--foreground-muted)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
            }}
          >
            Test log
          </button>
          <button
            onClick={() => clearLogs.mutate()}
            style={{
              padding: "6px 12px",
              fontSize: "12px",
              background: "var(--surface)",
              color: "var(--spending)",
              border: "1px solid var(--border)",
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
            }}
          >
            Clear logs
          </button>
        </div>
      </div>

      {/* Overall status banner */}
      <div
        style={{
          background: "var(--surface)",
          border: `1px solid ${overallColour}`,
          borderRadius: "var(--radius)",
          padding: "12px 16px",
          display: "flex",
          alignItems: "center",
          gap: "10px",
          marginBottom: "20px",
        }}
      >
        <span style={{ width: "10px", height: "10px", borderRadius: "50%", background: overallColour, flexShrink: 0, boxShadow: `0 0 8px ${overallColour}` }} />
        <span style={{ fontSize: "14px", fontWeight: 600, color: overallColour, textTransform: "capitalize" }}>
          {healthLoading ? "Checking…" : `System ${health?.status ?? "unknown"}`}
        </span>
        {health?.timestamp && (
          <span style={{ fontSize: "12px", color: "var(--foreground-muted)", fontFamily: "var(--font-mono)", marginLeft: "auto" }}>
            Last checked {timeSince(health.timestamp)}
          </span>
        )}
      </div>

      {/* Service cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: "12px",
          marginBottom: "28px",
        }}
      >
        <ServiceCard name="Database" service={health?.services.database} />
        <ServiceCard name="Redis" service={health?.services.redis} />
        <ServiceCard name="Celery Worker" service={health?.services.celery} />
        <ServiceCard name="AI (Claude)" service={health?.services.ai} />
      </div>

      {/* Log counts strip */}
      {logsData?.counts && (
        <div style={{ display: "flex", gap: "16px", marginBottom: "16px", flexWrap: "wrap" }}>
          {["ERROR", "WARNING", "INFO", "DEBUG"].map((lvl) => {
            const count = logsData.counts[lvl] ?? 0;
            if (!count) return null;
            const { bg, text } = levelColour(lvl);
            return (
              <button
                key={lvl}
                onClick={() => setLevelFilter(levelFilter === lvl ? "ALL" : lvl)}
                style={{
                  padding: "4px 10px",
                  fontSize: "12px",
                  fontFamily: "var(--font-mono)",
                  background: levelFilter === lvl ? bg : "var(--surface)",
                  color: levelFilter === lvl ? text : "var(--foreground-muted)",
                  border: `1px solid ${levelFilter === lvl ? text : "var(--border)"}`,
                  borderRadius: "var(--radius-sm)",
                  cursor: "pointer",
                }}
              >
                {lvl} · {count}
              </button>
            );
          })}
          <span style={{ fontSize: "12px", color: "var(--foreground-muted)", alignSelf: "center", marginLeft: "auto", fontFamily: "var(--font-mono)" }}>
            {logsData.total} total
          </span>
        </div>
      )}

      {/* Category filter */}
      <div style={{ display: "flex", gap: "8px", marginBottom: "12px", flexWrap: "wrap" }}>
        {LOG_CATEGORIES.map((cat) => (
          <button
            key={cat}
            onClick={() => setCategoryFilter(cat)}
            style={{
              padding: "3px 8px",
              fontSize: "11px",
              fontFamily: "var(--font-mono)",
              background: categoryFilter === cat ? "rgba(99,102,241,0.15)" : "transparent",
              color: categoryFilter === cat ? "var(--primary)" : "var(--foreground-muted)",
              border: `1px solid ${categoryFilter === cat ? "var(--primary)" : "transparent"}`,
              borderRadius: "var(--radius-sm)",
              cursor: "pointer",
            }}
          >
            {cat}
          </button>
        ))}
      </div>

      {/* Log table */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius)",
          overflow: "hidden",
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "60px 60px 1fr 80px",
            gap: "12px",
            padding: "8px 16px",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface-raised)",
          }}
        >
          {["LEVEL", "CAT", "MESSAGE", "TIME"].map((h) => (
            <span key={h} style={{ fontSize: "11px", fontWeight: 600, color: "var(--foreground-subtle)", fontFamily: "var(--font-mono)", letterSpacing: "0.05em" }}>
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {logsLoading ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--foreground-muted)", fontSize: "13px" }}>
            Loading logs…
          </div>
        ) : !logsData?.logs.length ? (
          <div style={{ padding: "32px", textAlign: "center", color: "var(--foreground-muted)", fontSize: "13px" }}>
            No logs yet. Hit "Test log" to verify the pipeline is working.
          </div>
        ) : (
          <div style={{ maxHeight: "600px", overflowY: "auto" }}>
            {logsData.logs.map((log) => (
              <LogRow
                key={log.id}
                log={log}
                expanded={expandedId === log.id}
                onToggle={() => setExpandedId(expandedId === log.id ? null : log.id)}
              />
            ))}
          </div>
        )}
      </div>

      {/* Footer note */}
      <p style={{ fontSize: "12px", color: "var(--foreground-subtle)", marginTop: "12px", fontFamily: "var(--font-mono)" }}>
        Click any log row with a ▸ indicator to expand full detail and traceback. Logs auto-refresh every 5s when live mode is on.
      </p>
    </div>
  );
}

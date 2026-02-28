"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
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

function levelVariant(level: string): "danger" | "warning" | "accent" | "muted" {
  switch (level) {
    case "ERROR":
    case "CRITICAL":
      return "danger";
    case "WARNING":
      return "warning";
    case "INFO":
      return "accent";
    default:
      return "muted";
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
    <div
      style={{
        background: "var(--surface)",
        border: "1px solid var(--border)",
        borderRadius: "var(--radius-lg)",
        padding: "14px 16px",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 8,
        }}
      >
        <span className="label">{name}</span>
        <span
          style={{
            width: 8,
            height: 8,
            borderRadius: "50%",
            background: colour,
          }}
        />
      </div>
      <div
        style={{
          fontSize: 15,
          fontWeight: 600,
          textTransform: "capitalize",
          color: colour,
          marginBottom: 4,
        }}
      >
        {status}
      </div>
      {service?.latency_ms !== undefined && (
        <div
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--foreground-muted)",
          }}
        >
          {service.latency_ms}ms latency
        </div>
      )}
      {service?.workers !== undefined && (
        <div style={{ fontSize: 11, color: "var(--foreground-muted)" }}>
          {service.workers} worker{service.workers !== 1 ? "s" : ""} active
        </div>
      )}
      {service?.error && (
        <div
          style={{
            fontSize: 11,
            color: "var(--spending)",
            marginTop: 4,
          }}
        >
          {service.error}
        </div>
      )}
    </div>
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
  return (
    <div
      style={{
        borderBottom: "1px solid var(--border)",
        cursor: log.detail ? "pointer" : "default",
        transition: "background 0.1s ease",
      }}
      onClick={log.detail ? onToggle : undefined}
      onMouseEnter={(e) => {
        if (log.detail) e.currentTarget.style.background = "var(--surface-raised)";
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.background = "transparent";
      }}
    >
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "60px 60px 1fr 80px",
          alignItems: "center",
          gap: 12,
          padding: "8px 16px",
        }}
      >
        <Badge variant={levelVariant(log.level)}>
          {log.level}
        </Badge>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--foreground-muted)",
          }}
        >
          {log.category}
        </span>
        <span
          style={{
            fontFamily: "var(--font-mono)",
            fontSize: 13,
            color: "var(--foreground)",
            overflow: "hidden",
            textOverflow: "ellipsis",
            whiteSpace: "nowrap",
          }}
        >
          {log.message}
        </span>
        <span
          style={{
            textAlign: "right",
            fontFamily: "var(--font-mono)",
            fontSize: 11,
            color: "var(--foreground-muted)",
          }}
        >
          {timeSince(log.created_at)}
        </span>
      </div>

      {expanded && log.detail && (
        <div
          style={{
            borderTop: "1px solid var(--border)",
            background: "var(--surface-raised)",
            padding: "12px 16px",
          }}
        >
          <pre
            style={{
              fontFamily: "var(--font-mono)",
              fontSize: 12,
              color: "var(--foreground-muted)",
              whiteSpace: "pre-wrap",
              wordBreak: "break-all",
              lineHeight: "18px",
            }}
          >
            {JSON.stringify(log.detail, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
}

// -- Page ---------------------------------------------------------------------

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
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{ padding: "32px 32px 48px", maxWidth: 1280, margin: "0 auto" }}
    >
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 24,
          flexWrap: "wrap",
          gap: 12,
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
            Debug
          </h1>
          <p style={{ fontSize: 13, color: "var(--foreground-muted)", marginTop: 4 }}>
            Service health, request logs, and error history
          </p>
        </div>
        <div style={{ display: "flex", gap: 6 }}>
          <Button
            variant={autoRefresh ? "default" : "outline"}
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            style={{ fontFamily: "var(--font-mono)", fontSize: 12 }}
          >
            {autoRefresh ? "\u25CF LIVE" : "\u25CB PAUSED"}
          </Button>
          <Button variant="outline" size="sm" onClick={() => testLog.mutate()}>
            Test log
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => clearLogs.mutate()}
            style={{ color: "var(--spending)" }}
          >
            Clear logs
          </Button>
        </div>
      </div>

      {/* Overall status banner */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 10,
          marginBottom: 20,
          padding: "10px 16px",
          borderRadius: "var(--radius)",
          background: "var(--surface)",
          border: `1px solid ${overallColour}`,
        }}
      >
        <span
          style={{
            width: 10,
            height: 10,
            borderRadius: "50%",
            background: overallColour,
            flexShrink: 0,
          }}
        />
        <span
          style={{
            fontSize: 14,
            fontWeight: 600,
            textTransform: "capitalize",
            color: overallColour,
          }}
        >
          {healthLoading ? "Checking\u2026" : `System ${health?.status ?? "unknown"}`}
        </span>
        {health?.timestamp && (
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--foreground-muted)",
            }}
          >
            Last checked {timeSince(health.timestamp)}
          </span>
        )}
      </div>

      {/* Service cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(4, 1fr)",
          gap: 12,
          marginBottom: 28,
        }}
        className="max-lg:grid-cols-2"
      >
        <ServiceCard name="Database" service={health?.services.database} />
        <ServiceCard name="Redis" service={health?.services.redis} />
        <ServiceCard name="Celery Worker" service={health?.services.celery} />
        <ServiceCard name="AI (Claude)" service={health?.services.ai} />
      </div>

      {/* Log counts strip */}
      {logsData?.counts && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            alignItems: "center",
            gap: 6,
            marginBottom: 12,
          }}
        >
          {(["ERROR", "WARNING", "INFO", "DEBUG"] as const).map((lvl) => {
            const count = logsData.counts[lvl] ?? 0;
            if (!count) return null;
            const active = levelFilter === lvl;
            return (
              <button
                key={lvl}
                onClick={() => setLevelFilter(active ? "ALL" : lvl)}
                style={{
                  padding: "4px 10px",
                  fontFamily: "var(--font-mono)",
                  fontSize: 11,
                  fontWeight: active ? 500 : 400,
                  borderRadius: "var(--radius-sm)",
                  border: "1px solid",
                  cursor: "pointer",
                  transition: "all 0.12s ease",
                  borderColor: active ? "var(--accent)" : "var(--border)",
                  background: active ? "var(--accent-muted)" : "var(--surface)",
                  color: active ? "var(--accent)" : "var(--foreground-muted)",
                }}
              >
                {lvl} · {count}
              </button>
            );
          })}
          <span
            style={{
              marginLeft: "auto",
              fontFamily: "var(--font-mono)",
              fontSize: 11,
              color: "var(--foreground-muted)",
            }}
          >
            {logsData.total} total
          </span>
        </div>
      )}

      {/* Category filter */}
      <div style={{ display: "flex", flexWrap: "wrap", gap: 4, marginBottom: 12 }}>
        {LOG_CATEGORIES.map((cat) => {
          const active = categoryFilter === cat;
          return (
            <button
              key={cat}
              onClick={() => setCategoryFilter(cat)}
              style={{
                padding: "4px 8px",
                fontFamily: "var(--font-mono)",
                fontSize: 11,
                borderRadius: "var(--radius-sm)",
                border: "1px solid",
                cursor: "pointer",
                transition: "all 0.12s ease",
                borderColor: active ? "var(--accent)" : "transparent",
                background: active ? "var(--accent-glow)" : "transparent",
                color: active ? "var(--accent)" : "var(--foreground-muted)",
              }}
            >
              {cat}
            </button>
          );
        })}
      </div>

      {/* Log table */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          overflow: "hidden",
        }}
      >
        {/* Table header */}
        <div
          style={{
            display: "grid",
            gridTemplateColumns: "60px 60px 1fr 80px",
            gap: 12,
            padding: "8px 16px",
            borderBottom: "1px solid var(--border)",
            background: "var(--surface-raised)",
          }}
        >
          {["LEVEL", "CAT", "MESSAGE", "TIME"].map((h) => (
            <span
              key={h}
              className="label"
            >
              {h}
            </span>
          ))}
        </div>

        {/* Rows */}
        {logsLoading ? (
          <div
            style={{
              padding: "40px 0",
              textAlign: "center",
              fontSize: 13,
              color: "var(--foreground-muted)",
            }}
          >
            Loading logs...
          </div>
        ) : !logsData?.logs.length ? (
          <div
            style={{
              padding: "40px 0",
              textAlign: "center",
              fontSize: 13,
              color: "var(--foreground-muted)",
            }}
          >
            No logs yet. Hit &ldquo;Test log&rdquo; to verify the pipeline is working.
          </div>
        ) : (
          <div style={{ maxHeight: 600, overflowY: "auto" }}>
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
      </div>

      {/* Footer note */}
      <p
        style={{
          marginTop: 12,
          fontFamily: "var(--font-mono)",
          fontSize: 11,
          color: "var(--foreground-muted)",
        }}
      >
        Click any log row to expand full detail and traceback. Logs auto-refresh
        every 5s when live mode is on.
      </p>
    </motion.div>
  );
}

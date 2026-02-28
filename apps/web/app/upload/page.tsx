"use client";

import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Upload as UploadIcon, FileText } from "lucide-react";

type UploadStatus = "idle" | "dragging" | "file" | "uploading" | "success" | "error";

interface ImportResult {
  id: string;
  filename: string;
  row_count: number;
  duplicates_skipped: number;
  date_range_start: string | null;
  date_range_end: string | null;
  status: string;
}

const API_BASE = process.env.NEXT_PUBLIC_API_URL || "http://localhost:8080";

function UploadProgress() {
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    const interval = setInterval(() => {
      setProgress((prev) => {
        if (prev >= 90) return prev + 0.5;
        if (prev >= 70) return prev + 1;
        return prev + 3;
      });
    }, 60);
    return () => clearInterval(interval);
  }, []);

  return (
    <div
      style={{
        marginTop: 16,
        height: 3,
        width: "100%",
        borderRadius: "var(--radius-full)",
        background: "var(--surface-raised)",
        overflow: "hidden",
      }}
    >
      <div
        style={{
          height: "100%",
          borderRadius: "var(--radius-full)",
          background: "var(--accent)",
          transition: "width 0.15s ease",
          width: `${Math.min(progress, 95)}%`,
        }}
      />
    </div>
  );
}

function AnimatedCheckmark() {
  return (
    <svg
      width="48"
      height="48"
      viewBox="0 0 48 48"
      fill="none"
      style={{ margin: "0 auto 12px" }}
    >
      <circle
        cx="24"
        cy="24"
        r="20"
        stroke="var(--success)"
        strokeWidth="2"
        fill="var(--income-muted)"
      />
      <path
        d="M15 24L21 30L33 18"
        stroke="var(--success)"
        strokeWidth="2.5"
        strokeLinecap="round"
        strokeLinejoin="round"
        style={{
          strokeDasharray: 30,
          strokeDashoffset: 30,
          animation: "checkmark-draw 0.5s var(--transition-snappy) 0.2s forwards",
        }}
      />
    </svg>
  );
}

export default function UploadPage() {
  const [status, setStatus] = useState<UploadStatus>("idle");
  const [file, setFile] = useState<File | null>(null);
  const [result, setResult] = useState<ImportResult | null>(null);
  const [errorMessage, setErrorMessage] = useState<string>("");
  const queryClient = useQueryClient();

  const handleFile = (f: File) => {
    setFile(f);
    setStatus("file");
    setErrorMessage("");
  };

  const handleDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault();
    const f = e.dataTransfer.files[0];
    if (f) handleFile(f);
  }, []);

  const handleUpload = async () => {
    if (!file) return;
    setStatus("uploading");
    setErrorMessage("");

    try {
      const formData = new FormData();
      formData.append("file", file);

      const res = await fetch(`${API_BASE}/api/v1/imports/upload`, {
        method: "POST",
        body: formData,
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({ detail: "Upload failed" }));
        throw new Error(err.detail || `Server error: ${res.status}`);
      }

      const data: ImportResult = await res.json();
      setResult(data);
      setStatus("success");

      queryClient.invalidateQueries({ queryKey: ["dashboard"] });
      queryClient.invalidateQueries({ queryKey: ["transactions"] });
      queryClient.invalidateQueries({ queryKey: ["subscriptions"] });
    } catch (err) {
      setErrorMessage(err instanceof Error ? err.message : "Upload failed");
      setStatus("error");
    }
  };

  const handleReset = () => {
    setFile(null);
    setResult(null);
    setErrorMessage("");
    setStatus("idle");
  };

  const isUploading = status === "uploading";
  const isDragging = status === "dragging";

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.25, ease: [0.16, 1, 0.3, 1] }}
      style={{ padding: "32px 32px 48px", maxWidth: 640, margin: "0 auto" }}
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
          Upload
        </h1>
        <p style={{ fontSize: 13, color: "var(--foreground-muted)", marginTop: 4 }}>
          Import a bank statement to get started
        </p>
      </div>

      {/* Drop zone */}
      {status !== "success" && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setStatus("dragging");
          }}
          onDragLeave={() => setStatus(file ? "file" : "idle")}
          style={{
            marginBottom: 16,
            padding: "48px 32px",
            textAlign: "center",
            borderRadius: "var(--radius-lg)",
            border: `2px dashed ${isDragging ? "var(--accent)" : "var(--border)"}`,
            background: isDragging
              ? "radial-gradient(ellipse at center, var(--accent-glow) 0%, transparent 70%)"
              : "var(--surface)",
            transition: "all 0.2s ease",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Atmospheric glow behind icon when dragging */}
          {isDragging && (
            <div
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: 200,
                height: 200,
                transform: "translate(-50%, -50%)",
                borderRadius: "50%",
                background: "radial-gradient(circle, var(--accent-muted) 0%, transparent 70%)",
                pointerEvents: "none",
              }}
            />
          )}

          {!file ? (
            <div style={{ position: "relative" }}>
              <div
                style={{
                  marginBottom: 12,
                  display: "flex",
                  justifyContent: "center",
                  transition: "transform 0.2s ease",
                  transform: isDragging ? "scale(1.1)" : "scale(1)",
                }}
              >
                <UploadIcon
                  size={32}
                  style={{ color: isDragging ? "var(--accent)" : "var(--foreground-muted)" }}
                />
              </div>
              <p style={{ fontSize: 15, color: "var(--foreground)", marginBottom: 4 }}>
                Drag your statement here
              </p>
              <p style={{ fontSize: 13, color: "var(--foreground-muted)" }}>
                or{" "}
                <label
                  style={{
                    cursor: "pointer",
                    color: "var(--accent)",
                    textDecoration: "underline",
                  }}
                >
                  browse files
                  <input
                    type="file"
                    accept=".csv"
                    style={{ display: "none" }}
                    onChange={(e) =>
                      e.target.files?.[0] && handleFile(e.target.files[0])
                    }
                  />
                </label>
              </p>
            </div>
          ) : (
            <div className="animate-fade-in-up" style={{ position: "relative" }}>
              {/* File preview */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 12,
                  padding: "10px 16px",
                  borderRadius: "var(--radius)",
                  border: "1px solid var(--border)",
                  background: "var(--surface-raised)",
                  textAlign: "left",
                  marginBottom: 8,
                }}
              >
                <div
                  style={{
                    width: 36,
                    height: 36,
                    borderRadius: "var(--radius-sm)",
                    background: "var(--accent-muted)",
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "center",
                    flexShrink: 0,
                  }}
                >
                  <FileText size={18} style={{ color: "var(--accent)" }} />
                </div>
                <div>
                  <p style={{ fontSize: 13, fontWeight: 500, color: "var(--foreground)" }}>
                    {file.name}
                  </p>
                  <p
                    style={{
                      fontSize: 11,
                      fontFamily: "var(--font-mono)",
                      color: "var(--foreground-muted)",
                    }}
                  >
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              {isUploading ? (
                <UploadProgress />
              ) : (
                <div style={{ marginTop: 12, display: "flex", justifyContent: "center", gap: 8 }}>
                  <Button onClick={handleUpload} disabled={isUploading}>
                    Upload &amp; Process
                  </Button>
                  <Button variant="outline" onClick={handleReset} disabled={isUploading}>
                    Remove
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {/* Error message */}
      {status === "error" && (
        <div
          className="animate-fade-in-up"
          style={{
            marginBottom: 16,
            padding: "10px 14px",
            borderRadius: "var(--radius)",
            border: "1px solid var(--spending)",
            background: "var(--spending-muted)",
            fontSize: 13,
            color: "var(--spending)",
          }}
        >
          {errorMessage || "Upload failed. Please try again."}
        </div>
      )}

      {/* Success state */}
      {status === "success" && result && (
        <div
          className="animate-fade-in-up"
          style={{
            marginBottom: 16,
            padding: "32px",
            borderRadius: "var(--radius-lg)",
            border: "1px solid var(--income)",
            background: "var(--income-muted)",
            textAlign: "center",
          }}
        >
          <AnimatedCheckmark />
          <p style={{ fontSize: 16, fontWeight: 600, color: "var(--income)", marginBottom: 16 }}>
            Upload complete
          </p>
          <div style={{ display: "flex", justifyContent: "center", gap: 32, marginBottom: 20 }}>
            <div style={{ textAlign: "center" }}>
              <p className="mono-lg" style={{ color: "var(--foreground)" }}>
                {result.row_count}
              </p>
              <p className="text-hint">transactions imported</p>
            </div>
            {result.duplicates_skipped > 0 && (
              <div style={{ textAlign: "center" }}>
                <p className="mono-lg" style={{ color: "var(--foreground-muted)" }}>
                  {result.duplicates_skipped}
                </p>
                <p className="text-hint">duplicates skipped</p>
              </div>
            )}
          </div>
          <p className="text-hint" style={{ marginBottom: 20 }}>
            AI categorisation is running in the background. Dashboard will update shortly.
          </p>
          <Button variant="outline" onClick={handleReset}>
            Upload another
          </Button>
        </div>
      )}

      {/* Supported formats */}
      <div
        style={{
          background: "var(--surface)",
          border: "1px solid var(--border)",
          borderRadius: "var(--radius-lg)",
          padding: "var(--space-5)",
        }}
      >
        <div className="label" style={{ marginBottom: 12 }}>
          Supported Formats
        </div>
        <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
          <thead>
            <tr style={{ borderBottom: "1px solid var(--border)" }}>
              <th className="label" style={{ padding: "8px 0", textAlign: "left" }}>Bank</th>
              <th className="label" style={{ padding: "8px 0", textAlign: "left" }}>Format</th>
              <th className="label" style={{ padding: "8px 0", textAlign: "left" }}>Status</th>
            </tr>
          </thead>
          <tbody>
            {[
              { bank: "American Express", format: "CSV" },
              { bank: "HSBC", format: "CSV" },
              { bank: "Monzo", format: "CSV" },
              { bank: "Starling", format: "CSV" },
            ].map((row) => (
              <tr key={row.bank} style={{ borderBottom: "1px solid var(--border)" }}>
                <td style={{ padding: "8px 0", color: "var(--foreground)" }}>{row.bank}</td>
                <td style={{ padding: "8px 0" }}>
                  <Badge variant="muted">{row.format}</Badge>
                </td>
                <td style={{ padding: "8px 0" }}>
                  <Badge variant="success">Supported</Badge>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
        <p className="text-hint" style={{ marginTop: 12 }}>
          Using a different bank?{" "}
          <a
            href="https://github.com/L3monJuic3/vault"
            target="_blank"
            rel="noreferrer"
            style={{ color: "var(--accent)", textDecoration: "none" }}
            onMouseEnter={(e) => { e.currentTarget.style.textDecoration = "underline"; }}
            onMouseLeave={(e) => { e.currentTarget.style.textDecoration = "none"; }}
          >
            Contribute a parser on GitHub
          </a>
        </p>
      </div>
    </motion.div>
  );
}

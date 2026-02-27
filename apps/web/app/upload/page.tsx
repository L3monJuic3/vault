"use client";

import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

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
        width: "100%",
        height: "4px",
        background: "var(--border)",
        borderRadius: "2px",
        overflow: "hidden",
        marginTop: "16px",
      }}
    >
      <div
        style={{
          height: "100%",
          width: `${Math.min(progress, 95)}%`,
          background: "var(--primary)",
          borderRadius: "2px",
          transition: "width 0.15s var(--transition-snappy)",
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
        fill="rgba(16,185,129,0.08)"
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
    <div className="animate-fade-in-up" style={{ padding: "28px 32px", maxWidth: "800px", margin: "0 auto" }}>
      <div style={{ marginBottom: "28px" }}>
        <h1 style={{ fontSize: "20px", fontWeight: 600, color: "var(--foreground)", letterSpacing: "-0.02em" }}>
          Upload
        </h1>
        <p style={{ fontSize: "13px", color: "var(--foreground-muted)", marginTop: "2px" }}>
          Import a bank statement to get started
        </p>
      </div>

      {status !== "success" && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => { e.preventDefault(); setStatus("dragging"); }}
          onDragLeave={() => setStatus(file ? "file" : "idle")}
          style={{
            border: `2px dashed ${isDragging ? "var(--primary)" : "var(--border)"}`,
            borderRadius: "var(--radius-lg)",
            background: isDragging ? "rgba(99,102,241,0.05)" : "var(--surface)",
            boxShadow: isDragging ? "0 0 20px var(--glow-primary)" : "none",
            padding: "48px 32px",
            textAlign: "center",
            transition: "all 0.25s var(--transition-snappy)",
            marginBottom: "16px",
          }}
        >
          {!file ? (
            <>
              <div
                style={{
                  fontSize: "32px",
                  marginBottom: "12px",
                  transition: "transform 0.2s var(--transition-snappy)",
                  transform: isDragging ? "translateY(-4px) scale(1.1)" : "none",
                }}
              >
                ↑
              </div>
              <p style={{ color: "var(--foreground)", fontSize: "15px", marginBottom: "6px" }}>
                Drag your statement here
              </p>
              <p style={{ color: "var(--foreground-muted)", fontSize: "13px" }}>
                or{" "}
                <label style={{ color: "var(--primary)", cursor: "pointer", textDecoration: "underline" }}>
                  browse files
                  <input
                    type="file"
                    accept=".csv"
                    style={{ display: "none" }}
                    onChange={(e) => e.target.files?.[0] && handleFile(e.target.files[0])}
                  />
                </label>
              </p>
            </>
          ) : (
            <div className="animate-fade-in-up">
              {/* File preview card */}
              <div
                style={{
                  display: "inline-flex",
                  alignItems: "center",
                  gap: "12px",
                  background: "var(--surface-raised)",
                  border: "1px solid var(--border)",
                  borderRadius: "var(--radius)",
                  padding: "12px 16px",
                  marginBottom: "16px",
                  textAlign: "left",
                }}
              >
                <div style={{
                  width: "36px",
                  height: "36px",
                  background: "rgba(99,102,241,0.1)",
                  borderRadius: "var(--radius-sm)",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  fontSize: "18px",
                  flexShrink: 0,
                }}>
                  📄
                </div>
                <div>
                  <p style={{ color: "var(--foreground)", fontSize: "14px", fontWeight: 500 }}>
                    {file.name}
                  </p>
                  <p style={{ color: "var(--foreground-muted)", fontSize: "12px", fontFamily: "var(--font-mono)" }}>
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              {isUploading ? (
                <UploadProgress />
              ) : (
                <div style={{ display: "flex", gap: "8px", justifyContent: "center", marginTop: "8px" }}>
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

      {status === "error" && (
        <div
          className="animate-fade-in-up"
          style={{
            background: "var(--glow-error)",
            border: "1px solid rgba(239,68,68,0.3)",
            borderRadius: "var(--radius)",
            padding: "12px 16px",
            marginBottom: "16px",
            fontSize: "13px",
            color: "var(--spending)",
          }}
        >
          {errorMessage || "Upload failed. Please try again."}
        </div>
      )}

      {status === "success" && result && (
        <div
          className="animate-fade-in-up"
          style={{
            background: "rgba(16,185,129,0.06)",
            border: "1px solid rgba(16,185,129,0.2)",
            borderRadius: "var(--radius-lg)",
            padding: "32px 24px",
            marginBottom: "16px",
            textAlign: "center",
          }}
        >
          <AnimatedCheckmark />
          <p style={{ color: "var(--income)", fontSize: "16px", fontWeight: 600, marginBottom: "12px" }}>
            Upload complete
          </p>
          <div style={{ display: "flex", gap: "24px", justifyContent: "center", marginBottom: "20px" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "24px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>
                {result.row_count}
              </p>
              <p style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>transactions imported</p>
            </div>
            {result.duplicates_skipped > 0 && (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "24px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--foreground-muted)" }}>
                  {result.duplicates_skipped}
                </p>
                <p style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>duplicates skipped</p>
              </div>
            )}
          </div>
          <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginBottom: "20px" }}>
            AI categorisation is running in the background. Dashboard will update shortly.
          </p>
          <Button variant="outline" onClick={handleReset}>
            Upload another
          </Button>
        </div>
      )}

      <Card className="animate-fade-in-up stagger-2">
        <CardHeader>
          <CardTitle style={{ fontSize: "13px" }}>Supported formats</CardTitle>
        </CardHeader>
        <CardContent>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: "13px" }}>
            <thead>
              <tr style={{ borderBottom: "1px solid var(--border)" }}>
                <th style={{ textAlign: "left", padding: "6px 0", color: "var(--foreground-muted)", fontWeight: 500 }}>Bank</th>
                <th style={{ textAlign: "left", padding: "6px 0", color: "var(--foreground-muted)", fontWeight: 500 }}>Format</th>
                <th style={{ textAlign: "left", padding: "6px 0", color: "var(--foreground-muted)", fontWeight: 500 }}>Status</th>
              </tr>
            </thead>
            <tbody>
              {[
                { bank: "American Express", format: "CSV", status: "✓ Supported" },
                { bank: "HSBC", format: "CSV", status: "✓ Supported" },
                { bank: "Monzo", format: "CSV", status: "✓ Supported" },
                { bank: "Starling", format: "CSV", status: "✓ Supported" },
              ].map((row) => (
                <tr key={row.bank} style={{ borderBottom: "1px solid var(--border)" }}>
                  <td style={{ padding: "8px 0", color: "var(--foreground)" }}>{row.bank}</td>
                  <td style={{ padding: "8px 0" }}>
                    <span style={{ fontFamily: "var(--font-mono)", fontSize: "12px", background: "var(--surface-raised)", padding: "2px 6px", borderRadius: "3px", color: "var(--foreground-muted)" }}>
                      {row.format}
                    </span>
                  </td>
                  <td style={{ padding: "8px 0", color: row.status.startsWith("✓") ? "var(--income)" : "var(--foreground-subtle)", fontSize: "12px" }}>
                    {row.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p style={{ fontSize: "12px", color: "var(--foreground-muted)", marginTop: "12px" }}>
            Using a different bank?{" "}
            <a href="https://github.com/L3monJuic3/vault" target="_blank" rel="noreferrer" style={{ color: "var(--primary)" }}>
              Contribute a parser on GitHub →
            </a>
          </p>
        </CardContent>
      </Card>
    </div>
  );
}

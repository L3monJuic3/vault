"use client";

import { useState, useCallback } from "react";
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

  return (
    <div style={{ padding: "28px 32px", maxWidth: "800px", margin: "0 auto" }}>
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
            border: `2px dashed ${status === "dragging" ? "var(--primary)" : "var(--border)"}`,
            borderRadius: "var(--radius)",
            background: status === "dragging" ? "rgba(99,102,241,0.05)" : "var(--surface)",
            padding: "48px 32px",
            textAlign: "center",
            transition: "all 0.15s",
            marginBottom: "16px",
          }}
        >
          {!file ? (
            <>
              <div style={{ fontSize: "32px", marginBottom: "12px" }}>↑</div>
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
            <>
              <div style={{ fontSize: "28px", marginBottom: "12px" }}>📄</div>
              <p style={{ color: "var(--foreground)", fontSize: "15px", fontWeight: 500, marginBottom: "4px" }}>
                {file.name}
              </p>
              <p style={{ color: "var(--foreground-muted)", fontSize: "12px", fontFamily: "var(--font-mono)", marginBottom: "20px" }}>
                {(file.size / 1024).toFixed(1)} KB
              </p>
              <div style={{ display: "flex", gap: "8px", justifyContent: "center" }}>
                <Button onClick={handleUpload} disabled={isUploading}>
                  {isUploading ? "Uploading…" : "Upload & Process"}
                </Button>
                <Button variant="outline" onClick={handleReset} disabled={isUploading}>
                  Remove
                </Button>
              </div>
            </>
          )}
        </div>
      )}

      {status === "error" && (
        <div style={{
          background: "rgba(239,68,68,0.1)",
          border: "1px solid rgba(239,68,68,0.3)",
          borderRadius: "var(--radius)",
          padding: "12px 16px",
          marginBottom: "16px",
          fontSize: "13px",
          color: "var(--spending)",
        }}>
          {errorMessage || "Upload failed. Please try again."}
        </div>
      )}

      {status === "success" && result && (
        <div style={{
          background: "rgba(16,185,129,0.08)",
          border: "1px solid rgba(16,185,129,0.3)",
          borderRadius: "var(--radius)",
          padding: "24px",
          marginBottom: "16px",
          textAlign: "center",
        }}>
          <div style={{ fontSize: "32px", marginBottom: "12px" }}>✓</div>
          <p style={{ color: "var(--income)", fontSize: "16px", fontWeight: 600, marginBottom: "8px" }}>
            Upload complete
          </p>
          <div style={{ display: "flex", gap: "24px", justifyContent: "center", marginBottom: "20px" }}>
            <div style={{ textAlign: "center" }}>
              <p style={{ fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--foreground)" }}>
                {result.row_count}
              </p>
              <p style={{ fontSize: "12px", color: "var(--foreground-muted)" }}>transactions imported</p>
            </div>
            {result.duplicates_skipped > 0 && (
              <div style={{ textAlign: "center" }}>
                <p style={{ fontSize: "22px", fontWeight: 700, fontFamily: "var(--font-mono)", color: "var(--foreground-muted)" }}>
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

      <Card>
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
                { bank: "Monzo", format: "CSV", status: "Coming soon" },
                { bank: "Starling", format: "CSV", status: "Coming soon" },
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

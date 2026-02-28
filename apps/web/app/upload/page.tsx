"use client";

import { useState, useCallback, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Card, CardContent, CardHeader, CardTitle, PageWrapper, PageHeader } from "@/components/ui";
import { Button } from "@/components/ui/button";
import { Upload as UploadIcon, FileText } from "lucide-react";
import { cn } from "@/lib/utils";

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
    <div className="mt-4 h-1 w-full overflow-hidden rounded-full bg-[var(--border)]">
      <div
        className="h-full rounded-full bg-[var(--primary)] transition-all duration-150"
        style={{ width: `${Math.min(progress, 95)}%` }}
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
      className="mx-auto mb-3"
    >
      <circle
        cx="24"
        cy="24"
        r="20"
        stroke="var(--success)"
        strokeWidth="2"
        fill="var(--success-light)"
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
    <PageWrapper maxWidth="md" className="animate-fade-in-up">
      <PageHeader
        title="Upload"
        subtitle="Import a bank statement to get started"
      />

      {status !== "success" && (
        <div
          onDrop={handleDrop}
          onDragOver={(e) => {
            e.preventDefault();
            setStatus("dragging");
          }}
          onDragLeave={() => setStatus(file ? "file" : "idle")}
          className={cn(
            "mb-4 rounded-[var(--radius-lg)] border-2 border-dashed p-12 text-center transition-all duration-200",
            isDragging
              ? "border-[var(--primary)] bg-[var(--primary-lighter)]"
              : "border-[var(--border)] bg-[var(--surface)]",
          )}
        >
          {!file ? (
            <>
              <div
                className={cn(
                  "mb-3 flex justify-center transition-transform duration-200",
                  isDragging && "scale-110",
                )}
              >
                <UploadIcon
                  size={32}
                  className="text-[var(--foreground-muted)]"
                />
              </div>
              <p className="mb-1 text-[15px] text-[var(--foreground)]">
                Drag your statement here
              </p>
              <p className="text-[13px] text-[var(--foreground-muted)]">
                or{" "}
                <label className="cursor-pointer text-[var(--primary)] underline">
                  browse files
                  <input
                    type="file"
                    accept=".csv"
                    className="hidden"
                    onChange={(e) =>
                      e.target.files?.[0] && handleFile(e.target.files[0])
                    }
                  />
                </label>
              </p>
            </>
          ) : (
            <div className="animate-fade-in-up">
              {/* File preview card */}
              <div className="mb-4 inline-flex items-center gap-3 rounded-[var(--radius)] border border-[var(--border)] bg-[var(--surface-raised)] px-4 py-3 text-left">
                <div className="flex h-9 w-9 flex-shrink-0 items-center justify-center rounded-[var(--radius-sm)] bg-[var(--primary-light)]">
                  <FileText size={18} className="text-[var(--primary)]" />
                </div>
                <div>
                  <p className="text-sm font-medium text-[var(--foreground)]">
                    {file.name}
                  </p>
                  <p className="font-mono text-xs text-[var(--foreground-muted)]">
                    {(file.size / 1024).toFixed(1)} KB
                  </p>
                </div>
              </div>

              {isUploading ? (
                <UploadProgress />
              ) : (
                <div className="mt-2 flex justify-center gap-2">
                  <Button onClick={handleUpload} disabled={isUploading}>
                    Upload &amp; Process
                  </Button>
                  <Button
                    variant="outline"
                    onClick={handleReset}
                    disabled={isUploading}
                  >
                    Remove
                  </Button>
                </div>
              )}
            </div>
          )}
        </div>
      )}

      {status === "error" && (
        <div className="animate-fade-in-up mb-4 rounded-[var(--radius)] border border-[var(--destructive)]/30 bg-[var(--destructive-light)] px-4 py-3 text-[13px] text-[var(--destructive)]">
          {errorMessage || "Upload failed. Please try again."}
        </div>
      )}

      {status === "success" && result && (
        <div className="animate-fade-in-up mb-4 rounded-[var(--radius-lg)] border border-[var(--success)]/20 bg-[var(--success-light)] p-8 text-center">
          <AnimatedCheckmark />
          <p className="mb-3 text-base font-semibold text-[var(--success)]">
            Upload complete
          </p>
          <div className="mb-5 flex justify-center gap-6">
            <div className="text-center">
              <p className="text-2xl font-bold font-mono text-[var(--foreground)]">
                {result.row_count}
              </p>
              <p className="text-hint">transactions imported</p>
            </div>
            {result.duplicates_skipped > 0 && (
              <div className="text-center">
                <p className="text-2xl font-bold font-mono text-[var(--foreground-muted)]">
                  {result.duplicates_skipped}
                </p>
                <p className="text-hint">duplicates skipped</p>
              </div>
            )}
          </div>
          <p className="text-hint mb-5">
            AI categorisation is running in the background. Dashboard will
            update shortly.
          </p>
          <Button variant="outline" onClick={handleReset}>
            Upload another
          </Button>
        </div>
      )}

      <Card className="animate-fade-in-up stagger-2">
        <CardHeader>
          <CardTitle>Supported formats</CardTitle>
        </CardHeader>
        <CardContent>
          <table className="w-full text-[13px]">
            <thead>
              <tr className="border-b border-[var(--border)]">
                <th className="py-2 text-left text-xs font-medium text-[var(--foreground-muted)]">
                  Bank
                </th>
                <th className="py-2 text-left text-xs font-medium text-[var(--foreground-muted)]">
                  Format
                </th>
                <th className="py-2 text-left text-xs font-medium text-[var(--foreground-muted)]">
                  Status
                </th>
              </tr>
            </thead>
            <tbody>
              {[
                { bank: "American Express", format: "CSV", status: "Supported" },
                { bank: "HSBC", format: "CSV", status: "Supported" },
                { bank: "Monzo", format: "CSV", status: "Supported" },
                { bank: "Starling", format: "CSV", status: "Supported" },
              ].map((row) => (
                <tr
                  key={row.bank}
                  className="border-b border-[var(--border)]"
                >
                  <td className="py-2 text-sm text-[var(--foreground)]">
                    {row.bank}
                  </td>
                  <td className="py-2">
                    <span className="rounded-[var(--radius-sm)] bg-[var(--surface-raised)] px-1.5 py-0.5 font-mono text-xs text-[var(--foreground-muted)]">
                      {row.format}
                    </span>
                  </td>
                  <td className="py-2 text-xs text-[var(--success)]">
                    {row.status}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="mt-3 text-hint">
            Using a different bank?{" "}
            <a
              href="https://github.com/L3monJuic3/vault"
              target="_blank"
              rel="noreferrer"
              className="text-[var(--primary)] hover:underline"
            >
              Contribute a parser on GitHub
            </a>
          </p>
        </CardContent>
      </Card>
    </PageWrapper>
  );
}

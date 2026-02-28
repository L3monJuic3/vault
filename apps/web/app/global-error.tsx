"use client";

export default function GlobalError({
  error,
  reset,
}: {
  error: Error & { digest?: string };
  reset: () => void;
}) {
  return (
    <html>
      <body style={{ padding: 40, fontFamily: "monospace", background: "#111", color: "#eee" }}>
        <h1 style={{ color: "#f87171" }}>Application Error</h1>
        <pre style={{ whiteSpace: "pre-wrap", background: "#1e1e1e", padding: 16, borderRadius: 8 }}>
          {error.message}
        </pre>
        <pre style={{ whiteSpace: "pre-wrap", fontSize: 12, color: "#888", marginTop: 8 }}>
          {error.stack}
        </pre>
        {error.digest && <p style={{ color: "#888" }}>Digest: {error.digest}</p>}
        <button
          onClick={reset}
          style={{ marginTop: 16, padding: "8px 16px", background: "#6366f1", color: "#fff", border: "none", borderRadius: 6, cursor: "pointer" }}
        >
          Try again
        </button>
      </body>
    </html>
  );
}

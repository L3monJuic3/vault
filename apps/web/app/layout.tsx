import type { Metadata } from "next";
import "./globals.css";
import { Providers } from "./providers";
import { Sidebar } from "@/components/layout/Sidebar";

export const metadata: Metadata = {
  title: "Vault — Personal Finance",
  description: "Open-source personal finance intelligence platform",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        <Providers>
          <div
            style={{
              display: "flex",
              minHeight: "100vh",
              background: "var(--background)",
            }}
          >
            <Sidebar />
            <main
              style={{
                flex: 1,
                minWidth: 0,
                overflowX: "hidden",
              }}
            >
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}

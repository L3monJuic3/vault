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
    <html lang="en" suppressHydrationWarning>
      <head>
        <script
          dangerouslySetInnerHTML={{
            __html: `(function(){try{var s=JSON.parse(localStorage.getItem('vault-theme')||'{}');var m=(s.state||{}).mode||'system';var t=m;if(m==='system'){t=window.matchMedia('(prefers-color-scheme:dark)').matches?'dark':'light'}document.documentElement.setAttribute('data-theme',t);document.documentElement.style.colorScheme=t;var a=(s.state||{}).accent;if(a){document.documentElement.style.setProperty('--primary',a)}}catch(e){document.documentElement.setAttribute('data-theme','dark')}})();`,
          }}
        />
      </head>
      <body>
        <Providers>
          <div className="flex min-h-screen bg-[var(--background)]">
            <Sidebar />
            <main className="min-w-0 flex-1 overflow-x-hidden">
              {children}
            </main>
          </div>
        </Providers>
      </body>
    </html>
  );
}

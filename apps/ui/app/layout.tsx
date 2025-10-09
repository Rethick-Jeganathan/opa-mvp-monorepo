export const metadata = {
  title: 'PolicyPulse',
  description: 'PolicyPulse — Unified policy observability & evaluation',
};

import './globals.css';
import React from 'react';

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-white/10 sticky top-0 backdrop-blur bg-black/30 z-50">
          <div className="container py-4 flex items-center justify-between">
            <div className="flex items-center gap-3">
              <img
                src="/policypulse-logo.svg"
                alt="PolicyPulse"
                className="w-8 h-8 rounded"
                width={32}
                height={32}
              />
              <h1 className="text-lg font-semibold">PolicyPulse</h1>
            </div>
            <nav className="text-sm flex gap-4">
              <a className="text-cyan-300 hover:underline" href="/">Overview</a>
              <a className="text-cyan-300 hover:underline" href="/k8s">Kubernetes</a>
              <a className="text-cyan-300 hover:underline" href="/mcp">MCP</a>
              <a className="text-cyan-300 hover:underline" href="/external">External</a>
              <a className="text-cyan-300 hover:underline" href="/decisions">Decisions</a>
              <a className="text-cyan-300 hover:underline" href="/terraform">Terraform</a>
              <a className="text-cyan-300 hover:underline" href="https://github.com/Rethick-Jeganathan/opa-mvp-monorepo/tree/main/docs" target="_blank" rel="noreferrer">Docs</a>
              <a className="text-cyan-300 hover:underline" href="https://github.com/Rethick-Jeganathan/opa-mvp-monorepo/actions" target="_blank" rel="noreferrer">CI</a>
            </nav>
          </div>
        </header>
        <main className="container py-8 space-y-6">
          {children}
        </main>
        <footer className="container py-8 text-xs text-white/50">
          Built for Week 1 — MCP, Gatekeeper, Terraform policy bundles
        </footer>
      </body>
    </html>
  );
}

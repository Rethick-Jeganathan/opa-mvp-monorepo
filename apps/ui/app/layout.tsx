export const metadata = {
  title: 'OPA MVP Dashboard',
  description: 'Week 1 dashboard for MCP, Gatekeeper, and CI visibility',
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
              <div className="w-8 h-8 rounded bg-cyan-400/20 border border-cyan-400/40" />
              <h1 className="text-lg font-semibold">OPA MVP Dashboard</h1>
            </div>
            <nav className="text-sm flex gap-4">
              <a className="text-cyan-300 hover:underline" href="/">Overview</a>
              <a className="text-cyan-300 hover:underline" href="/k8s">Kubernetes</a>
              <a className="text-cyan-300 hover:underline" href="/mcp">MCP</a>
              <a className="text-cyan-300 hover:underline" href="/external">External</a>
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

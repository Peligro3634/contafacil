import type { ReactNode } from 'react'
import { BottomNav } from './BottomNav'

export function AppShell({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="flex min-h-screen flex-col">
      <header className="flex items-center gap-3 border-b border-slate-200 bg-white px-4 py-3">
        <img src="/brand/icon-mark.svg" alt="ContaFácil" className="h-8 w-8" />
        <h1 className="font-heading text-xl font-semibold text-brand-navy">{title}</h1>
      </header>

      <main className="flex-1 px-4 py-4 pb-24">{children}</main>

      <BottomNav />
    </div>
  )
}

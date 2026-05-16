import { AppShell } from '@/components/AppShell'
import type { Metadata } from 'next'
import { Settings } from 'lucide-react'

export const metadata: Metadata = {
  title: 'Settings — Mayaz OS',
}

export default function SettingsPage() {
  return (
    <AppShell>
      <div className="flex flex-col w-full">
        <div className="page-header px-6 py-6 md:px-10 md:py-10">
          <div className="w-8 h-8 rounded-lg bg-[var(--em-50)] border border-[var(--border-accent)] flex items-center justify-center">
            <Settings size={15} className="text-[var(--em-600)]" strokeWidth={1.75} />
          </div>
          <div className="flex-1">
            <h1 className="text-2xl md:text-3xl font-bold tracking-tight text-[var(--text-primary)]">Settings</h1>
            <p className="text-sm font-medium text-[var(--text-muted)] mt-1">Preferences & Account</p>
          </div>
        </div>

        <div className="flex-1 px-6 md:px-10 pb-24 overflow-y-auto w-full">
          <div className="max-w-2xl mx-auto space-y-6 mt-6">
            <div className="card shadow-[0_8px_32px_rgba(0,0,0,0.06)]">
              <h2 className="text-base font-semibold text-[var(--text-primary)] mb-4">Under Construction</h2>
              <p className="text-sm text-[var(--text-secondary)]">
                The settings panel is currently being developed. You will soon be able to manage your profile, theme preferences, and API integrations here.
              </p>
            </div>
          </div>
        </div>
      </div>
    </AppShell>
  )
}

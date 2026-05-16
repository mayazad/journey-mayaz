import { getAccountMetadata } from '@/actions/vault'
import { AppShell } from '@/components/AppShell'
import { AddVaultEntryForm } from './AddVaultEntryForm'
import { VaultTable } from './VaultTable'
import { Lock } from 'lucide-react'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Vault — Mayaz OS',
  description: 'Your private account metadata tracker.',
}

export default async function VaultPage() {
  const entries = await getAccountMetadata()

  return (
    <AppShell>
      <div style={{ minHeight: '100vh', backgroundColor: '#f0f0f0' }}>

        {/* Page Title */}
        <div style={{ padding: '24px 20px 16px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Vault
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
            Account metadata — AI never has access
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '0 16px 120px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* Privacy Notice */}
          <div style={{
            display: 'flex', alignItems: 'flex-start', gap: '12px',
            padding: '14px 16px',
            background: '#ffffff',
            borderRadius: '16px',
            border: '1px solid var(--em-200)',
            boxShadow: '0 2px 8px rgba(16,185,129,0.06)',
          }}>
            <div style={{
              width: '32px', height: '32px', borderRadius: '10px',
              background: 'var(--em-50)', border: '1px solid var(--em-200)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              flexShrink: 0,
            }}>
              <Lock size={14} color="var(--em-600)" />
            </div>
            <div>
              <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--em-700)', marginBottom: '2px' }}>
                Metadata only — no passwords
              </p>
              <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5 }}>
                Track which email you used where. Never store passwords here.
              </p>
            </div>
          </div>

          {/* New Entry Form */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px', padding: '0 4px' }}>
              New Entry
            </p>
            <div style={{ background: '#ffffff', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)' }}>
              <AddVaultEntryForm />
            </div>
          </div>

          {/* Entries */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px', padding: '0 4px' }}>
              Your Entries ({entries.length})
            </p>
            <VaultTable entries={entries} />
          </div>

        </div>
      </div>
    </AppShell>
  )
}

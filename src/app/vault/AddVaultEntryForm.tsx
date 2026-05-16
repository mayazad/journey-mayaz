'use client'

import { useActionState } from 'react'
import { addAccountMetadata, type VaultState } from '@/actions/vault'
import { SubmitButton } from '@/components/SubmitButton'
import { Combobox } from '@/components/Combobox'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

const AUTH_SUGGESTIONS = [
  'Standalone', 'Google OAuth', 'GitHub OAuth',
  'Magic Link', 'Apple ID', 'Microsoft SSO', 'Other',
]

const initialState: VaultState = {}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px', fontWeight: 700,
  letterSpacing: '0.07em', textTransform: 'uppercase',
  color: 'var(--text-muted)', marginBottom: '6px',
}

export function AddVaultEntryForm() {
  const [state, formAction] = useActionState(addAccountMetadata, initialState)

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Service Name */}
      <div>
        <label htmlFor="service_name" style={labelStyle}>Service Name</label>
        <input
          id="service_name"
          name="service_name"
          type="text"
          required
          placeholder="e.g. Vercel, Supabase, GitHub"
          className="field-input"
        />
      </div>

      {/* Email Used */}
      <div>
        <label htmlFor="email_used" style={labelStyle}>Email Used</label>
        <input
          id="email_used"
          name="email_used"
          type="email"
          required
          placeholder="e.g. hello@example.com"
          className="field-input"
        />
      </div>

      {/* Auth Method */}
      <div>
        <label htmlFor="auth_method" style={labelStyle}>Auth Method</label>
        <Combobox
          id="auth_method"
          name="auth_method"
          suggestions={AUTH_SUGGESTIONS}
          placeholder="Standalone, Google OAuth..."
          defaultValue="Standalone"
          required
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" style={labelStyle}>
          Notes <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={2}
          placeholder="Any additional context..."
          className="field-input"
          style={{ resize: 'none' }}
        />
      </div>

      {state?.error && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', background: '#fef2f2', fontSize: '13px', color: '#dc2626' }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} /> {state.error}
        </div>
      )}
      {state?.success && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', background: 'var(--em-50)', fontSize: '13px', color: 'var(--em-700)' }}>
          <CheckCircle2 size={14} style={{ flexShrink: 0 }} /> Entry saved.
        </div>
      )}

      <SubmitButton label="Add Entry" pendingLabel="Saving..." />
    </form>
  )
}

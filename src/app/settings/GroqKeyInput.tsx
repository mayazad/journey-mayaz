'use client'

import { useState, useTransition } from 'react'
import { saveGroqApiKey } from '@/actions/admin'
import { Eye, EyeOff, Check, Key, ExternalLink, X } from 'lucide-react'

interface Props {
  currentKey: string | null
}

export function GroqKeyInput({ currentKey }: Props) {
  const [key, setKey]         = useState('')
  const [showKey, setShowKey] = useState(false)
  const [saved, setSaved]     = useState(false)
  const [err, setErr]         = useState('')
  const [isPending, start]    = useTransition()

  const hasKey = !!currentKey
  const maskedKey = currentKey ? `${currentKey.slice(0, 8)}${'•'.repeat(20)}` : ''

  function handleSave() {
    setErr('')
    setSaved(false)
    start(async () => {
      const result = await saveGroqApiKey(key)
      if ('error' in result && typeof result.error === 'string') {
        setErr(result.error)
        return
      }
      setSaved(true)
      setKey('')
      setTimeout(() => setSaved(false), 3000)
    })
  }

  function handleClear() {
    start(async () => {
      await saveGroqApiKey('')
      setSaved(false)
      setKey('')
    })
  }

  return (
    <div style={{ padding: '16px 18px' }}>
      {/* Status row */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
          <Key size={15} color={hasKey ? 'var(--em-600)' : 'var(--text-muted)'} />
          <span style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
            Your Groq API Key
          </span>
        </div>
        <span style={{
          fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px',
          background: hasKey ? 'var(--em-50)' : '#fffbeb',
          color: hasKey ? 'var(--em-700)' : '#b45309',
          border: `1px solid ${hasKey ? 'var(--em-200)' : '#fde68a'}`,
        }}>
          {hasKey ? '✓ Connected' : '⚠ Not set'}
        </span>
      </div>

      {/* Existing key preview */}
      {hasKey && (
        <div style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          background: 'var(--bg-surface2)', borderRadius: '10px', padding: '10px 14px',
          marginBottom: '14px', border: '1px solid var(--border)',
        }}>
          <span style={{ fontSize: '13px', fontFamily: 'monospace', color: 'var(--text-tertiary)' }}>
            {maskedKey}
          </span>
          <button
            onClick={handleClear} disabled={isPending}
            style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#dc2626', padding: '2px' }}
            title="Remove key"
          >
            <X size={14} />
          </button>
        </div>
      )}

      {/* New key input */}
      <div style={{ position: 'relative', marginBottom: '10px' }}>
        <input
          type={showKey ? 'text' : 'password'}
          value={key}
          onChange={e => setKey(e.target.value)}
          placeholder={hasKey ? 'Enter a new key to replace…' : 'gsk_…'}
          style={{
            width: '100%', padding: '10px 42px 10px 14px',
            borderRadius: '10px', border: '1px solid var(--border)',
            background: 'var(--bg-surface)', color: 'var(--text-primary)',
            fontSize: '14px', fontFamily: 'monospace', outline: 'none',
            boxSizing: 'border-box',
          }}
          onFocus={e => { e.target.style.borderColor = 'var(--em-400)' }}
          onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
        />
        <button
          type="button" onClick={() => setShowKey(v => !v)} tabIndex={-1}
          style={{ position: 'absolute', right: '12px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
        >
          {showKey ? <EyeOff size={15} /> : <Eye size={15} />}
        </button>
      </div>

      {/* Error */}
      {err && (
        <p style={{ fontSize: '12px', color: '#dc2626', marginBottom: '10px', padding: '8px 12px', background: '#fef2f2', borderRadius: '8px', border: '1px solid #fecaca' }}>
          {err}
        </p>
      )}

      {/* Actions */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
        <button
          onClick={handleSave}
          disabled={isPending || !key.trim()}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '9px 18px', borderRadius: '9px', border: 'none',
            background: !key.trim() ? 'var(--bg-surface2)' : 'var(--em-500)',
            color: !key.trim() ? 'var(--text-muted)' : '#fff',
            fontSize: '13px', fontWeight: 700, cursor: key.trim() ? 'pointer' : 'default',
            transition: 'all 0.15s',
          }}
        >
          {saved ? <><Check size={13} /> Saved!</> : isPending ? 'Saving…' : 'Save Key'}
        </button>
        <a
          href="https://console.groq.com/keys"
          target="_blank" rel="noopener noreferrer"
          style={{ fontSize: '12px', color: 'var(--em-600)', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '4px', fontWeight: 600 }}
        >
          Get a free key <ExternalLink size={11} />
        </a>
      </div>

      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px', lineHeight: 1.6 }}>
        Your key is stored securely and only used for your AI requests. Free Groq tier gives 14,400 requests/day.
      </p>
    </div>
  )
}

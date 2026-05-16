'use client'

import { useState, useTransition } from 'react'
import { Sparkles, Loader2, CheckCircle2, AlertCircle } from 'lucide-react'

type AIResult = { success: true; summary: string } | { error: string } | null

interface AIInputBoxProps {
  action: (text: string) => Promise<AIResult>
  placeholder: string
  label: string
}

export function AIInputBox({ action, placeholder, label }: AIInputBoxProps) {
  const [text, setText] = useState('')
  const [result, setResult] = useState<AIResult>(null)
  const [isPending, startTransition] = useTransition()

  function handleSubmit() {
    if (!text.trim()) return
    setResult(null)
    startTransition(async () => {
      const res = await action(text)
      setResult(res)
      if (res && 'success' in res && res.success) setText('')
    })
  }

  const hasText = text.trim().length > 0

  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '20px',
        overflow: 'hidden',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
      }}
    >
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 18px 0' }}>
        <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'var(--em-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Sparkles size={10} color="#fff" />
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--em-600)' }}>
          {label}
        </span>
      </div>

      {/* Full-width textarea */}
      <textarea
        rows={3}
        value={text}
        onChange={(e) => setText(e.target.value)}
        placeholder={placeholder}
        style={{
          display: 'block',
          width: '100%',
          resize: 'none',
          padding: '12px 18px',
          border: 'none',
          borderTop: '0',
          fontSize: '13px',
          lineHeight: 1.6,
          color: 'var(--text-primary)',
          background: 'transparent',
          outline: 'none',
          fontFamily: 'inherit',
          boxSizing: 'border-box',
        }}
        onKeyDown={(e) => {
          if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
            e.preventDefault()
            handleSubmit()
          }
        }}
      />

      {/* Bottom action bar */}
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'flex-end',
        padding: '10px 18px',
        borderTop: '1px solid var(--border)',
        background: hasText ? 'var(--em-50)' : '#fafafa',
        transition: 'background 0.2s',
      }}>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={isPending || !hasText}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '6px',
            padding: '7px 14px',
            borderRadius: '10px',
            background: hasText ? 'var(--em-500)' : 'transparent',
            border: hasText ? 'none' : '1px solid var(--border)',
            color: hasText ? '#fff' : 'var(--text-muted)',
            fontSize: '12px',
            fontWeight: 600,
            cursor: hasText ? 'pointer' : 'default',
            transition: 'all 0.2s',
          }}
        >
          {isPending
            ? <><Loader2 size={12} className="animate-spin" /> Saving...</>
            : <><Sparkles size={12} /> Save</>
          }
        </button>
      </div>

      {/* Result feedback */}
      {result && 'error' in result && (
        <div style={{ margin: '0 18px 14px', display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '10px 12px', borderRadius: '10px', background: '#fef2f2', fontSize: '13px', color: '#dc2626' }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
          {result.error}
        </div>
      )}
      {result && 'success' in result && (
        <div style={{ margin: '0 18px 14px', display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '10px 12px', borderRadius: '10px', background: 'var(--em-50)', fontSize: '13px', color: 'var(--em-700)' }}>
          <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: '1px' }} />
          {result.summary}
        </div>
      )}
    </div>
  )
}

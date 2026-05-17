'use client'

import { useState, useTransition } from 'react'
import { Sparkles, Loader2, CheckCircle2, AlertCircle, ArrowLeft } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type AIResult = { success: true; summary: string } | { error: string } | null
type Preview = Record<string, string | string[] | null>
type PreviewResult = { preview: Preview } | { error: string } | null

interface AIInputBoxProps {
  action: (text: string) => Promise<AIResult>
  previewAction?: (text: string) => Promise<PreviewResult>
  placeholder: string
  label: string
}

export function AIInputBox({ action, previewAction, placeholder, label }: AIInputBoxProps) {
  const [text, setText] = useState('')
  const [result, setResult] = useState<AIResult>(null)
  const [preview, setPreview] = useState<Preview | null>(null)
  const [isPending, startTransition] = useTransition()

  const hasText = text.trim().length > 0
  const isConfirming = preview !== null

  function handlePreview() {
    if (!text.trim()) return
    setResult(null)

    // If no previewAction, fall back to directly saving
    if (!previewAction) {
      handleConfirm()
      return
    }

    startTransition(async () => {
      const res = await previewAction(text)
      if (res && 'preview' in res) {
        setPreview(res.preview)
      } else if (res && 'error' in res) {
        setResult({ error: res.error })
      }
    })
  }

  function handleConfirm() {
    startTransition(async () => {
      const res = await action(text)
      setResult(res)
      if (res && 'success' in res && res.success) {
        setText('')
        setPreview(null)
      }
    })
  }

  function handleEdit() {
    setPreview(null)
    setResult(null)
  }

  // Format preview values for display
  function formatValue(val: string | string[] | null): string {
    if (val === null || val === undefined) return '—'
    if (Array.isArray(val)) return val.length > 0 ? val.join(', ') : '—'
    // If it looks like a date, format it nicely
    if (typeof val === 'string' && val.match(/^\d{4}-\d{2}-\d{2}/)) {
      try {
        return new Date(val).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' })
      } catch { return val }
    }
    return String(val)
  }

  return (
    <div style={{
      background: '#ffffff',
      borderRadius: '20px',
      overflow: 'hidden',
      boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
    }}>
      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 18px 0' }}>
        <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'var(--em-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Sparkles size={10} color="#fff" />
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--em-600)' }}>
          {label}
        </span>
      </div>

      <AnimatePresence mode="wait">
        {/* ── Step 1: Input ── */}
        {!isConfirming && (
          <motion.div
            key="input"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
          >
            <textarea
              rows={3}
              value={text}
              onChange={(e) => setText(e.target.value)}
              placeholder={placeholder}
              style={{
                display: 'block', width: '100%', resize: 'none',
                padding: '12px 18px', border: 'none', fontSize: '13px',
                lineHeight: 1.6, color: 'var(--text-primary)',
                background: 'transparent', outline: 'none',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
              onKeyDown={(e) => {
                if ((e.metaKey || e.ctrlKey) && e.key === 'Enter') {
                  e.preventDefault()
                  handlePreview()
                }
              }}
            />
            <div style={{
              display: 'flex', alignItems: 'center', justifyContent: 'flex-end',
              padding: '10px 18px', borderTop: '1px solid var(--border)',
              background: hasText ? 'var(--em-50)' : '#fafafa', transition: 'background 0.2s',
            }}>
              <button
                type="button"
                onClick={handlePreview}
                disabled={isPending || !hasText}
                style={{
                  display: 'flex', alignItems: 'center', gap: '6px',
                  padding: '7px 14px', borderRadius: '10px',
                  background: hasText ? 'var(--em-500)' : 'transparent',
                  border: hasText ? 'none' : '1px solid var(--border)',
                  color: hasText ? '#fff' : 'var(--text-muted)',
                  fontSize: '12px', fontWeight: 600,
                  cursor: hasText ? 'pointer' : 'default', transition: 'all 0.2s',
                }}
              >
                {isPending
                  ? <><Loader2 size={12} className="animate-spin" /> Analyzing...</>
                  : <><Sparkles size={12} /> Preview</>
                }
              </button>
            </div>
          </motion.div>
        )}

        {/* ── Step 2: Confirm Preview ── */}
        {isConfirming && (
          <motion.div
            key="confirm"
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 8 }}
            style={{ padding: '14px 18px 18px' }}
          >
            {/* Preview label */}
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>
              AI understood this as:
            </p>

            {/* Preview fields */}
            <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '14px' }}>
              {Object.entries(preview!).map(([key, val], i, arr) => (
                <div
                  key={key}
                  style={{
                    display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start',
                    padding: '10px 14px',
                    borderBottom: i < arr.length - 1 ? '1px solid var(--border)' : 'none',
                    gap: '12px',
                  }}
                >
                  <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontWeight: 600, textTransform: 'capitalize', flexShrink: 0 }}>
                    {key.replace(/_/g, ' ')}
                  </span>
                  <span style={{ fontSize: '12px', color: 'var(--text-primary)', fontWeight: 500, textAlign: 'right' }}>
                    {formatValue(val)}
                  </span>
                </div>
              ))}
            </div>

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                type="button"
                onClick={handleEdit}
                disabled={isPending}
                style={{
                  flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '10px', borderRadius: '10px',
                  background: '#fff', border: '1px solid var(--border)',
                  color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                <ArrowLeft size={13} /> Edit
              </button>
              <button
                type="button"
                onClick={handleConfirm}
                disabled={isPending}
                style={{
                  flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                  padding: '10px', borderRadius: '10px',
                  background: 'var(--em-500)', border: 'none',
                  color: '#fff', fontSize: '13px', fontWeight: 700,
                  cursor: isPending ? 'default' : 'pointer',
                  opacity: isPending ? 0.8 : 1,
                }}
              >
                {isPending
                  ? <><Loader2 size={13} className="animate-spin" /> Saving...</>
                  : <><CheckCircle2 size={13} /> Confirm & Save</>
                }
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

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

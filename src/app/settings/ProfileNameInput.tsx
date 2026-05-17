'use client'

import { useState, useTransition } from 'react'
import { updateProfileName } from '@/actions/admin'
import { Check, Edit2, X } from 'lucide-react'

interface Props {
  initialName: string
}

export function ProfileNameInput({ initialName }: Props) {
  const [name, setName] = useState(initialName)
  const [isEditing, setIsEditing] = useState(false)
  const [saved, setSaved] = useState(false)
  const [err, setErr] = useState('')
  const [isPending, start] = useTransition()

  function handleSave() {
    setErr('')
    setSaved(false)
    const trimmed = name.trim()
    if (!trimmed) {
      setErr('Name cannot be empty')
      return
    }

    start(async () => {
      const result = await updateProfileName(trimmed)
      if (result && 'error' in result && typeof result.error === 'string') {
        setErr(result.error)
        return
      }
      setSaved(true)
      setIsEditing(false)
      setTimeout(() => setSaved(false), 3000)
    })
  }

  function handleCancel() {
    setName(initialName)
    setIsEditing(false)
    setErr('')
  }

  return (
    <div style={{ padding: '14px 18px', borderBottom: '1px solid var(--border)' }}>
      {/* Label and Toggle */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <span style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 500 }}>
          Full Name
        </span>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            style={{
              background: 'none', border: 'none', cursor: 'pointer',
              display: 'flex', alignItems: 'center', gap: '4px',
              fontSize: '12px', fontWeight: 600, color: 'var(--em-600)',
              padding: '4px 8px', borderRadius: '6px',
              transition: 'background 0.15s',
            }}
            onMouseEnter={e => { e.currentTarget.style.background = 'var(--em-50)' }}
            onMouseLeave={e => { e.currentTarget.style.background = 'none' }}
          >
            {saved ? (
              <span style={{ display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--em-600)' }}>
                <Check size={12} /> Saved!
              </span>
            ) : (
              <>
                <Edit2 size={12} /> Edit
              </>
            )}
          </button>
        )}
      </div>

      {/* Editing View */}
      {isEditing ? (
        <div style={{ marginTop: '10px' }}>
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
            <input
              type="text"
              value={name}
              onChange={e => setName(e.target.value)}
              placeholder="Md Adnan Hossain Mayaz"
              style={{
                flex: 1,
                padding: '8px 12px',
                borderRadius: '8px',
                border: '1px solid var(--border)',
                background: 'var(--bg-surface)',
                color: 'var(--text-primary)',
                fontSize: '14px',
                outline: 'none',
              }}
              onFocus={e => { e.target.style.borderColor = 'var(--em-400)' }}
              onBlur={e => { e.target.style.borderColor = 'var(--border)' }}
              autoFocus
            />
            
            <button
              onClick={handleSave}
              disabled={isPending || !name.trim()}
              style={{
                padding: '8px 14px', borderRadius: '8px', border: 'none',
                background: !name.trim() ? 'var(--bg-surface2)' : 'var(--em-500)',
                color: !name.trim() ? 'var(--text-muted)' : '#fff',
                fontSize: '13px', fontWeight: 700, cursor: name.trim() ? 'pointer' : 'default',
                transition: 'all 0.15s',
              }}
            >
              {isPending ? 'Saving…' : 'Save'}
            </button>

            <button
              onClick={handleCancel}
              disabled={isPending}
              style={{
                padding: '8px 10px', borderRadius: '8px', border: '1px solid var(--border)',
                background: 'none', color: 'var(--text-secondary)',
                fontSize: '13px', fontWeight: 600, cursor: 'pointer',
                transition: 'all 0.15s',
              }}
            >
              Cancel
            </button>
          </div>

          {err && (
            <p style={{ fontSize: '11px', color: '#dc2626', marginTop: '6px' }}>
              {err}
            </p>
          )}
        </div>
      ) : (
        /* Static View */
        <div style={{ marginTop: '4px', fontSize: '13px', color: 'var(--text-muted)' }}>
          {initialName}
        </div>
      )}
    </div>
  )
}

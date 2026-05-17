'use client'

import { useState, useRef } from 'react'
import { clsx } from 'clsx'

interface ComboboxProps {
  id: string
  name: string
  suggestions: string[]
  placeholder?: string
  defaultValue?: string
  required?: boolean
}

export function Combobox({
  id,
  name,
  suggestions,
  placeholder = 'Type or pick a suggestion...',
  defaultValue = '',
  required = false,
}: ComboboxProps) {
  const [value, setValue] = useState(defaultValue)
  const [open, setOpen] = useState(false)
  const inputRef = useRef<HTMLInputElement>(null)

  const filtered = suggestions.filter((s) =>
    s.toLowerCase().includes(value.toLowerCase())
  )

  return (
    <div style={{ position: 'relative' }}>
      <input
        ref={inputRef}
        id={id}
        name={name}
        type="text"
        value={value}
        required={required}
        autoComplete="off"
        placeholder={placeholder}
        onChange={(e) => setValue(e.target.value)}
        onFocus={() => setOpen(true)}
        onBlur={() => setTimeout(() => setOpen(false), 150)}
        className="field-input"
      />

      {/* Suggestion chips — shown on focus or when typing */}
      {open && (
        <div style={{ marginTop: '8px', display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
          {(value.trim() === '' ? suggestions : filtered).map((s) => {
            const isSelected = value === s
            return (
              <button
                key={s}
                type="button"
                onMouseDown={(e) => {
                  e.preventDefault()
                  setValue(s)
                  setOpen(false)
                  inputRef.current?.focus()
                }}
                style={{
                  padding: '6px 12px',
                  borderRadius: '16px',
                  fontSize: '12px',
                  fontWeight: 600,
                  transition: 'all 0.15s ease',
                  background: isSelected ? 'var(--em-50)' : '#ffffff',
                  color: isSelected ? 'var(--em-700)' : 'var(--text-secondary)',
                  border: isSelected ? '1px solid var(--em-200)' : '1px solid var(--border)',
                  cursor: 'pointer',
                }}
                onMouseOver={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'var(--em-400)'
                    e.currentTarget.style.color = 'var(--text-primary)'
                  }
                }}
                onMouseOut={(e) => {
                  if (!isSelected) {
                    e.currentTarget.style.borderColor = 'var(--border)'
                    e.currentTarget.style.color = 'var(--text-secondary)'
                  }
                }}
              >
                {s}
              </button>
            )
          })}
          {value.trim() !== '' && !suggestions.includes(value) && (
            <span style={{
              padding: '6px 12px',
              borderRadius: '16px',
              fontSize: '12px',
              color: 'var(--em-600)',
              border: '1px dashed var(--em-400)',
              background: '#ffffff',
            }}>
              Custom: "{value}"
            </span>
          )}
        </div>
      )}
    </div>
  )
}

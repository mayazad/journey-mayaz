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
    <div className="relative">
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
        <div className="mt-2 flex flex-wrap gap-1.5">
          {(value.trim() === '' ? suggestions : filtered).map((s) => (
            <button
              key={s}
              type="button"
              onMouseDown={(e) => {
                e.preventDefault()
                setValue(s)
                setOpen(false)
                inputRef.current?.focus()
              }}
              className={clsx(
                'px-2.5 py-1 rounded-md text-xs font-medium border transition-all',
                value === s
                  ? 'bg-[var(--em-700)] text-[var(--em-100)] border-[var(--em-600)]'
                  : 'bg-[var(--bg-elevated)] text-[var(--text-secondary)] border-[var(--border)] hover:border-[var(--em-700)] hover:text-[var(--em-300)]'
              )}
            >
              {s}
            </button>
          ))}
          {value.trim() !== '' && !suggestions.includes(value) && (
            <span className="px-2.5 py-1 rounded-md text-xs text-[var(--em-600)] border border-dashed border-[var(--em-800)]">
              Custom: "{value}"
            </span>
          )}
        </div>
      )}
    </div>
  )
}

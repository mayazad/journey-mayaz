'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Shield, Key, Database } from 'lucide-react'

type VaultEntry = {
  id: string; service_name: string; email_used: string
  auth_method: string; notes?: string | null; created_at: string
}

export function VaultTable({ entries }: { entries: VaultEntry[] }) {
  const [query, setQuery] = useState('')

  const filtered = entries.filter((e) =>
    e.service_name.toLowerCase().includes(query.toLowerCase()) ||
    e.email_used.toLowerCase().includes(query.toLowerCase()) ||
    e.auth_method.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>

      {/* Search bar */}
      <div style={{
        display: 'flex', alignItems: 'center', gap: '10px',
        background: '#ffffff', borderRadius: '14px',
        padding: '12px 16px',
        boxShadow: '0 2px 12px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)',
      }}>
        <Search size={15} color="var(--em-500)" style={{ flexShrink: 0 }} />
        <input
          type="text"
          placeholder="Search service, email or auth..."
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          style={{
            flex: 1, background: 'transparent', border: 'none', outline: 'none',
            fontSize: '14px', color: 'var(--text-primary)',
          }}
        />
      </div>

      {/* Entries */}
      {filtered.length === 0 ? (
        <div style={{
          background: '#ffffff', borderRadius: '20px', padding: '40px 20px',
          display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
        }}>
          <Database size={36} color="var(--border-2)" strokeWidth={1.5} style={{ marginBottom: '12px' }} />
          <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '4px' }}>
            {entries.length === 0 ? 'No entries yet' : 'No results'}
          </p>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
            {entries.length === 0 ? 'Add your first entry above.' : 'Try a different search term.'}
          </p>
        </div>
      ) : (
        <div style={{
          background: '#ffffff', borderRadius: '20px', overflow: 'hidden',
          boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
        }}>
          <AnimatePresence>
            {filtered.map((entry, index) => (
              <motion.div
                key={entry.id}
                initial={{ opacity: 0 }}
                animate={{ opacity: 1 }}
                exit={{ opacity: 0 }}
                style={{
                  padding: '14px 18px',
                  borderBottom: index < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                }}
              >
                {/* Row 1: icon + service name + date */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                  <div style={{
                    width: '34px', height: '34px', borderRadius: '10px',
                    background: 'var(--em-50)', border: '1px solid var(--em-200)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                  }}>
                    <Shield size={15} color="var(--em-600)" />
                  </div>
                  <div style={{ flex: 1, minWidth: 0 }}>
                    <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.service_name}
                    </p>
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', marginTop: '1px' }}>
                      {entry.email_used}
                    </p>
                  </div>
                  <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontFamily: 'monospace', flexShrink: 0 }}>
                    {new Date(entry.created_at).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                  </span>
                </div>

                {/* Row 2: auth method badge + notes */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '8px', paddingLeft: '46px' }}>
                  <span style={{
                    display: 'flex', alignItems: 'center', gap: '4px',
                    fontSize: '11px', fontWeight: 600,
                    padding: '3px 10px', borderRadius: '20px',
                    background: 'var(--em-50)', border: '1px solid var(--em-200)', color: 'var(--em-700)',
                  }}>
                    <Key size={10} /> {entry.auth_method}
                  </span>
                  {entry.notes && (
                    <span style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {entry.notes}
                    </span>
                  )}
                </div>
              </motion.div>
            ))}
          </AnimatePresence>
        </div>
      )}
    </div>
  )
}

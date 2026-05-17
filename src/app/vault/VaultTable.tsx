'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Search, Shield, Key, Database, X, Mail, FileText, Trash2, Loader2 } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'

type VaultEntry = {
  id: string; service_name: string; email_used: string
  auth_method: string; notes?: string | null; created_at: string
}

export function VaultTable({ entries }: { entries: VaultEntry[] }) {
  const [query, setQuery] = useState('')
  const [selectedEntry, setSelectedEntry] = useState<VaultEntry | null>(null)
  const [confirmDelete, setConfirmDelete] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleDelete(id: string) {
    startTransition(async () => {
      const supabase = createClient()
      await supabase.from('account_metadata').delete().eq('id', id)
      setConfirmDelete(false)
      setSelectedEntry(null)
      router.refresh()
    })
  }

  const filtered = entries.filter((e) =>
    e.service_name.toLowerCase().includes(query.toLowerCase()) ||
    e.email_used.toLowerCase().includes(query.toLowerCase()) ||
    e.auth_method.toLowerCase().includes(query.toLowerCase())
  )

  return (
    <>
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
                  onClick={() => setSelectedEntry(entry)}
                  style={{
                    padding: '14px 18px',
                    borderBottom: index < filtered.length - 1 ? '1px solid var(--border)' : 'none',
                    cursor: 'pointer',
                    transition: 'background-color 0.15s ease',
                  }}
                  onMouseOver={(e) => e.currentTarget.style.backgroundColor = 'var(--bg-surface)'}
                  onMouseOut={(e) => e.currentTarget.style.backgroundColor = 'transparent'}
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
                </motion.div>
              ))}
            </AnimatePresence>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <AnimatePresence>
        {selectedEntry && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setSelectedEntry(null)}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.25)', backdropFilter: 'blur(4px)',
                zIndex: 200,
              }}
            />
            <motion.div
              initial={{ y: 100, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: 100, opacity: 0 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              style={{
                position: 'fixed',
                bottom: '16px', left: 0, right: 0, margin: '0 auto',
                width: 'calc(100% - 32px)', maxWidth: '400px',
                background: '#fff', borderRadius: '24px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                zIndex: 201, overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '14px', background: 'var(--em-50)', border: '1px solid var(--em-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Shield size={20} color="var(--em-600)" />
                </div>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '2px', letterSpacing: '-0.3px' }}>
                    {selectedEntry.service_name}
                  </p>
                  <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>
                    Added {new Date(selectedEntry.created_at).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })}
                  </p>
                </div>
                <button
                  onClick={() => { setSelectedEntry(null); setConfirmDelete(false); }}
                  style={{ width: '32px', height: '32px', background: 'var(--bg-surface2)', border: '1px solid var(--border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                >
                  <X size={14} color="var(--text-muted)" />
                </button>
              </div>

              {/* Details */}
              <div style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
                
                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Mail size={12} /> Email Used
                  </p>
                  <div style={{ padding: '12px 14px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{selectedEntry.email_used}</p>
                  </div>
                </div>

                <div>
                  <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <Key size={12} /> Auth Method
                  </p>
                  <div style={{ padding: '12px 14px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                    <p style={{ fontSize: '14px', color: 'var(--text-primary)', fontWeight: 500 }}>{selectedEntry.auth_method}</p>
                  </div>
                </div>

                {selectedEntry.notes && (
                  <div>
                    <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                      <FileText size={12} /> Notes
                    </p>
                    <div style={{ padding: '12px 14px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                      <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap' }}>{selectedEntry.notes}</p>
                    </div>
                  </div>
                )}

                {/* Delete Area */}
                {confirmDelete ? (
                  <div style={{
                    marginTop: '4px', padding: '12px 16px',
                    background: '#fef2f2', border: '1px solid #fecaca',
                    borderRadius: '12px', display: 'flex', flexDirection: 'column', gap: '12px'
                  }}>
                    <p style={{ fontSize: '13px', color: '#991b1b', fontWeight: 600, textAlign: 'center' }}>
                      Are you sure you want to delete this?
                    </p>
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <button
                        onClick={() => setConfirmDelete(false)}
                        disabled={isPending}
                        style={{
                          flex: 1, padding: '10px',
                          background: '#fff', border: '1px solid #fca5a5',
                          borderRadius: '8px', color: '#dc2626',
                          fontSize: '13px', fontWeight: 600, cursor: 'pointer'
                        }}
                      >
                        Cancel
                      </button>
                      <button
                        onClick={() => handleDelete(selectedEntry.id)}
                        disabled={isPending}
                        style={{
                          flex: 1, padding: '10px', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
                          background: '#dc2626', border: '1px solid #b91c1c',
                          borderRadius: '8px', color: '#fff',
                          fontSize: '13px', fontWeight: 600, cursor: isPending ? 'default' : 'pointer',
                          opacity: isPending ? 0.7 : 1,
                        }}
                      >
                        {isPending ? <Loader2 size={14} className="animate-spin" /> : null}
                        {isPending ? 'Deleting...' : 'Delete'}
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    onClick={() => setConfirmDelete(true)}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      width: '100%', padding: '12px', marginTop: '4px',
                      background: '#fff', border: '1px solid #fee2e2',
                      borderRadius: '12px', color: '#ef4444',
                      fontSize: '14px', fontWeight: 600,
                      cursor: 'pointer', transition: 'background 0.15s'
                    }}
                    onMouseOver={(e) => e.currentTarget.style.backgroundColor = '#fef2f2'}
                    onMouseOut={(e) => e.currentTarget.style.backgroundColor = '#fff'}
                  >
                    <Trash2 size={16} />
                    Delete Entry
                  </button>
                )}

              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

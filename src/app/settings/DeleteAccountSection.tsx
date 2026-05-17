'use client'

import { useState, useTransition } from 'react'
import { deleteOwnAccount } from '@/actions/admin'
import { Trash2, AlertTriangle, X } from 'lucide-react'
import { useRouter } from 'next/navigation'

interface Props {
  isAdmin: boolean
}

export function DeleteAccountSection({ isAdmin }: Props) {
  const [showConfirm, setShowConfirm] = useState(false)
  const [error, setError]             = useState('')
  const [isPending, start]            = useTransition()
  const router = useRouter()

  function handleDelete() {
    setError('')
    start(async () => {
      const result = await deleteOwnAccount()
      if (result && 'error' in result && typeof result.error === 'string') {
        setError(result.error)
        return
      }
      // On success, redirect to login page
      router.push('/login')
      router.refresh()
    })
  }

  return (
    <>
      <div style={{ padding: '16px 18px' }}>
        <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
          <Trash2 size={16} color={isAdmin ? 'var(--text-muted)' : '#dc2626'} style={{ flexShrink: 0, marginTop: '2px' }} />
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '14px', color: 'var(--text-secondary)', fontWeight: 600, marginBottom: '4px' }}>
              Delete Account
            </p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', lineHeight: 1.5, marginBottom: '12px' }}>
              Permanently remove your account, profile, and all associated personal data from Mayaz OS databases. This action is immediate and cannot be undone.
            </p>

            {isAdmin ? (
              <div style={{
                fontSize: '12px', color: '#b45309', background: '#fffbeb',
                border: '1px solid #fde68a', borderRadius: '8px', padding: '8px 12px',
                display: 'inline-block', fontWeight: 600,
              }}>
                🛡️ Administrators cannot self-delete to prevent system lockouts.
              </div>
            ) : (
              <button
                onClick={() => setShowConfirm(true)}
                style={{
                  padding: '8px 16px', borderRadius: '8px', border: 'none',
                  background: '#fef2f2', color: '#dc2626',
                  fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                  borderWidth: '1px', borderStyle: 'solid', borderColor: '#fca5a5',
                  transition: 'all 0.15s',
                }}
                onMouseEnter={e => {
                  e.currentTarget.style.background = '#fee2e2'
                }}
                onMouseLeave={e => {
                  e.currentTarget.style.background = '#fef2f2'
                }}
              >
                Delete My Account
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Confirmation Modal */}
      {showConfirm && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
          background: 'rgba(0, 0, 0, 0.4)', backdropFilter: 'blur(8px)',
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          zIndex: 9999, padding: '16px',
        }}>
          <div style={{
            width: '100%', maxWidth: '380px',
            background: '#ffffff', borderRadius: '24px',
            padding: '24px', border: '1px solid rgba(0,0,0,0.08)',
            boxShadow: '0 24px 64px rgba(0,0,0,0.15)',
            boxSizing: 'border-box',
          }}>
            {/* Header */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#dc2626' }}>
                <AlertTriangle size={20} />
                <h3 style={{ fontSize: '17px', fontWeight: 800, margin: 0 }}>Are you absolutely sure?</h3>
              </div>
              <button
                onClick={() => { if (!isPending) setShowConfirm(false) }}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)' }}
              >
                <X size={18} />
              </button>
            </div>

            {/* Warning Text */}
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, margin: '0 0 16px' }}>
              This will permanently delete your entire profile and **all personal OS data** (workouts, academics, brief history, and secret vault files) across all databases instantly. This action is **irreversible**.
            </p>

            {error && (
              <p style={{ fontSize: '12px', color: '#dc2626', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '8px', padding: '8px 12px', margin: '0 0 16px' }}>
                {error}
              </p>
            )}

            {/* Action buttons */}
            <div style={{ display: 'flex', gap: '10px' }}>
              <button
                onClick={handleDelete}
                disabled={isPending}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px', border: 'none',
                  background: '#dc2626', color: '#fff', fontSize: '13px', fontWeight: 700,
                  cursor: isPending ? 'default' : 'pointer',
                  transition: 'opacity 0.2s',
                }}
              >
                {isPending ? 'Deleting…' : 'Yes, Delete Account'}
              </button>
              <button
                onClick={() => setShowConfirm(false)}
                disabled={isPending}
                style={{
                  flex: 1, padding: '10px', borderRadius: '10px', border: '1px solid var(--border)',
                  background: '#fff', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600,
                  cursor: 'pointer',
                }}
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  )
}

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Settings, X } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export function MobileHeader({ userName, userEmail }: { userName?: string; userEmail?: string }) {
  const [open, setOpen] = useState(false)
  const router  = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    setOpen(false)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayName = userName || userEmail?.split('@')[0] || 'You'
  const initials    = displayName.slice(0, 2).toUpperCase()

  return (
    <>
      {/* Header bar */}
      <header
        className="md:hidden"
        style={{
          position: 'sticky',
          top: 0,
          zIndex: 100,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          padding: '0 20px',
          height: '60px',
          background: 'rgba(250,250,249,0.92)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderBottom: '1px solid rgba(0,0,0,0.06)',
        }}
      >
        {/* Brand Name */}
        <span style={{ fontWeight: 700, fontSize: '17px', letterSpacing: '-0.4px', color: 'var(--text-primary)' }}>
          Mayaz OS
        </span>

        {/* Avatar button */}
        <button
          onClick={() => setOpen(true)}
          style={{
            width: '36px', height: '36px',
            borderRadius: '50%',
            background: 'var(--em-50)',
            border: '2px solid var(--em-200)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            cursor: 'pointer',
          }}
        >
          <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--em-700)' }}>{initials}</span>
        </button>
      </header>

      {/* Profile Sheet */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              key="backdrop"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.25)',
                backdropFilter: 'blur(4px)',
                zIndex: 200,
              }}
            />

            {/* Sheet Panel — slides down from top */}
            <motion.div
              key="sheet"
              initial={{ y: -20, opacity: 0, scale: 0.97 }}
              animate={{ y: 0, opacity: 1, scale: 1 }}
              exit={{ y: -20, opacity: 0, scale: 0.97 }}
              transition={{ type: 'spring', damping: 28, stiffness: 350 }}
              style={{
                position: 'fixed',
                top: '12px', left: '12px', right: '12px',
                background: '#fff',
                borderRadius: '20px',
                boxShadow: '0 20px 60px rgba(0,0,0,0.15), 0 0 0 1px rgba(0,0,0,0.05)',
                zIndex: 201,
                overflow: 'hidden',
              }}
            >
              {/* Profile Info */}
              <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                <div
                  style={{
                    width: '48px', height: '48px', borderRadius: '50%',
                    background: 'var(--em-100)',
                    border: '2px solid var(--em-200)',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    flexShrink: 0,
                  }}
                >
                  <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--em-700)' }}>{initials}</span>
                </div>
                <div style={{ flex: 1, minWidth: 0 }}>
                  <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>
                    {userName || displayName}
                  </p>
                  {userEmail && (
                    <p style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                      {userEmail}
                    </p>
                  )}
                </div>
                <button
                  onClick={() => setOpen(false)}
                  style={{
                    width: '32px', height: '32px',
                    background: 'var(--bg-surface2)',
                    border: '1px solid var(--border)',
                    borderRadius: '50%',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: 'pointer', flexShrink: 0,
                  }}
                >
                  <X size={14} color="var(--text-muted)" />
                </button>
              </div>

              {/* Menu Items */}
              <div style={{ padding: '8px' }}>
                <Link
                  href="/settings"
                  onClick={() => setOpen(false)}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '13px 16px', borderRadius: '12px',
                    textDecoration: 'none', color: 'var(--text-secondary)',
                    fontSize: '14px', fontWeight: 500,
                  }}
                >
                  <Settings size={17} color="var(--text-muted)" />
                  Settings
                </Link>
                <button
                  onClick={handleSignOut}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '12px',
                    padding: '13px 16px', borderRadius: '12px',
                    width: '100%', background: 'none', border: 'none',
                    color: '#ef4444', fontSize: '14px', fontWeight: 500,
                    cursor: 'pointer', textAlign: 'left',
                  }}
                >
                  <LogOut size={17} color="#ef4444" />
                  Sign out
                </button>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

'use client'

import { useState } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Settings, X, Info, Shield, ChevronRight } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'

function AboutSheet({ onClose }: { onClose: () => void }) {
  return (
    <motion.div
      key="about"
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 12 }}
      transition={{ duration: 0.2 }}
      style={{ padding: '4px 8px 8px' }}
    >
      {/* Back button */}
      <button
        onClick={onClose}
        style={{
          display: 'flex', alignItems: 'center', gap: '6px',
          padding: '10px 12px', marginBottom: '4px',
          background: 'none', border: 'none',
          fontSize: '13px', color: 'var(--text-muted)',
          cursor: 'pointer', borderRadius: '10px',
        }}
      >
        ← Back
      </button>

      {/* App identity */}
      <div style={{ padding: '12px 16px 16px', borderRadius: '14px', background: 'var(--em-50)', border: '1px solid var(--em-200)', margin: '0 4px 12px' }}>
        <p style={{ fontSize: '18px', fontWeight: 800, color: 'var(--em-700)', letterSpacing: '-0.3px', marginBottom: '2px' }}>Mayaz OS</p>
        <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Version 1.0.0 · Personal Edition</p>
      </div>

      {/* Info items */}
      {[
        { label: 'Built by', value: <a href="https://www.linkedin.com/in/md-mayaz-ad/" target="_blank" rel="noopener noreferrer" style={{ color: 'var(--em-600)', textDecoration: 'none' }}>Md Adnan Hossain Mayaz</a> },
        { label: 'Stack', value: 'Next.js 15, Supabase, Groq AI' },
        { label: 'AI Model', value: 'Llama 3.1 · 8B Instant' },
      ].map(({ label, value }) => (
        <div key={label} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 16px', borderBottom: '1px solid var(--border)' }}>
          <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>{label}</span>
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)' }}>{value}</span>
        </div>
      ))}

      {/* Privacy note */}
      <div style={{
        display: 'flex', gap: '10px', alignItems: 'flex-start',
        margin: '12px 4px 4px',
        padding: '12px 14px', borderRadius: '12px',
        background: '#f0fdf4', border: '1px solid var(--em-200)',
      }}>
        <Shield size={14} color="var(--em-600)" style={{ flexShrink: 0, marginTop: '1px' }} />
        <p style={{ fontSize: '12px', color: 'var(--em-700)', lineHeight: 1.5 }}>
          Your Vault data is <strong>never</strong> accessed by the AI. All data is scoped to your account with Row Level Security.
        </p>
      </div>

      {/* Copyright */}
      <p style={{ textAlign: 'center', fontSize: '11px', color: 'var(--text-muted)', padding: '16px 16px 8px', lineHeight: 1.6 }}>
        © {new Date().getFullYear()} Mayaz OS. All rights reserved.{'\n'}
        Personal use only — not licensed for redistribution.
      </p>
    </motion.div>
  )
}

export function MobileHeader({ userName, userEmail, avatarUrl }: { userName?: string; userEmail?: string; avatarUrl?: string | null }) {
  const [open, setOpen]       = useState(false)
  const [showAbout, setShowAbout] = useState(false)
  const router   = useRouter()
  const supabase = createClient()

  async function handleSignOut() {
    setOpen(false)
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  function handleClose() {
    setOpen(false)
    setShowAbout(false)
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
            overflow: 'hidden',
            padding: 0,
          }}
        >
          {avatarUrl ? (
            <Image src={avatarUrl} alt="Avatar" width={36} height={36} style={{ width: '100%', height: '100%', objectFit: 'cover' }} unoptimized />
          ) : (
            <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--em-700)' }}>{initials}</span>
          )}
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
              onClick={handleClose}
              style={{
                position: 'fixed', inset: 0,
                background: 'rgba(0,0,0,0.25)',
                backdropFilter: 'blur(4px)',
                zIndex: 200,
              }}
            />

            {/* Sheet */}
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
              <AnimatePresence mode="wait">
                {showAbout ? (
                  <AboutSheet key="about" onClose={() => setShowAbout(false)} />
                ) : (
                  <motion.div key="menu" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
                    {/* Profile Info */}
                    <div style={{ padding: '20px 20px 16px', borderBottom: '1px solid var(--border)', display: 'flex', alignItems: 'center', gap: '14px' }}>
                      <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'var(--em-100)', border: '2px solid var(--em-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, overflow: 'hidden' }}>
                        {avatarUrl ? (
                          <Image src={avatarUrl} alt="Avatar" width={48} height={48} style={{ width: '100%', height: '100%', objectFit: 'cover' }} unoptimized />
                        ) : (
                          <span style={{ fontSize: '16px', fontWeight: 800, color: 'var(--em-700)' }}>{initials}</span>
                        )}
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', marginBottom: '2px' }}>{userName || displayName}</p>
                        {userEmail && (
                          <p style={{ fontSize: '12px', color: 'var(--text-muted)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{userEmail}</p>
                        )}
                      </div>
                      <button
                        onClick={handleClose}
                        style={{ width: '32px', height: '32px', background: 'var(--bg-surface2)', border: '1px solid var(--border)', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', flexShrink: 0 }}
                      >
                        <X size={14} color="var(--text-muted)" />
                      </button>
                    </div>

                    {/* Menu Items */}
                    <div style={{ padding: '8px' }}>
                      <Link
                        href="/settings"
                        onClick={handleClose}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', borderRadius: '12px', textDecoration: 'none', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500 }}
                      >
                        <Settings size={17} color="var(--text-muted)" />
                        Settings
                        <ChevronRight size={14} color="var(--border-2)" style={{ marginLeft: 'auto' }} />
                      </Link>

                      {/* About & Legal */}
                      <button
                        onClick={() => setShowAbout(true)}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', borderRadius: '12px', width: '100%', background: 'none', border: 'none', color: 'var(--text-secondary)', fontSize: '14px', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                      >
                        <Info size={17} color="var(--text-muted)" />
                        About & Legal
                        <ChevronRight size={14} color="var(--border-2)" style={{ marginLeft: 'auto' }} />
                      </button>

                      {/* Divider */}
                      <div style={{ height: '1px', background: 'var(--border)', margin: '4px 12px' }} />

                      <button
                        onClick={handleSignOut}
                        style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '13px 16px', borderRadius: '12px', width: '100%', background: 'none', border: 'none', color: '#ef4444', fontSize: '14px', fontWeight: 500, cursor: 'pointer', textAlign: 'left' }}
                      >
                        <LogOut size={17} color="#ef4444" />
                        Sign out
                      </button>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

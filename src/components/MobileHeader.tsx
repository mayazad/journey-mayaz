'use client'

import { useState, useEffect } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { LogOut, Settings, X, Info, Shield, ChevronRight, Bell, ShieldAlert, ShieldCheck } from 'lucide-react'
import { createClient } from '@/lib/supabase/client'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Image from 'next/image'
import { getPendingUsers, approvePendingUser, rejectPendingUser } from '@/actions/admin'

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

export function MobileHeader({
  userName,
  userEmail,
  avatarUrl,
  isAdmin = false,
  initialPendingCount = 0,
}: {
  userName?: string
  userEmail?: string
  avatarUrl?: string | null
  isAdmin?: boolean
  initialPendingCount?: number
}) {
  const [open, setOpen]               = useState(false)
  const [showAbout, setShowAbout]     = useState(false)
  const [pendingUsers, setPendingUsers] = useState<any[]>([])
  const [pendingCount, setPendingCount] = useState(initialPendingCount)
  const [showApprovalsModal, setShowApprovalsModal] = useState(false)

  const router   = useRouter()
  const supabase = createClient()

  // Polling for new user registration approvals (admin only)
  useEffect(() => {
    if (!isAdmin) return
    let active = true
    async function loadPending() {
      try {
        const list = await getPendingUsers()
        if (active) {
          setPendingUsers(list)
          setPendingCount(list.length)
        }
      } catch (err) {
        console.error('Failed to load pending users:', err)
      }
    }
    loadPending()
    const interval = setInterval(loadPending, 30000) // Poll every 30 seconds
    return () => {
      active = false
      clearInterval(interval)
    }
  }, [isAdmin])

  async function handleApprove(userId: string) {
    try {
      await approvePendingUser(userId)
      setPendingUsers(prev => prev.filter(u => u.id !== userId))
      setPendingCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Approve failed:', err)
    }
  }

  async function handleReject(userId: string) {
    try {
      await rejectPendingUser(userId)
      setPendingUsers(prev => prev.filter(u => u.id !== userId))
      setPendingCount(prev => Math.max(0, prev - 1))
    } catch (err) {
      console.error('Reject failed:', err)
    }
  }

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
      <style>{`
        @keyframes adminAvatarPulse {
          0% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7);
          }
          70% {
            box-shadow: 0 0 0 10px rgba(16, 185, 129, 0);
          }
          100% {
            box-shadow: 0 0 0 0 rgba(16, 185, 129, 0);
          }
        }
        .admin-avatar-pulse {
          animation: adminAvatarPulse 1.8s infinite;
        }
      `}</style>

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

        {/* Avatar button container */}
        <div style={{ position: 'relative' }}>
          <button
            onClick={() => setOpen(true)}
            className={isAdmin && pendingCount > 0 ? 'admin-avatar-pulse' : ''}
            style={{
              width: '36px', height: '36px',
              borderRadius: '50%',
              background: 'var(--em-50)',
              border: isAdmin && pendingCount > 0 ? '2px solid #10b981' : '2px solid var(--em-200)',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
              cursor: 'pointer',
              overflow: 'hidden',
              padding: 0,
              outline: 'none',
            }}
          >
            {avatarUrl ? (
              <Image src={avatarUrl} alt="Avatar" width={36} height={36} style={{ width: '100%', height: '100%', objectFit: 'cover' }} unoptimized />
            ) : (
              <span style={{ fontSize: '12px', fontWeight: 800, color: 'var(--em-700)' }}>{initials}</span>
            )}
          </button>

          {isAdmin && pendingCount > 0 && (
            <span style={{
              position: 'absolute',
              top: '-1px',
              right: '-1px',
              width: '10px',
              height: '10px',
              background: '#dc2626',
              borderRadius: '50%',
              border: '2px solid #fff',
              pointerEvents: 'none',
            }} />
          )}
        </div>
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

                      {isAdmin && (
                        <button
                          onClick={() => {
                            setOpen(false)
                            setShowApprovalsModal(true)
                          }}
                          style={{
                            display: 'flex',
                            alignItems: 'center',
                            gap: '12px',
                            padding: '13px 16px',
                            borderRadius: '12px',
                            width: '100%',
                            background: 'none',
                            border: 'none',
                            color: 'var(--text-secondary)',
                            fontSize: '14px',
                            fontWeight: 500,
                            cursor: 'pointer',
                            textAlign: 'left',
                          }}
                        >
                          <ShieldAlert size={17} color={pendingCount > 0 ? '#10b981' : 'var(--text-muted)'} className={pendingCount > 0 ? 'admin-avatar-pulse' : ''} />
                          <span>Pending Approvals</span>
                          {pendingCount > 0 && (
                            <span style={{
                              marginLeft: 'auto',
                              background: '#dc2626',
                              color: '#fff',
                              fontSize: '10px',
                              fontWeight: 700,
                              borderRadius: '50%',
                              width: '18px',
                              height: '18px',
                              display: 'flex',
                              alignItems: 'center',
                              justifyContent: 'center',
                            }}>
                              {pendingCount}
                            </span>
                          )}
                          {pendingCount === 0 && (
                            <ChevronRight size={14} color="var(--border-2)" style={{ marginLeft: 'auto' }} />
                          )}
                        </button>
                      )}

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

      {/* Pending Approvals Modal */}
      <AnimatePresence>
        {showApprovalsModal && (
          <div style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: 'rgba(0,0,0,0.4)',
            backdropFilter: 'blur(8px)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: '16px',
          }}>
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: 10 }}
              style={{
                width: '100%',
                maxWidth: '480px',
                background: '#ffffff',
                borderRadius: '24px',
                padding: '24px',
                boxShadow: '0 20px 50px rgba(0,0,0,0.15)',
                border: '1px solid rgba(0,0,0,0.05)',
                position: 'relative',
              }}
            >
              <button
                onClick={() => setShowApprovalsModal(false)}
                style={{
                  position: 'absolute',
                  top: '20px',
                  right: '20px',
                  background: '#f3f4f6',
                  border: 'none',
                  borderRadius: '50%',
                  width: '32px',
                  height: '32px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  cursor: 'pointer',
                  color: 'var(--text-muted)',
                }}
              >
                <X size={16} />
              </button>

              <h2 style={{ fontSize: '20px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '6px', letterSpacing: '-0.5px' }}>
                Pending Approvals
              </h2>
              <p style={{ fontSize: '13px', color: 'var(--text-muted)', marginBottom: '20px' }}>
                Approve or reject new users requesting access to Mayaz OS.
              </p>

              <div style={{
                maxHeight: '320px',
                overflowY: 'auto',
                display: 'flex',
                flexDirection: 'column',
                gap: '12px',
                marginBottom: '8px',
              }}>
                {pendingUsers.length === 0 ? (
                  <div style={{
                    textAlign: 'center',
                    padding: '40px 0',
                    color: 'var(--text-muted)',
                    fontSize: '14px',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '12px',
                  }}>
                    <ShieldCheck size={36} color="var(--em-500)" style={{ strokeWidth: 1.75 }} />
                    <span>No pending approval requests.</span>
                  </div>
                ) : (
                  pendingUsers.map(u => (
                    <div
                      key={u.id}
                      style={{
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'space-between',
                        padding: '12px 14px',
                        background: '#f9fafb',
                        borderRadius: '16px',
                        border: '1px solid #f3f4f6',
                        gap: '12px',
                      }}
                    >
                      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', minWidth: 0, flex: 1 }}>
                        <div style={{
                          width: '38px',
                          height: '38px',
                          borderRadius: '50%',
                          background: 'var(--em-50)',
                          color: 'var(--em-700)',
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontWeight: 700,
                          fontSize: '14px',
                          overflow: 'hidden',
                          flexShrink: 0,
                        }}>
                          {u.avatar_url ? (
                            <img src={u.avatar_url} alt={u.full_name} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                          ) : (
                            (u.full_name || u.username || '?').slice(0, 2).toUpperCase()
                          )}
                        </div>
                        <div style={{ minWidth: 0 }}>
                          <h4 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', margin: 0, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            {u.full_name || 'Anonymous User'}
                          </h4>
                          <p style={{ fontSize: '11px', color: 'var(--text-muted)', margin: '2px 0 0', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                            @{u.username} · Joined {new Date(u.created_at).toLocaleDateString()}
                          </p>
                        </div>
                      </div>

                      <div style={{ display: 'flex', gap: '8px', flexShrink: 0 }}>
                        <button
                          onClick={() => handleReject(u.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: '1px solid #fee2e2',
                            background: '#fff',
                            color: '#dc2626',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Reject
                        </button>
                        <button
                          onClick={() => handleApprove(u.id)}
                          style={{
                            padding: '6px 12px',
                            borderRadius: '8px',
                            border: 'none',
                            background: 'var(--em-500)',
                            color: '#fff',
                            fontSize: '12px',
                            fontWeight: 600,
                            cursor: 'pointer',
                          }}
                        >
                          Approve
                        </button>
                      </div>
                    </div>
                  ))
                )}
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </>
  )
}

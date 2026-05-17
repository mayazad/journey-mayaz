'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, BookOpen, Dumbbell, GraduationCap, Vault,
  ChevronLeft, ChevronRight, Settings, LogOut, ShieldAlert, X, ShieldCheck,
} from 'lucide-react'
import { useState, useEffect } from 'react'
import { clsx } from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { MayazLogo } from '@/components/MayazLogo'
import { getPendingUsers, approvePendingUser, rejectPendingUser } from '@/actions/admin'

const NAV_ITEMS = [
  { id: 'home',      href: '/home',      icon: Home,          label: 'Home',      desc: 'Today\'s briefing' },
  { id: 'learning',  href: '/learning',  icon: BookOpen,      label: 'Learning',  desc: 'Roadmaps' },
  { id: 'fitness',   href: '/fitness',   icon: Dumbbell,      label: 'Fitness',   desc: 'Weekly plan' },
  { id: 'academics', href: '/academics', icon: GraduationCap, label: 'Academics', desc: 'Deadlines' },
  { id: 'vault',     href: '/vault',     icon: Vault,         label: 'Vault',     desc: 'Account metadata' },
]

interface SidebarProps {
  userName?: string
  userEmail?: string
  avatarUrl?: string | null
  isAdmin?: boolean
  initialPendingCount?: number
}

export default function Sidebar({
  userName,
  userEmail,
  avatarUrl,
  isAdmin = false,
  initialPendingCount = 0,
}: SidebarProps) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [collapsed, setCollapsed] = useState(false)
  const [pendingUsers, setPendingUsers] = useState<any[]>([])
  const [pendingCount, setPendingCount] = useState(initialPendingCount)
  const [showApprovalsModal, setShowApprovalsModal] = useState(false)

  const supabase = createClient()

  // Polling for pending approvals (admin only)
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
    await supabase.auth.signOut()
    router.push('/login')
    router.refresh()
  }

  const displayName = userName || userEmail?.split('@')[0] || 'You'
  const initials    = displayName.slice(0, 2).toUpperCase()

  return (
    <motion.nav
      className="sidebar"
      animate={{ width: collapsed ? 64 : 240 }}
      transition={{ duration: 0.25, ease: [0.4, 0, 0.2, 1] }}
    >
      {/* Brand */}
      <div className="flex items-center justify-between px-4 py-4 border-b border-[var(--border)]">
        <AnimatePresence mode="wait">
          {!collapsed ? (
            <motion.div key="full" initial={{ opacity: 0, x: -6 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -6 }} transition={{ duration: 0.15 }}>
              <MayazLogo size={28} withWordmark />
            </motion.div>
          ) : (
            <motion.div key="icon" initial={{ opacity: 0, scale: 0.8 }} animate={{ opacity: 1, scale: 1 }} exit={{ opacity: 0, scale: 0.8 }} transition={{ duration: 0.15 }}>
              <MayazLogo size={28} />
            </motion.div>
          )}
        </AnimatePresence>

        {!collapsed && (
          <button onClick={() => setCollapsed(true)} className="p-1 rounded-md text-[var(--text-muted)] hover:text-[var(--em-600)] hover:bg-[var(--bg-hover)] transition-all" aria-label="Collapse sidebar">
            <ChevronLeft size={14} />
          </button>
        )}
      </div>

      {collapsed && (
        <button onClick={() => setCollapsed(false)} className="w-full flex items-center justify-center py-2.5 text-[var(--text-muted)] hover:text-[var(--em-600)] transition-all" aria-label="Expand sidebar">
          <ChevronRight size={14} />
        </button>
      )}

      {/* Section label */}
      {!collapsed && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ delay: 0.05 }} className="px-4 pt-4 pb-1">
          <span className="label">Menu</span>
        </motion.div>
      )}

      {/* Nav items */}
      <div className="flex-1 overflow-y-auto py-1.5 space-y-0.5">
        {NAV_ITEMS.map((item) => {
          const Icon     = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')
          return (
            <Link key={item.id} href={item.href} className={clsx('sidebar-nav-item', { active: isActive })} title={collapsed ? item.label : undefined}>
              <motion.div whileHover={{ scale: 1.08 }} whileTap={{ scale: 0.94 }} className="flex-shrink-0">
                <Icon size={16} strokeWidth={isActive ? 2.5 : 2} className={isActive ? 'text-[var(--em-600)]' : ''} />
              </motion.div>
              {!collapsed && (
                <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} transition={{ duration: 0.1 }} className="min-w-0">
                  <div className="truncate text-[0.875rem]">{item.label}</div>
                  {!isActive && <div className="text-[11px] text-[var(--text-muted)] truncate leading-tight">{item.desc}</div>}
                </motion.div>
              )}
              {isActive && !collapsed && (
                <motion.div layoutId="active-dot" className="ml-auto w-1.5 h-1.5 rounded-full bg-[var(--em-500)] flex-shrink-0" />
              )}
            </Link>
          )
        })}
      </div>

      {/* Bottom: user + sign out */}
      <div className="border-t border-[var(--border)] p-2 space-y-0.5">
        <style>{`
          @keyframes adminAvatarPulse {
            0% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0.7); }
            70% { box-shadow: 0 0 0 8px rgba(16, 185, 129, 0); }
            100% { box-shadow: 0 0 0 0 rgba(16, 185, 129, 0); }
          }
          .admin-sidebar-pulse {
            animation: adminAvatarPulse 1.8s infinite;
          }
        `}</style>

        <Link href="/settings" className={clsx('sidebar-nav-item', { active: pathname === '/settings' })} title={collapsed ? 'Settings' : undefined}>
          <Settings size={15} strokeWidth={1.75} className="flex-shrink-0" />
          {!collapsed && <span className="truncate text-sm">Settings</span>}
        </Link>

        {isAdmin && (
          <button
            onClick={() => setShowApprovalsModal(true)}
            className="sidebar-nav-item w-full text-left flex items-center gap-2.5"
            title={collapsed ? 'Pending Approvals' : undefined}
            style={{ border: 'none', background: 'none', cursor: 'pointer', outline: 'none' }}
          >
            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
              <ShieldAlert
                size={15}
                strokeWidth={1.75}
                className={clsx('flex-shrink-0', {
                  'text-[#10b981]': pendingCount > 0,
                  'text-[var(--text-muted)]': pendingCount === 0,
                })}
              />
              {pendingCount > 0 && (
                <span className="admin-sidebar-pulse" style={{
                  position: 'absolute',
                  inset: 0,
                  borderRadius: '50%',
                  pointerEvents: 'none',
                }} />
              )}
              {collapsed && pendingCount > 0 && (
                <span style={{
                  position: 'absolute',
                  top: '-4px',
                  right: '-4px',
                  width: '6px',
                  height: '6px',
                  background: '#dc2626',
                  borderRadius: '50%',
                }} />
              )}
            </div>
            {!collapsed && <span className="truncate text-sm">Pending Approvals</span>}
            {!collapsed && pendingCount > 0 && (
              <span style={{
                marginLeft: 'auto',
                background: '#dc2626',
                color: '#fff',
                fontSize: '10px',
                fontWeight: 700,
                borderRadius: '50%',
                width: '16px',
                height: '16px',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}>
                {pendingCount}
              </span>
            )}
          </button>
        )}

        <button onClick={handleSignOut} className="sidebar-nav-item w-full text-left group hover:!text-red-600 hover:!bg-red-50">
          <LogOut size={15} strokeWidth={1.75} className="flex-shrink-0 text-[var(--text-muted)] group-hover:text-red-500" />
          {!collapsed && <span className="truncate text-sm">Sign out</span>}
        </button>

        {!collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 mt-1 rounded-lg bg-[var(--bg-surface2)]">
            <div className="w-7 h-7 rounded-full bg-[var(--em-100)] border border-[var(--border-accent)] flex items-center justify-center flex-shrink-0 overflow-hidden">
              {avatarUrl ? (
                <img src={avatarUrl} alt={displayName} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <span className="text-[11px] font-bold text-[var(--em-700)]">{initials}</span>
              )}
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[var(--text-primary)] truncate">{displayName}</div>
              {userEmail && <div className="text-[10px] text-[var(--text-muted)] truncate">{userEmail}</div>}
            </div>
          </div>
        )}
      </div>

      {/* Pending Approvals Modal for Desktop */}
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
    </motion.nav>
  )
}

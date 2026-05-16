'use client'

import Link from 'next/link'
import { usePathname, useRouter } from 'next/navigation'
import { motion, AnimatePresence } from 'framer-motion'
import {
  Home, BookOpen, Dumbbell, GraduationCap, Vault,
  ChevronLeft, ChevronRight, Settings, LogOut,
} from 'lucide-react'
import { useState } from 'react'
import { clsx } from 'clsx'
import { createClient } from '@/lib/supabase/client'
import { MayazLogo } from '@/components/MayazLogo'

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
}

export default function Sidebar({ userName, userEmail }: SidebarProps) {
  const pathname  = usePathname()
  const router    = useRouter()
  const [collapsed, setCollapsed] = useState(false)

  const supabase = createClient()

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
        <Link href="/settings" className={clsx('sidebar-nav-item', { active: pathname === '/settings' })} title={collapsed ? 'Settings' : undefined}>
          <Settings size={15} strokeWidth={1.75} className="flex-shrink-0" />
          {!collapsed && <span className="truncate text-sm">Settings</span>}
        </Link>

        <button onClick={handleSignOut} className="sidebar-nav-item w-full text-left group hover:!text-red-600 hover:!bg-red-50">
          <LogOut size={15} strokeWidth={1.75} className="flex-shrink-0 text-[var(--text-muted)] group-hover:text-red-500" />
          {!collapsed && <span className="truncate text-sm">Sign out</span>}
        </button>

        {!collapsed && (
          <div className="flex items-center gap-2.5 px-3 py-2.5 mt-1 rounded-lg bg-[var(--bg-surface2)]">
            <div className="w-7 h-7 rounded-full bg-[var(--em-100)] border border-[var(--border-accent)] flex items-center justify-center flex-shrink-0">
              <span className="text-[11px] font-bold text-[var(--em-700)]">{initials}</span>
            </div>
            <div className="min-w-0">
              <div className="text-xs font-semibold text-[var(--text-primary)] truncate">{displayName}</div>
              {userEmail && <div className="text-[10px] text-[var(--text-muted)] truncate">{userEmail}</div>}
            </div>
          </div>
        )}
      </div>
    </motion.nav>
  )
}

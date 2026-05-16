'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Home, BookOpen, Dumbbell, GraduationCap, Vault } from 'lucide-react'
import { motion } from 'framer-motion'

const ITEMS = [
  { id: 'home',      href: '/home',      icon: Home,          label: 'Home' },
  { id: 'learning',  href: '/learning',  icon: BookOpen,      label: 'Learn' },
  { id: 'fitness',   href: '/fitness',   icon: Dumbbell,      label: 'Fitness' },
  { id: 'academics', href: '/academics', icon: GraduationCap, label: 'Academics' },
  { id: 'vault',     href: '/vault',     icon: Vault,         label: 'Vault' },
]

export function BottomNav() {
  const pathname = usePathname()

  return (
    /* Only visible on mobile */
    <div
      className="md:hidden"
      style={{
        position: 'fixed',
        bottom: '20px',
        left: '50%',
        transform: 'translateX(-50%)',
        zIndex: 90,
        width: 'calc(100% - 32px)',
        maxWidth: '380px',
      }}
    >
      <nav
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-around',
          background: 'rgba(255,255,255,0.95)',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          borderRadius: '28px',
          padding: '8px 6px',
          boxShadow: '0 8px 40px rgba(0,0,0,0.12), 0 0 0 1px rgba(0,0,0,0.06)',
        }}
      >
        {ITEMS.map((item) => {
          const Icon     = item.icon
          const isActive = pathname === item.href || pathname.startsWith(item.href + '/')

          return (
            <Link
              key={item.id}
              href={item.href}
              style={{
                position: 'relative',
                display: 'flex',
                flexDirection: 'column',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '3px',
                padding: '8px 12px',
                borderRadius: '20px',
                textDecoration: 'none',
                minWidth: '56px',
                background: isActive ? 'var(--em-50)' : 'transparent',
                transition: 'background 0.2s',
              }}
            >
              <Icon
                size={20}
                strokeWidth={isActive ? 2.5 : 2}
                color={isActive ? 'var(--em-600)' : 'var(--text-muted)'}
              />
              <span
                style={{
                  fontSize: '9px',
                  fontWeight: isActive ? 700 : 500,
                  letterSpacing: '0.02em',
                  color: isActive ? 'var(--em-600)' : 'var(--text-muted)',
                }}
              >
                {item.label}
              </span>

              {isActive && (
                <motion.div
                  layoutId="nav-indicator"
                  style={{
                    position: 'absolute',
                    bottom: '4px',
                    left: '50%',
                    transform: 'translateX(-50%)',
                    width: '4px',
                    height: '4px',
                    borderRadius: '50%',
                    background: 'var(--em-500)',
                  }}
                  transition={{ type: 'spring', stiffness: 500, damping: 35 }}
                />
              )}
            </Link>
          )
        })}
      </nav>
    </div>
  )
}

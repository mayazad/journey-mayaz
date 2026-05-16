'use client'

import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'
import {
  BookOpen,
  Dumbbell,
  GraduationCap,
  Vault,
  ArrowRight,
  Sparkles,
  Activity,
} from 'lucide-react'
import { useEffect, useState } from 'react'

const PILLARS = [
  {
    id: 'learning',
    label: 'Learning',
    href: '/learning',
    icon: BookOpen,
    description: 'Roadmaps & modules',
  },
  {
    id: 'fitness',
    label: 'Fitness',
    href: '/fitness',
    icon: Dumbbell,
    description: 'Gym routines & splits',
  },
  {
    id: 'academics',
    label: 'Academics',
    href: '/academics',
    icon: GraduationCap,
    description: 'Deadlines & tasks',
  },
  {
    id: 'vault',
    label: 'Vault',
    href: '/vault',
    icon: Vault,
    description: 'Private metadata',
  },
]

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07, delayChildren: 0.15 } },
}

const itemVariants = {
  hidden: { opacity: 0, y: 14 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

function LiveClock() {
  const [time, setTime] = useState('')
  const [date, setDate] = useState('')

  useEffect(() => {
    function tick() {
      const now = new Date()
      setTime(
        now.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false })
      )
      setDate(
        now.toLocaleDateString('en-US', {
          weekday: 'long',
          month: 'long',
          day: 'numeric',
          year: 'numeric',
        })
      )
    }
    tick()
    const id = setInterval(tick, 1000)
    return () => clearInterval(id)
  }, [])

  return { time, date }
}

export function DashboardClient({ briefing }: { briefing: string }) {
  const { time, date } = LiveClock()

  return (
    <main className="main-content flex-1 flex flex-col">
      {/* Top bar */}
      <motion.header
        initial={{ opacity: 0, y: -8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.3 }}
        className="flex items-center justify-between px-8 py-5 border-b border-[var(--border)]"
      >
        <div>
          <h1 className="heading-2 text-[var(--text-primary)]">Dashboard</h1>
          <p className="text-[var(--text-muted)] text-xs mt-0.5">{date}</p>
        </div>
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg border border-[var(--border)] surface">
            <Activity size={12} className="text-[var(--text-muted)]" />
            <span className="mono text-[var(--text-secondary)] text-xs">{time}</span>
          </div>
          <div className="w-8 h-8 rounded-full bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center">
            <span className="text-xs font-semibold text-[var(--text-secondary)]">U</span>
          </div>
        </div>
      </motion.header>

      {/* Body */}
      <div className="flex-1 px-8 py-8 overflow-y-auto">
        <div className="max-w-5xl mx-auto space-y-10">

          {/* AI Briefing Section */}
          <motion.section
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5, ease: 'easeOut' }}
          >
            <div className="flex items-center gap-2 mb-4">
              <Sparkles size={14} className="text-[var(--text-muted)]" />
              <p className="label">AI Briefing</p>
            </div>

            <div className="card">
              <div className="prose-lifeos">
                <ReactMarkdown
                  components={{
                    h1: ({ children }) => (
                      <h1 className="text-lg font-semibold text-[var(--text-primary)] mb-3 tracking-tight">
                        {children}
                      </h1>
                    ),
                    h2: ({ children }) => (
                      <h2 className="text-base font-semibold text-[var(--text-primary)] mb-2 mt-4 tracking-tight">
                        {children}
                      </h2>
                    ),
                    h3: ({ children }) => (
                      <h3 className="text-sm font-semibold text-[var(--text-secondary)] mb-1.5 mt-3">
                        {children}
                      </h3>
                    ),
                    p: ({ children }) => (
                      <p className="text-sm text-[var(--text-secondary)] mb-3 leading-relaxed">
                        {children}
                      </p>
                    ),
                    ul: ({ children }) => (
                      <ul className="space-y-1.5 mb-3">{children}</ul>
                    ),
                    li: ({ children }) => (
                      <li className="flex items-start gap-2 text-sm text-[var(--text-secondary)]">
                        <span className="w-1 h-1 rounded-full bg-[var(--em-600)] mt-2 flex-shrink-0" />
                        <span className="leading-relaxed">{children}</span>
                      </li>
                    ),
                    strong: ({ children }) => (
                      <strong className="font-semibold text-[var(--text-primary)]">{children}</strong>
                    ),
                    em: ({ children }) => (
                      <em className="text-[var(--text-tertiary)] not-italic">{children}</em>
                    ),
                    code: ({ children }) => (
                      <code className="mono text-xs px-1.5 py-0.5 rounded bg-[var(--bg-base)] border border-[var(--border)] text-[var(--text-secondary)]">
                        {children}
                      </code>
                    ),
                    hr: () => (
                      <hr className="border-[var(--border)] my-4" />
                    ),
                  }}
                >
                  {briefing}
                </ReactMarkdown>
              </div>
            </div>
          </motion.section>

          {/* Pillars Grid */}
          <section>
            <p className="label mb-4">Pillars</p>
            <motion.div
              variants={containerVariants}
              initial="hidden"
              animate="visible"
              className="grid grid-cols-1 md:grid-cols-2 gap-4"
            >
              {PILLARS.map((pillar) => {
                const Icon = pillar.icon
                return (
                  <motion.div key={pillar.id} variants={itemVariants}>
                    <Link href={pillar.href} className="block group">
                      <motion.div
                        className="card h-full"
                        whileHover={{ scale: 1.005 }}
                        whileTap={{ scale: 0.995 }}
                        transition={{ duration: 0.15 }}
                      >
                        <div className="flex items-start justify-between mb-4">
                          <div className="w-10 h-10 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center group-hover:border-[var(--border-subtle)] transition-colors">
                            <Icon size={18} className="text-[var(--text-secondary)]" strokeWidth={1.75} />
                          </div>
                          <motion.div className="opacity-0 group-hover:opacity-100 transition-opacity">
                            <ArrowRight size={14} className="text-[var(--text-muted)]" />
                          </motion.div>
                        </div>

                        <h3 className="heading-3 text-[var(--text-primary)] mb-1">{pillar.label}</h3>
                        <p className="text-[var(--text-tertiary)] text-xs leading-relaxed">
                          {pillar.description}
                        </p>
                      </motion.div>
                    </Link>
                  </motion.div>
                )
              })}
            </motion.div>
          </section>

          {/* Footer */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.7 }}
            className="pt-6 border-t border-[var(--border)] flex items-center justify-between"
          >
            <p className="text-[11px] text-[var(--text-muted)] mono">life-os / v0.1.0</p>
            <p className="text-[11px] text-[var(--text-muted)]">All data is private.</p>
          </motion.div>
        </div>
      </div>
    </main>
  )
}

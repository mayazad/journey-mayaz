'use client'

import { motion } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'
import { Dumbbell, GraduationCap, Clock, ArrowRight, Sparkles, Tag, ChevronRight } from 'lucide-react'
import { useEffect, useState } from 'react'
import { HomeChatPanel } from '@/components/HomeChatPanel'

type DayPlan = {
  id: string; day_of_week: string; day_type: string
  target_muscle_groups: string[]
  exercises: { name: string; sets?: string; reps?: string }[]
}

type Task = {
  id: string; title: string; type: string; due_date: string; status: string
}

function useClock() {
  const [date, setDate] = useState('')
  useEffect(() => {
    function tick() {
      const now = new Date()
      setDate(now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' }))
    }
    tick()
    const id = setInterval(tick, 60_000)
    return () => clearInterval(id)
  }, [])
  return { date }
}

function formatRelativeDate(due_date: string) {
  const diffMs   = new Date(due_date).getTime() - Date.now()
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays <= 0) return 'Due today'
  if (diffDays === 1) return 'Due tomorrow'
  return `In ${diffDays}d`
}


const stagger = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.1, delayChildren: 0.05 } },
}
const fadeUp = {
  hidden: { opacity: 0, y: 16 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.4, ease: 'easeOut' as const } },
}

export function HomeClient({
  briefingMarkdown,
  userName,
  todayPlan,
  urgentTasks,
  contextSnapshot,
}: {
  briefingMarkdown: string
  userName: string
  todayPlan: DayPlan | null
  urgentTasks: Task[]
  contextSnapshot: string
}) {
  const { date } = useClock()

  return (
    <motion.div
      variants={stagger}
      initial="hidden"
      animate="visible"
      style={{ minHeight: '100vh', backgroundColor: '#f0f0f0' }}
    >
      {/* ─── Hero Greeting ─────────────────────────────────── */}
      <motion.div
        variants={fadeUp}
        style={{ padding: '24px 20px 12px', backgroundColor: '#f0f0f0' }}
      >
        <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>{date}</p>
        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2, color: 'var(--text-primary)' }}>
          Welcome back,{' '}
          <span style={{ color: 'var(--em-600)' }}>{userName}</span>
        </h1>
      </motion.div>

      {/* ─── Content ───────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '0 16px 120px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* AI Briefing Card */}
        <motion.div variants={fadeUp}>
          <SectionLabel icon={<Sparkles size={12} />} label="Daily Briefing" />
          <div
            style={{
              background: '#ffffff',
              borderRadius: '20px',
              padding: '20px',
              marginTop: '10px',
              boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
            }}
          >
            <ReactMarkdown
              components={{
                h1: ({ children }) => (
                  <h2 style={{ fontSize: '14px', fontWeight: 700, color: 'var(--em-700)', marginTop: '20px', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ display: 'inline-block', width: '3px', height: '14px', background: 'var(--em-400)', borderRadius: '2px', flexShrink: 0 }} />
                    {children}
                  </h2>
                ),
                h2: ({ children }) => (
                  <h3 style={{ fontSize: '13px', fontWeight: 700, color: 'var(--em-700)', marginTop: '16px', marginBottom: '4px', display: 'flex', alignItems: 'center', gap: '6px' }}>
                    <span style={{ display: 'inline-block', width: '3px', height: '12px', background: 'var(--em-300)', borderRadius: '2px', flexShrink: 0 }} />
                    {children}
                  </h3>
                ),
                h3: ({ children }) => (
                  <h4 style={{ fontSize: '12px', fontWeight: 700, color: 'var(--text-secondary)', marginTop: '12px', marginBottom: '4px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{children}</h4>
                ),
                p: ({ children }) => (
                  <p style={{ fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.65, marginBottom: '8px' }}>{children}</p>
                ),
                ul: ({ children }) => <ul style={{ margin: '6px 0', display: 'flex', flexDirection: 'column', gap: '6px', listStyle: 'none' }}>{children}</ul>,
                li: ({ children }) => (
                  <li style={{ display: 'flex', alignItems: 'flex-start', gap: '10px', fontSize: '13.5px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>
                    <span style={{ marginTop: '7px', width: '5px', height: '5px', borderRadius: '50%', background: 'var(--em-400)', flexShrink: 0 }} />
                    <span>{children}</span>
                  </li>
                ),
                strong: ({ children }) => (
                  <strong style={{ fontWeight: 700, color: 'var(--text-primary)' }}>{children}</strong>
                ),
              }}
            >
              {briefingMarkdown}
            </ReactMarkdown>
          </div>
        </motion.div>

        {/* Today's Workout */}
        <motion.div variants={fadeUp}>
          <SectionLabel
            icon={<Dumbbell size={12} />}
            label="Today's Workout"
            action={<SectionAction href="/fitness" label="View plan" />}
          />
          {todayPlan ? (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                overflow: 'hidden',
                marginTop: '10px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
              }}
            >
              <div className="px-5 py-4 border-b border-[var(--border)]">
                <div className="flex items-center gap-2">
                  <span className="text-[11px] font-semibold px-2.5 py-1 rounded-full bg-[var(--em-50)] text-[var(--em-700)] border border-[var(--em-200)]">
                    {todayPlan.day_of_week}
                  </span>
                  <span className="text-[13px] font-semibold text-[var(--text-primary)]">{todayPlan.day_type} Day</span>
                </div>
                {todayPlan.target_muscle_groups.length > 0 && (
                  <div className="flex items-center gap-1.5 flex-wrap mt-2">
                    {todayPlan.target_muscle_groups.map((m) => (
                      <span key={m} className="text-[10px] px-2 py-0.5 rounded-full bg-[var(--bg-surface2)] text-[var(--text-tertiary)]">{m}</span>
                    ))}
                  </div>
                )}
              </div>
              {todayPlan.exercises.length > 0 && (
                <ul>
                  {todayPlan.exercises.slice(0, 5).map((ex, i) => (
                    <li key={i} className={`flex items-center gap-3 px-5 py-3.5 ${i < todayPlan.exercises.length - 1 && i < 4 ? 'border-b border-[var(--border)]' : ''}`}>
                      <span className="w-6 h-6 rounded-full bg-[var(--em-50)] border border-[var(--em-200)] flex items-center justify-center text-[10px] font-bold text-[var(--em-700)] flex-shrink-0">{i + 1}</span>
                      <span className="flex-1 text-[13px] text-[var(--text-primary)] truncate">{ex.name}</span>
                      {ex.sets && ex.reps && (
                        <span className="text-[11px] font-mono text-[var(--text-muted)]">{ex.sets}×{ex.reps}</span>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          ) : (
            <EmptyCard
              icon={<Dumbbell size={28} color="var(--border-2)" strokeWidth={1.5} />}
              label="No plan for today"
              action={<Link href="/fitness" style={{ fontSize: '13px', color: 'var(--em-600)', fontWeight: 600 }}>Set up weekly plan →</Link>}
            />
          )}
        </motion.div>

        {/* This Week's Tasks */}
        <motion.div variants={fadeUp}>
          <SectionLabel
            icon={<GraduationCap size={12} />}
            label="This Week's Tasks"
            action={<SectionAction href="/academics" label="All tasks" />}
          />
          {urgentTasks.length > 0 ? (
            <div
              style={{
                background: '#ffffff',
                borderRadius: '20px',
                overflow: 'hidden',
                marginTop: '10px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
              }}
            >
              {urgentTasks.map((task, i) => {
                const diff     = new Date(task.due_date).getTime() - Date.now()
                const isUrgent = diff < 24 * 60 * 60 * 1000
                return (
                  <div key={task.id} className={`flex items-center gap-3 px-5 py-4 ${i < urgentTasks.length - 1 ? 'border-b border-[var(--border)]' : ''}`}>
                    <span className={`w-2 h-2 rounded-full flex-shrink-0 ${isUrgent ? 'bg-amber-400' : 'bg-[var(--em-400)]'}`} />
                    <div className="flex-1 min-w-0">
                      <p className="text-[13.5px] font-medium text-[var(--text-primary)] truncate">{task.title}</p>
                      <p className="text-[11px] text-[var(--text-muted)] mt-0.5">{task.type}</p>
                    </div>
                    <span className={`text-[11px] font-semibold mono flex-shrink-0 ${isUrgent ? 'text-amber-600' : 'text-[var(--text-tertiary)]'}`}>
                      {formatRelativeDate(task.due_date)}
                    </span>
                  </div>
                )
              })}
            </div>
          ) : (
            <EmptyCard
              icon={<GraduationCap size={28} color="var(--border-2)" strokeWidth={1.5} />}
              label="No tasks due this week"
              action={<Link href="/academics" style={{ fontSize: '13px', color: 'var(--em-600)', fontWeight: 600 }}>Add a task →</Link>}
            />
          )}
        </motion.div>

      </div>

      {/* Floating AI Chat */}
      <HomeChatPanel contextSnapshot={contextSnapshot} />

    </motion.div>
  )
}

/* ─── Helpers ─────────────────────────────────────────────── */

function SectionLabel({
  icon,
  label,
  action,
}: {
  icon: React.ReactNode
  label: string
  action?: React.ReactNode
}) {
  return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0 4px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
        <span style={{ color: 'var(--em-500)', display: 'flex' }}>{icon}</span>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)' }}>{label}</span>
      </div>
      {action}
    </div>
  )
}

function SectionAction({ href, label }: { href: string; label: string }) {
  return (
    <Link href={href} style={{ display: 'flex', alignItems: 'center', gap: '2px', fontSize: '12px', fontWeight: 700, color: 'var(--em-600)', textDecoration: 'none' }}>
      {label} <ChevronRight size={13} />
    </Link>
  )
}

function EmptyCard({ icon, label, action }: { icon: React.ReactNode; label: string; action?: React.ReactNode }) {
  return (
    <div
      style={{
        background: '#ffffff',
        borderRadius: '20px',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '40px 20px',
        textAlign: 'center',
        marginTop: '10px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ marginBottom: '12px' }}>{icon}</div>
      <p style={{ fontSize: '13px', color: 'var(--text-tertiary)', fontWeight: 500 }}>{label}</p>
      {action && <div style={{ marginTop: '8px' }}>{action}</div>}
    </div>
  )
}

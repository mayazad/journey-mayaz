'use client'

import { motion, AnimatePresence } from 'framer-motion'
import ReactMarkdown from 'react-markdown'
import Link from 'next/link'
import {
  Dumbbell, GraduationCap, Sparkles, ChevronRight,
  X, Clock, AlertTriangle, BookOpen, Monitor, Swords, FileText, FolderKanban, MoreHorizontal,
} from 'lucide-react'
import { useEffect, useState, useTransition } from 'react'
import { HomeChatPanel } from '@/components/HomeChatPanel'
import { generateDailyBriefing } from '@/actions/ai'

type DayPlan = {
  id: string; day_of_week: string; day_type: string
  target_muscle_groups: string[]
  exercises: { name: string; sets?: string; reps?: string; rest?: string }[]
  warmup?: string
}

type Task = {
  id: string; title: string; type: string; due_date: string; status: string
}

const TASK_TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string }> = {
  assignment:   { icon: BookOpen,       label: 'Assignment' },
  presentation: { icon: Monitor,        label: 'Presentation' },
  hackathon:    { icon: Swords,         label: 'Hackathon' },
  exam:         { icon: FileText,       label: 'Exam' },
  project:      { icon: FolderKanban,   label: 'Project' },
  other:        { icon: MoreHorizontal, label: 'Other' },
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
  if (diffMs <= 0) return 'Due today'
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays  = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return `In ${diffHours}h`
  if (diffDays === 1) {
    const remHours = diffHours - 24
    return remHours > 0 ? `In 1d ${remHours}h` : 'Tomorrow'
  }
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
  initialUserName,
  todayPlan,
  urgentTasks,
  contextSnapshot,
}: {
  initialUserName: string
  todayPlan: DayPlan | null
  urgentTasks: Task[]
  contextSnapshot: string
}) {
  const { date } = useClock()
  const [selectedWorkout, setSelectedWorkout] = useState<DayPlan | null>(null)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  // Client-side daily briefing loader
  const [briefing, setBriefing] = useState<string | null>(null)
  const [userName, setUserName] = useState(initialUserName)
  const [loadingBriefing, setLoadingBriefing] = useState(true)

  useEffect(() => {
    let active = true
    async function loadBriefing() {
      try {
        const res = await generateDailyBriefing()
        if (active) {
          setBriefing(res.markdown)
          setUserName(res.userName)
        }
      } catch (e) {
        console.error('Failed to load daily briefing:', e)
        if (active) {
          setBriefing('## Ready when you are\n\nCould not fetch personalized daily briefing. Try refreshing the page.')
        }
      } finally {
        if (active) {
          setLoadingBriefing(false)
        }
      }
    }
    loadBriefing()
    return () => { active = false }
  }, [])

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
        style={{
          padding: '24px 20px 12px',
          backgroundColor: '#f0f0f0',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'flex-start',
        }}
      >
        <div>
          <p style={{ fontSize: '13px', fontWeight: 500, color: 'var(--text-muted)', marginBottom: '6px' }}>{date}</p>
          <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', lineHeight: 1.2, color: 'var(--text-primary)' }}>
            Welcome back,{' '}
            <span style={{ color: 'var(--em-600)' }}>{userName}</span>
          </h1>
        </div>


      </motion.div>

      {/* ─── Content ───────────────────────────────────────── */}
      <div style={{ flex: 1, padding: '0 16px 180px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

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
            {loadingBriefing ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', animation: 'pulse 1.8s cubic-bezier(0.4, 0, 0.6, 1) infinite', padding: '4px 0' }}>
                <style dangerouslySetInnerHTML={{ __html: `
                  @keyframes pulse {
                    0%, 100% { opacity: 0.35; }
                    50% { opacity: 0.85; }
                  }
                ` }} />
                <div style={{ width: '35%', height: '16px', borderRadius: '6px', background: 'var(--border-2)' }} />
                <div style={{ width: '100%', height: '12px', borderRadius: '6px', background: 'var(--border)' }} />
                <div style={{ width: '90%', height: '12px', borderRadius: '6px', background: 'var(--border)' }} />
                <div style={{ width: '75%', height: '12px', borderRadius: '6px', background: 'var(--border)' }} />
              </div>
            ) : (
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
                {briefing ?? 'Ready for your daily brief. Generate one using the AI Panel below.'}
              </ReactMarkdown>
            )}
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
            <button
              onClick={() => setSelectedWorkout(todayPlan)}
              style={{
                width: '100%', textAlign: 'left', cursor: 'pointer', background: 'none', border: 'none', padding: 0,
                marginTop: '10px',
              }}
            >
              <div style={{
                background: '#ffffff', borderRadius: '20px', overflow: 'hidden',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
              }}>
                {/* Day header */}
                <div style={{ padding: '16px 20px', borderBottom: '1px solid var(--border)' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '8px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{
                        fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '99px',
                        background: 'var(--em-50)', color: 'var(--em-700)', border: '1px solid var(--em-200)',
                      }}>
                        {todayPlan.day_of_week}
                      </span>
                      <span style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
                        {todayPlan.day_type} Day
                      </span>
                    </div>
                    {todayPlan.warmup && (
                      <span style={{
                        fontSize: '10px', fontWeight: 700, color: '#f59e0b', background: '#fef3c7',
                        padding: '2px 8px', borderRadius: '99px', border: '1px solid #fde68a',
                        display: 'flex', alignItems: 'center', gap: '3px'
                      }}>
                        🔥 Warmup
                      </span>
                    )}
                  </div>
                  {(todayPlan.target_muscle_groups ?? []).length > 0 && (
                    <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', marginTop: '10px' }}>
                      {(todayPlan.target_muscle_groups ?? []).map((m) => (
                        <span key={m} style={{
                          fontSize: '10px', padding: '2px 8px', borderRadius: '99px',
                          background: 'var(--bg-surface2)', color: 'var(--text-tertiary)',
                          border: '1px solid var(--border)',
                        }}>{m}</span>
                      ))}
                    </div>
                  )}
                </div>

                {/* Exercises preview (max 3) */}
                {(todayPlan.exercises ?? []).length > 0 && (
                  <div>
                    {(todayPlan.exercises ?? []).slice(0, 3).map((ex, i) => (
                      <div key={i} style={{
                        display: 'flex', alignItems: 'center', gap: '12px',
                        padding: '12px 20px',
                        borderBottom: i < Math.min((todayPlan.exercises ?? []).length, 3) - 1 ? '1px solid var(--border)' : 'none',
                      }}>
                        <span style={{
                          width: '24px', height: '24px', borderRadius: '50%', flexShrink: 0,
                          background: 'var(--em-50)', border: '1px solid var(--em-200)',
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          fontSize: '10px', fontWeight: 700, color: 'var(--em-700)',
                        }}>{i + 1}</span>
                        <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)', fontWeight: 500, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</span>
                        {(ex.sets || ex.reps) && (
                          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px', flexShrink: 0 }}>
                            {ex.sets && ex.reps ? (
                              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', fontWeight: 600 }}>{ex.sets}×{ex.reps}</span>
                            ) : ex.reps ? (
                              <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', fontWeight: 600 }}>{ex.reps}</span>
                            ) : null}
                            {ex.rest && (
                              <span style={{ fontSize: '9px', color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>⏱️ {ex.rest}</span>
                            )}
                          </div>
                        )}
                      </div>
                    ))}
                    {(todayPlan.exercises ?? []).length > 3 && (
                      <div style={{ padding: '10px 20px', fontSize: '12px', color: 'var(--em-600)', fontWeight: 600 }}>
                        +{(todayPlan.exercises ?? []).length - 3} more exercises →
                      </div>
                    )}
                  </div>
                )}
              </div>
            </button>
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
            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginTop: '10px' }}>
              {urgentTasks.map((task) => {
                const diff     = new Date(task.due_date).getTime() - Date.now()
                const isUrgent = diff < 24 * 60 * 60 * 1000
                const typeKey  = task.type?.toLowerCase().replace(/\s+/g, '') ?? 'other'
                const { icon: TypeIcon } = TASK_TYPE_CONFIG[typeKey] ?? TASK_TYPE_CONFIG['other']
                return (
                  <button
                    key={task.id}
                    onClick={() => setSelectedTask(task)}
                    style={{
                      width: '100%', textAlign: 'left', cursor: 'pointer', background: 'none', border: 'none', padding: 0,
                    }}
                  >
                    <div style={{
                      background: '#ffffff', borderRadius: '16px', padding: '14px 16px',
                      border: isUrgent ? '1px solid var(--em-700)' : '1px solid var(--border)',
                      boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
                      display: 'flex', alignItems: 'center', gap: '12px',
                    }}>
                      <div style={{
                        width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
                        background: isUrgent ? 'var(--em-50)' : 'var(--bg-elevated)',
                        border: '1px solid var(--border)',
                        display: 'flex', alignItems: 'center', justifyContent: 'center',
                      }}>
                        <TypeIcon size={14} color={isUrgent ? 'var(--em-700)' : 'var(--text-muted)'} />
                      </div>
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p style={{ fontSize: '13.5px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{task.title}</p>
                        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px', fontWeight: 500 }}>{task.type}</p>
                      </div>
                      <span style={{
                        fontSize: '11px', fontWeight: 700, fontFamily: 'monospace', flexShrink: 0,
                        padding: '3px 8px', borderRadius: '8px',
                        background: isUrgent ? 'var(--em-800)' : 'var(--bg-surface2)',
                        color: isUrgent ? 'var(--em-300)' : 'var(--text-secondary)',
                      }}>
                        {formatRelativeDate(task.due_date)}
                      </span>
                    </div>
                  </button>
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

      {/* Workout Bottom Sheet */}
      <AnimatePresence>
        {selectedWorkout && (
          <WorkoutSheet plan={selectedWorkout} onClose={() => setSelectedWorkout(null)} />
        )}
      </AnimatePresence>

      {/* Task Bottom Sheet */}
      <AnimatePresence>
        {selectedTask && (
          <HomeTaskSheet task={selectedTask} onClose={() => setSelectedTask(null)} />
        )}
      </AnimatePresence>



    </motion.div>
  )
}

/* ─── Workout Bottom Sheet ─────────────────────────────────── */
function WorkoutSheet({ plan, onClose }: { plan: DayPlan; onClose: () => void }) {
  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200 }}
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#f8f8f8', borderRadius: '24px 24px 0 0',
          zIndex: 201, maxHeight: '90vh',
          display: 'flex', flexDirection: 'column',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        }}
      >
        <div style={{ width: '36px', height: '4px', background: '#d1d5db', borderRadius: '99px', margin: '12px auto' }} />
        <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e5e5' }}>
          <div>
            <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)' }}>{plan.day_type} Day</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px' }}>{plan.day_of_week}</p>
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-surface2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="var(--text-muted)" />
          </button>
        </div>

        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          {/* Warmup Section */}
          {plan.warmup && (
            <div style={{
              background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '16px',
              padding: '14px 16px', marginBottom: '16px'
            }}>
              <p style={{ fontSize: '11px', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: '6px', display: 'flex', alignItems: 'center', gap: '4px' }}>
                🔥 WARM-UP INSTRUCTIONS
              </p>
              <p style={{ fontSize: '13px', color: '#78350f', lineHeight: 1.5, margin: 0, whiteSpace: 'pre-wrap' }}>
                {plan.warmup}
              </p>
            </div>
          )}

          {(plan.target_muscle_groups ?? []).length > 0 && (
            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '20px' }}>
              {(plan.target_muscle_groups ?? []).map((m) => (
                <span key={m} style={{
                  fontSize: '12px', fontWeight: 600, padding: '4px 12px', borderRadius: '99px',
                  background: 'var(--em-50)', color: 'var(--em-700)', border: '1px solid var(--em-200)',
                }}>{m}</span>
              ))}
            </div>
          )}

          <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
            {(plan.exercises ?? []).map((ex, i) => (
              <div key={i} style={{
                display: 'flex', alignItems: 'center', gap: '14px', padding: '14px 20px',
                borderBottom: i < (plan.exercises ?? []).length - 1 ? '1px solid var(--border)' : 'none',
              }}>
                <span style={{
                  width: '28px', height: '28px', borderRadius: '50%', flexShrink: 0,
                  background: 'var(--em-50)', border: '1px solid var(--em-200)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: '11px', fontWeight: 700, color: 'var(--em-700)',
                }}>{i + 1}</span>
                <span style={{ flex: 1, fontSize: '14px', color: 'var(--text-primary)', fontWeight: 600 }}>{ex.name}</span>
                {(ex.sets || ex.reps) && (
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '2px', flexShrink: 0 }}>
                    {ex.sets && ex.reps ? (
                      <span style={{
                        fontSize: '12px', fontFamily: 'monospace', fontWeight: 700,
                        padding: '3px 8px', borderRadius: '8px',
                        background: 'var(--bg-surface2)', color: 'var(--text-secondary)',
                      }}>{ex.sets}×{ex.reps}</span>
                    ) : ex.reps ? (
                      <span style={{
                        fontSize: '12px', fontFamily: 'monospace', fontWeight: 700,
                        padding: '3px 8px', borderRadius: '8px',
                        background: 'var(--bg-surface2)', color: 'var(--text-secondary)',
                      }}>{ex.reps}</span>
                    ) : null}
                    {ex.rest && (
                      <span style={{ fontSize: '10px', color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '2px' }}>
                        ⏱️ {ex.rest}
                      </span>
                    )}
                  </div>
                )}
              </div>
            ))}
          </div>

          <Link
            href="/fitness"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              marginTop: '16px', padding: '14px', borderRadius: '16px',
              background: 'var(--em-500)', color: '#fff',
              fontSize: '14px', fontWeight: 700, textDecoration: 'none',
            }}
          >
            <Dumbbell size={16} /> View Full Fitness Plan
          </Link>
        </div>
      </motion.div>
    </>
  )
}

/* ─── Task Bottom Sheet (Home) ─────────────────────────────── */
function HomeTaskSheet({ task, onClose }: { task: Task; onClose: () => void }) {
  const diff = new Date(task.due_date).getTime() - Date.now()
  const isOverdue = diff < 0
  const isUrgent  = diff >= 0 && diff < 24 * 60 * 60 * 1000
  const typeKey   = task.type?.toLowerCase().replace(/\s+/g, '') ?? 'other'
  const { icon: TypeIcon, label: typeLabel } = TASK_TYPE_CONFIG[typeKey] ?? TASK_TYPE_CONFIG['other']

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200 }}
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#f8f8f8', borderRadius: '24px 24px 0 0',
          zIndex: 201, maxHeight: '80vh',
          display: 'flex', flexDirection: 'column',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        }}
      >
        <div style={{ width: '36px', height: '4px', background: '#d1d5db', borderRadius: '99px', margin: '12px auto' }} />
        <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e5e5' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <TypeIcon size={16} color="var(--text-secondary)" />
            <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{typeLabel}</span>
          </div>
          <button onClick={onClose} style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-surface2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
            <X size={16} color="var(--text-muted)" />
          </button>
        </div>

        <div style={{ padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
            <h1 style={{ fontSize: '22px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px' }}>{task.title}</h1>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{
                fontSize: '11px', fontWeight: 700, padding: '3px 8px', borderRadius: '8px',
                background: isOverdue ? '#fef2f2' : isUrgent ? 'var(--em-800)' : 'var(--bg-surface2)',
                color: isOverdue ? '#ef4444' : isUrgent ? 'var(--em-300)' : 'var(--text-secondary)',
                display: 'flex', alignItems: 'center', gap: '4px',
              }}>
                {isOverdue && <AlertTriangle size={10} />}
                {isOverdue ? 'Overdue' : isUrgent ? 'Due Soon' : 'Upcoming'}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                {formatRelativeDate(task.due_date)} · {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          </div>
          <Link
            href="/academics"
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
              marginTop: '12px', padding: '14px', borderRadius: '16px',
              background: 'var(--em-500)', color: '#fff',
              fontSize: '14px', fontWeight: 700, textDecoration: 'none',
            }}
          >
            <GraduationCap size={16} /> View All Tasks
          </Link>
        </div>
      </motion.div>
    </>
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
        gap: '8px',
      }}
    >
      {icon}
      <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>{label}</p>
      {action}
    </div>
  )
}

'use client'

import { motion } from 'framer-motion'
import {
  BookOpen, Monitor, Swords, FileText, FolderKanban,
  MoreHorizontal, Clock, CheckCircle2, AlertTriangle, X, Trash2, Loader2,
} from 'lucide-react'
import { clsx } from 'clsx'

type Task = {
  id: string; title: string; type: string
  due_date: string; status: string; notes?: string | null
}

import { useState, useTransition } from 'react'
import { AnimatePresence } from 'framer-motion'
import { deleteTask } from '@/actions/academics'

const TYPE_CONFIG: Record<string, { icon: React.ElementType; label: string }> = {
  assignment:   { icon: BookOpen,       label: 'Assignment' },
  presentation: { icon: Monitor,        label: 'Presentation' },
  hackathon:    { icon: Swords,         label: 'Hackathon' },
  exam:         { icon: FileText,       label: 'Exam' },
  project:      { icon: FolderKanban,   label: 'Project' },
  other:        { icon: MoreHorizontal, label: 'Other' },
}

function getUrgency(due_date: string) {
  const diff = new Date(due_date).getTime() - Date.now()
  if (diff < 0) return 'overdue'
  if (diff < 24 * 60 * 60 * 1000) return 'urgent'
  return 'normal'
}

function formatRelativeDate(due_date: string) {
  const diffMs = new Date(due_date).getTime() - Date.now()
  if (diffMs < 0) return `Overdue by ${Math.abs(Math.ceil(diffMs / (1000 * 60 * 60 * 24)))}d`
  const diffHours = Math.floor(diffMs / (1000 * 60 * 60))
  const diffDays  = Math.floor(diffMs / (1000 * 60 * 60 * 24))
  if (diffDays === 0) return `In ${diffHours}h`
  if (diffDays === 1) {
    const remHours = diffHours - 24
    return remHours > 0 ? `In 1d ${remHours}h` : 'Tomorrow'
  }
  return `In ${diffDays}d`
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

export function TaskList({ tasks: initialTasks }: { tasks: Task[] }) {
  const [tasks, setTasks] = useState(initialTasks)
  const [selectedTask, setSelectedTask] = useState<Task | null>(null)

  if (tasks.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <CheckCircle2 size={28} className="text-[var(--em-700)] mb-3" strokeWidth={1.5} />
        <p className="text-[var(--text-secondary)] text-sm font-medium">No tasks yet</p>
        <p className="text-[var(--text-muted)] text-xs mt-1">Add your first academic task to get started.</p>
      </div>
    )
  }

  return (
    <motion.div
      variants={containerVariants}
      initial="hidden"
      animate="visible"
      style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}
    >
      {tasks.map((task) => {
        const urgency = getUrgency(task.due_date)
        const typeKey = task.type?.toLowerCase().replace(/\s+/g, '') ?? 'other'
        const typeConfig = TYPE_CONFIG[typeKey] ?? { icon: MoreHorizontal, label: task.type ?? 'Other' }
        const Icon = typeConfig.icon
        const isOverdue = urgency === 'overdue'
        const isUrgent = urgency === 'urgent'

        return (
          <motion.div
            key={task.id}
            variants={cardVariants}
            onClick={() => setSelectedTask(task)}
            style={{
              position: 'relative', borderRadius: '16px', padding: '16px',
              cursor: 'pointer',
              background: isOverdue ? 'var(--em-400)' : '#ffffff',
              border: `1px solid ${isOverdue ? 'var(--em-500)' : isUrgent ? 'var(--em-700)' : 'var(--border)'}`,
              boxShadow: '0 2px 12px rgba(0,0,0,0.04)',
            }}
          >
            {/* Pulsing border for urgent */}
            {isUrgent && (
              <motion.div
                style={{ position: 'absolute', inset: 0, borderRadius: '16px', border: '1px solid var(--em-500)', pointerEvents: 'none' }}
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}

            <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
              {/* Icon */}
              <div style={{
                width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0, marginTop: '2px',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: isOverdue ? 'var(--em-700)' : 'var(--bg-elevated)',
                border: isOverdue ? 'none' : '1px solid var(--border)',
              }}>
                <Icon size={14} strokeWidth={1.75} color={isOverdue ? 'var(--em-100)' : 'var(--em-500)'} />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0, overflow: 'hidden' }}>
                <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '8px' }}>
                  <p style={{
                    fontSize: '14px', fontWeight: 700,
                    color: isOverdue ? 'var(--em-950)' : 'var(--text-primary)',
                    overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
                    flex: 1, minWidth: 0,
                  }}>
                    {task.title}
                  </p>
                  <span style={{
                    flexShrink: 0, fontSize: '10px', fontWeight: 700, letterSpacing: '0.04em',
                    padding: '2px 8px', borderRadius: '6px', whiteSpace: 'nowrap',
                    background: isOverdue ? 'var(--em-700)' : isUrgent ? 'var(--em-800)' : 'var(--bg-surface2)',
                    color: isOverdue ? 'var(--em-100)' : isUrgent ? 'var(--em-300)' : 'var(--text-tertiary)',
                    border: `1px solid ${isOverdue ? 'var(--em-600)' : isUrgent ? 'var(--em-700)' : 'var(--border)'}`,
                    display: 'flex', alignItems: 'center', gap: '4px',
                  }}>
                    {isOverdue && <AlertTriangle size={9} />}
                    {isOverdue ? 'Overdue' : isUrgent ? 'Due Soon' : typeConfig.label}
                  </span>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginTop: '6px' }}>
                  <Clock size={10} color={isOverdue ? 'var(--em-800)' : 'var(--text-muted)'} />
                  <span style={{
                    fontSize: '11px', fontFamily: 'monospace',
                    color: isOverdue ? 'var(--em-800)' : 'var(--text-muted)',
                  }}>
                    {formatRelativeDate(task.due_date)} &middot;{' '}
                    {new Date(task.due_date).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>

                {task.notes && (
                  <p style={{
                    fontSize: '12px', marginTop: '8px', lineHeight: 1.5,
                    overflow: 'hidden', display: '-webkit-box',
                    WebkitLineClamp: 2, WebkitBoxOrient: 'vertical',
                    color: isOverdue ? 'var(--em-800)' : 'var(--text-tertiary)',
                    wordBreak: 'break-word',
                  }}>
                    {task.notes}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )
      })}

      <AnimatePresence>
        {selectedTask && (
          <TaskSheet
            task={selectedTask}
            onClose={() => setSelectedTask(null)}
            onDelete={(id) => {
              setTasks((prev) => prev.filter((t) => t.id !== id))
              setSelectedTask(null)
            }}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function TaskSheet({
  task,
  onClose,
  onDelete,
}: {
  task: Task
  onClose: () => void
  onDelete: (id: string) => void
}) {
  const [isDeleting, startDeleting] = useTransition()

  function handleDelete() {
    startDeleting(async () => {
      const res = await deleteTask(task.id)
      if (res.error) alert(res.error)
      else onDelete(task.id)
    })
  }

  const typeKey = task.type?.toLowerCase().replace(/\s+/g, '') ?? 'other'
  const typeConfig = TYPE_CONFIG[typeKey] ?? { icon: MoreHorizontal, label: task.type ?? 'Other' }
  const Icon = typeConfig.icon
  const urgency = getUrgency(task.due_date)
  const isOverdue = urgency === 'overdue'
  const isUrgent = urgency === 'urgent'

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200 }}
      />
      <motion.div
        initial={{ y: '100%' }}
        animate={{ y: 0 }}
        exit={{ y: '100%' }}
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

        {/* Header */}
        <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e5e5' }}>
          <button onClick={onClose} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            <X size={18} /> Close
          </button>
          <button
            onClick={handleDelete}
            disabled={isDeleting}
            style={{ padding: '0 12px', height: '32px', borderRadius: '10px', background: '#fef2f2', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: '#ef4444', fontSize: '12px', fontWeight: 700 }}
          >
            {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            Delete
          </button>
        </div>

        {/* Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '16px' }}>
              <div style={{ width: '32px', height: '32px', borderRadius: '10px', background: 'var(--bg-surface2)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <Icon size={16} className="text-[var(--text-secondary)]" />
              </div>
              <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                {typeConfig.label}
              </span>
            </div>

            <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '12px', lineHeight: 1.2 }}>
              {task.title}
            </h1>

            <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '24px' }}>
              <span className={clsx(
                'badge',
                isOverdue
                  ? 'bg-[var(--em-700)] text-[var(--em-100)] border-[var(--em-600)]'
                  : isUrgent
                  ? 'bg-[var(--em-800)] text-[var(--em-300)] border-[var(--em-700)]'
                  : 'badge-planned'
              )}>
                {isOverdue && <AlertTriangle size={10} style={{ marginRight: '4px', display: 'inline-block' }} />}
                {isOverdue ? 'Overdue' : isUrgent ? 'Due Soon' : 'Upcoming'}
              </span>
              <span style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
                {formatRelativeDate(task.due_date)} &middot; {new Date(task.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>

            {task.notes && (
              <div style={{ padding: '16px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Notes</p>
                <p style={{ fontSize: '14px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap', overflow: 'hidden' }}>
                  {task.notes}
                </p>
              </div>
            )}
          </div>
        </div>
      </motion.div>
    </>
  )
}

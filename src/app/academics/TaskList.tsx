'use client'

import { motion } from 'framer-motion'
import {
  BookOpen, Monitor, Swords, FileText, FolderKanban,
  MoreHorizontal, Clock, CheckCircle2, AlertTriangle,
} from 'lucide-react'
import { clsx } from 'clsx'

type Task = {
  id: string; title: string; type: string
  due_date: string; status: string; notes?: string | null
}

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
  const diffDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24))
  if (diffMs < 0) return `Overdue by ${Math.abs(diffDays)}d`
  if (diffDays === 0) return 'Due today'
  if (diffDays === 1) return 'Due tomorrow'
  return `In ${diffDays} days`
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.06 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

export function TaskList({ tasks }: { tasks: Task[] }) {
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
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-2">
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
            className={clsx(
              'relative rounded-xl border p-4 transition-colors',
              isOverdue
                ? 'bg-[var(--em-400)] border-[var(--em-500)]'
                : isUrgent
                ? 'bg-[var(--bg-surface)] border-[var(--em-700)]'
                : 'bg-[var(--bg-surface)] border-[var(--border)]'
            )}
          >
            {/* Pulsing border for urgent */}
            {isUrgent && (
              <motion.div
                className="absolute inset-0 rounded-xl border border-[var(--em-500)] pointer-events-none"
                animate={{ opacity: [0.3, 1, 0.3] }}
                transition={{ duration: 2, repeat: Infinity, ease: 'easeInOut' }}
              />
            )}

            <div className="flex items-start gap-3">
              <div className={clsx(
                'w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0 mt-0.5',
                isOverdue ? 'bg-[var(--em-700)]' : 'bg-[var(--bg-elevated)] border border-[var(--border)]'
              )}>
                <Icon size={14} strokeWidth={1.75} className={isOverdue ? 'text-[var(--em-950)]' : 'text-[var(--em-400)]'} />
              </div>

              <div className="flex-1 min-w-0">
                <div className="flex items-start justify-between gap-2">
                  <p className={clsx(
                    'text-sm font-medium truncate',
                    isOverdue ? 'text-[var(--em-950)]' : 'text-[var(--text-primary)]'
                  )}>
                    {task.title}
                  </p>
                  <span className={clsx(
                    'badge flex-shrink-0',
                    isOverdue
                      ? 'bg-[var(--em-700)] text-[var(--em-100)] border-[var(--em-600)]'
                      : isUrgent
                      ? 'bg-[var(--em-800)] text-[var(--em-300)] border-[var(--em-700)]'
                      : 'badge-planned'
                  )}>
                    {isOverdue && <AlertTriangle size={9} />}
                    {isOverdue ? 'Overdue' : isUrgent ? 'Due Soon' : typeConfig.label}
                  </span>
                </div>

                <div className="flex items-center gap-1.5 mt-1">
                  <Clock size={10} className={isOverdue ? 'text-[var(--em-800)]' : 'text-[var(--text-muted)]'} />
                  <span className={clsx(
                    'text-[11px] mono',
                    isOverdue ? 'text-[var(--em-800)]' : 'text-[var(--text-muted)]'
                  )}>
                    {formatRelativeDate(task.due_date)} &middot;{' '}
                    {new Date(task.due_date).toLocaleDateString('en-US', {
                      month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit',
                    })}
                  </span>
                </div>

                {task.notes && (
                  <p className={clsx(
                    'text-xs mt-1.5 line-clamp-2',
                    isOverdue ? 'text-[var(--em-800)]' : 'text-[var(--text-tertiary)]'
                  )}>
                    {task.notes}
                  </p>
                )}
              </div>
            </div>
          </motion.div>
        )
      })}
    </motion.div>
  )
}

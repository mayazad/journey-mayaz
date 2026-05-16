'use client'

import { motion } from 'framer-motion'
import { Dumbbell, Activity, Calendar, Tag } from 'lucide-react'
import { clsx } from 'clsx'

type Exercise = { name: string } | string

type Workout = {
  id: string; day_type: string; scheduled_date: string
  target_muscle_groups: string[]; exercises: Exercise[]; created_at: string
}

function isPast(dateStr: string) {
  return new Date(dateStr) < new Date(new Date().toDateString())
}

function getExerciseName(ex: Exercise): string {
  if (typeof ex === 'string') return ex
  return ex.name ?? ''
}

const containerVariants = {
  hidden: { opacity: 0 },
  visible: { opacity: 1, transition: { staggerChildren: 0.07 } },
}
const cardVariants = {
  hidden: { opacity: 0, y: 10 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.3, ease: 'easeOut' as const } },
}

export function WorkoutList({ workouts }: { workouts: Workout[] }) {
  if (workouts.length === 0) {
    return (
      <div className="card flex flex-col items-center justify-center py-16 text-center">
        <Dumbbell size={28} className="text-[var(--em-700)] mb-3" strokeWidth={1.5} />
        <p className="text-[var(--text-secondary)] text-sm font-medium">No sessions logged yet</p>
        <p className="text-[var(--text-muted)] text-xs mt-1">Log your first workout to start tracking progress.</p>
      </div>
    )
  }

  const upcoming = workouts.filter((w) => !isPast(w.scheduled_date))
  const past     = workouts.filter((w) =>  isPast(w.scheduled_date))

  return (
    <motion.div variants={containerVariants} initial="hidden" animate="visible" className="space-y-6">
      {upcoming.length > 0 && (
        <div>
          <p className="label mb-3 flex items-center gap-1.5">
            <Activity size={10} /> Upcoming
          </p>
          <div className="space-y-2">
            {upcoming.map((w) => <WorkoutCard key={w.id} workout={w} dimmed={false} />)}
          </div>
        </div>
      )}
      {past.length > 0 && (
        <div>
          <p className="label mb-3">Past Sessions</p>
          <div className="space-y-2">
            {past.map((w) => <WorkoutCard key={w.id} workout={w} dimmed />)}
          </div>
        </div>
      )}
    </motion.div>
  )
}

function WorkoutCard({ workout, dimmed }: { workout: Workout; dimmed: boolean }) {
  const exercises = Array.isArray(workout.exercises) ? workout.exercises : []

  return (
    <motion.div
      variants={cardVariants}
      whileHover={{ scale: 1.01 }}
      transition={{ duration: 0.15 }}
      className={clsx('card', dimmed && 'opacity-50')}
    >
      <div className="flex items-start gap-3">
        <div className="w-9 h-9 rounded-xl bg-[var(--bg-elevated)] border border-[var(--border)] flex items-center justify-center flex-shrink-0">
          <Dumbbell size={15} className="text-[var(--em-400)]" strokeWidth={1.75} />
        </div>

        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            {/* Day type badge — emerald style, works for any custom day type */}
            <span className="badge bg-[var(--em-800)] text-[var(--em-300)] border border-[var(--em-700)]">
              {workout.day_type}
            </span>
            <div className="flex items-center gap-1 text-[11px] text-[var(--text-muted)] mono">
              <Calendar size={10} />
              {new Date(workout.scheduled_date + 'T00:00:00').toLocaleDateString('en-US', {
                weekday: 'short', month: 'short', day: 'numeric',
              })}
            </div>
          </div>

          {/* Muscle groups */}
          {workout.target_muscle_groups?.length > 0 && (
            <div className="flex items-center gap-1.5 mt-2 flex-wrap">
              <Tag size={10} className="text-[var(--em-600)]" />
              {workout.target_muscle_groups.map((m) => (
                <span key={m} className="text-[10px] px-1.5 py-0.5 rounded bg-[var(--em-900)] border border-[var(--em-800)] text-[var(--em-400)]">
                  {m}
                </span>
              ))}
            </div>
          )}

          {/* Exercises */}
          {exercises.length > 0 && (
            <ul className="mt-3 space-y-0.5">
              {exercises.slice(0, 5).map((ex, i) => (
                <li key={i} className="flex items-center gap-2 text-xs text-[var(--text-secondary)]">
                  <span className="w-4 text-[var(--em-600)] mono text-[10px] text-right flex-shrink-0">{i + 1}</span>
                  {getExerciseName(ex)}
                </li>
              ))}
              {exercises.length > 5 && (
                <li className="text-[11px] text-[var(--text-muted)] mono pl-6">
                  +{exercises.length - 5} more
                </li>
              )}
            </ul>
          )}
        </div>
      </div>
    </motion.div>
  )
}

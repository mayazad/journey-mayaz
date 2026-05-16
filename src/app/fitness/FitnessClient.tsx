'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dumbbell, Plus, Sparkles, CheckCircle2, AlertCircle, Tag, ChevronDown, ChevronUp, Loader2 } from 'lucide-react'
import { setDayPlan } from '@/actions/fitness'
import { Combobox } from '@/components/Combobox'
import { AIInputBox } from '@/components/AIInputBox'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_SUGGESTIONS = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Cardio', 'Rest', 'Olympic', 'Calisthenics']

type Exercise = { name: string; sets?: string; reps?: string }
type DayPlan = {
  id: string; day_of_week: string; day_type: string
  target_muscle_groups: string[]; exercises: Exercise[]
}

function DayCard({ day, plan, isToday, onEdit, isLast }: {
  day: string; plan: DayPlan | undefined; isToday: boolean; onEdit: (day: string) => void; isLast?: boolean
}) {
  const [expanded, setExpanded] = useState(isToday)

  return (
    <motion.div layout style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
      {/* Header row */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px',
          background: isToday ? 'rgba(16,185,129,0.06)' : 'transparent',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Status dot */}
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
            background: isToday ? 'var(--em-500)' : plan ? 'var(--em-300)' : 'var(--border-2)',
          }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: isToday ? 'var(--em-700)' : 'var(--text-primary)' }}>{day}</span>
              {isToday && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'var(--em-100)', color: 'var(--em-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Today</span>}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: plan ? 'normal' : 'italic' }}>
              {plan ? `${plan.day_type} · ${plan.exercises?.length ?? 0} exercises` : 'Not planned'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(day) }}
            style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <Plus size={14} />
          </button>
          {expanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
        </div>
      </div>

      {/* Expandable body */}
      <AnimatePresence>
        {expanded && plan && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 18px 16px', borderTop: '1px solid var(--border)' }}>
              {plan.target_muscle_groups?.length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '12px 0' }}>
                  {plan.target_muscle_groups.map((m) => (
                    <span key={m} style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '20px', background: 'var(--em-50)', border: '1px solid var(--em-200)', color: 'var(--em-700)', fontWeight: 600 }}>{m}</span>
                  ))}
                </div>
              )}
              {Array.isArray(plan.exercises) && plan.exercises.length > 0 ? (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: plan.target_muscle_groups?.length > 0 ? 0 : '12px' }}>
                  {plan.exercises.map((ex, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--em-50)', border: '1px solid var(--em-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: 'var(--em-700)', flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</span>
                      {ex.sets && ex.reps && <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', flexShrink: 0 }}>{ex.sets}×{ex.reps}</span>}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>No exercises listed.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function DayPlanForm({ day, existing, onClose }: {
  day: string; existing?: DayPlan; onClose: () => void
}) {
  const [state, setState] = useState<{ error?: string; success?: boolean }>({})
  const [isPending, startTransition] = useTransition()

  function handleSubmit(formData: FormData) {
    setState({})
    startTransition(async () => {
      const result = await setDayPlan({}, formData)
      setState(result)
      if (result.success) setTimeout(onClose, 800)
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      style={{
        background: '#ffffff', borderRadius: '20px', padding: '20px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Set {day} Plan</p>
        <button onClick={onClose} style={{ fontSize: '13px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
      </div>

      <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <input type="hidden" name="day_of_week" value={day} />

        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Day Type</label>
          <Combobox id={`day_type_${day}`} name="day_type" suggestions={DAY_SUGGESTIONS}
            placeholder="Push, Pull, Rest, or custom..." defaultValue={existing?.day_type ?? ''} required />
        </div>

        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Target Muscles <span style={{ textTransform: 'none', fontWeight: 400 }}>(comma-separated)</span></label>
          <input name="target_muscle_groups" type="text" className="field-input"
            placeholder="Chest, Triceps, Anterior Deltoid"
            defaultValue={existing?.target_muscle_groups?.join(', ') ?? ''} />
        </div>

        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Exercises <span style={{ textTransform: 'none', fontWeight: 400 }}>(one per line, e.g. "Bench Press 4x8")</span></label>
          <textarea name="exercises" rows={5} className="field-input" style={{ resize: 'none', fontFamily: 'monospace', fontSize: '12px' }}
            placeholder={"Bench Press 4x8\nIncline Dumbbell 3x10\nCable Flyes 3x12"}
            defaultValue={existing?.exercises?.map(e => e.sets && e.reps ? `${e.name} ${e.sets}x${e.reps}` : e.name).join('\n') ?? ''} />
        </div>

        {state.error && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#dc2626', background: '#fef2f2', borderRadius: '10px', padding: '10px 14px' }}>
            <AlertCircle size={14} /> {state.error}
          </div>
        )}
        {state.success && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: 'var(--em-700)', background: 'var(--em-50)', borderRadius: '10px', padding: '10px 14px' }}>
            <CheckCircle2 size={14} /> Saved!
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '12px', borderRadius: '12px',
            background: 'var(--em-500)', color: '#fff',
            border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
          }}
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          {isPending ? 'Saving...' : 'Save Plan'}
        </button>
      </form>
    </motion.div>
  )
}

export function FitnessClient({ weeklyPlan, todayPlan, aiAction }: {
  weeklyPlan: DayPlan[]
  todayPlan: DayPlan | null
  aiAction: (text: string) => Promise<{ success: true; summary: string } | { error: string }>
}) {
  const [editingDay, setEditingDay] = useState<string | null>(null)
  const planMap = Object.fromEntries(weeklyPlan.map(p => [p.day_of_week, p]))
  const todayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f0f0' }}>

      {/* Page Title */}
      <div style={{ padding: '24px 20px 16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Fitness
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
          {weeklyPlan.length} of 7 days planned
        </p>
      </div>

      {/* Content */}
      <div style={{ padding: '0 16px 120px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

        {/* AI Quick Set */}
        <AIInputBox
          action={aiAction}
          label="AI Quick Set"
          placeholder={`"Saturday is Push day — bench press 4x8, incline dumbbell 3x10, chest and triceps"`}
        />

        {/* Edit form */}
        <AnimatePresence>
          {editingDay && (
            <DayPlanForm
              key={editingDay}
              day={editingDay}
              existing={planMap[editingDay]}
              onClose={() => setEditingDay(null)}
            />
          )}
        </AnimatePresence>

        {/* Weekly grid */}
        <div>
          <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px', padding: '0 4px' }}>Weekly Plan</p>
          {/* Cards grouped in one white container */}
          <div style={{ background: '#ffffff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)' }}>
            {DAYS.map((day, index) => (
              <DayCard
                key={day}
                day={day}
                plan={planMap[day]}
                isToday={day === todayName}
                onEdit={setEditingDay}
                isLast={index === DAYS.length - 1}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  )
}

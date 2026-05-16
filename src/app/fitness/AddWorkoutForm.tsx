'use client'

import { useActionState } from 'react'
import { setDayPlan, type PlanState } from '@/actions/fitness'
import { SubmitButton } from '@/components/SubmitButton'
import { Combobox } from '@/components/Combobox'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

const DAY_SUGGESTIONS = [
  'Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body',
  'Cardio', 'Rest', 'Olympic', 'Calisthenics',
]

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const initialState: PlanState = {}

export function AddWorkoutForm() {
  const [state, formAction] = useActionState(setDayPlan, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="day_of_week" className="label">Day of Week</label>
        <select id="day_of_week" name="day_of_week" required className="field-input">
          {DAYS.map(d => <option key={d} value={d}>{d}</option>)}
        </select>
      </div>

      <div className="space-y-1.5">
        <label htmlFor="day_type" className="label">Day Type</label>
        <Combobox id="day_type" name="day_type" suggestions={DAY_SUGGESTIONS}
          placeholder="Push, Pull, Rest, or custom..." required />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="target_muscle_groups" className="label">
          Target Muscles <span className="normal-case font-normal text-[var(--text-muted)]">(comma-separated)</span>
        </label>
        <input id="target_muscle_groups" name="target_muscle_groups" type="text"
          placeholder="Chest, Triceps, Anterior Deltoid" className="field-input" />
      </div>

      <div className="space-y-1.5">
        <label htmlFor="exercises" className="label">
          Exercises <span className="normal-case font-normal text-[var(--text-muted)]">(one per line, e.g. "Bench Press 4x8")</span>
        </label>
        <textarea id="exercises" name="exercises" rows={4}
          placeholder={"Bench Press 4x8\nIncline Dumbbell 3x10\nCable Flyes 3x12"}
          className="field-input resize-none mono text-xs" />
      </div>

      {state?.error && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs">
          <AlertCircle size={12} className="flex-shrink-0" /> {state.error}
        </div>
      )}
      {state?.success && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--border-accent)] bg-[var(--em-50)] text-[var(--em-700)] text-xs">
          <CheckCircle2 size={12} className="flex-shrink-0" /> Plan saved.
        </div>
      )}

      <SubmitButton label="Save Day Plan" pendingLabel="Saving..." />
    </form>
  )
}

'use client'

import { useActionState } from 'react'
import { createRoadmap } from '@/actions/learning'
import { SubmitButton } from '@/components/SubmitButton'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

type State = { error?: string; success?: boolean }
const initialState: State = {}

async function createRoadmapAction(_prev: State, formData: FormData): Promise<State> {
  'use server'
  // This is a thin wrapper — real logic in createRoadmap
  const title = formData.get('title') as string
  if (!title?.trim()) return { error: 'Title is required.' }
  const { error } = await createRoadmap(title)
  if (error) return { error }
  return { success: true }
}

export function AddLearningNodeForm() {
  const [state, formAction] = useActionState(createRoadmapAction, initialState)

  return (
    <form action={formAction} className="space-y-4">
      <div className="space-y-1.5">
        <label htmlFor="title" className="label">Roadmap Title</label>
        <input id="title" name="title" type="text" required
          placeholder="e.g. Advanced TypeScript" className="field-input" />
      </div>

      {state?.error && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-red-200 bg-red-50 text-red-600 text-xs">
          <AlertCircle size={12} className="flex-shrink-0" /> {state.error}
        </div>
      )}
      {state?.success && (
        <div className="flex items-center gap-2 px-3 py-2.5 rounded-lg border border-[var(--border-accent)] bg-[var(--em-50)] text-[var(--em-700)] text-xs">
          <CheckCircle2 size={12} className="flex-shrink-0" /> Roadmap created.
        </div>
      )}

      <SubmitButton label="Create Roadmap" pendingLabel="Creating..." />
    </form>
  )
}

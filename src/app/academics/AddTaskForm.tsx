'use client'

import { useActionState } from 'react'
import { addTask, type TaskState } from '@/actions/academics'
import { SubmitButton } from '@/components/SubmitButton'
import { Combobox } from '@/components/Combobox'
import { AlertCircle, CheckCircle2 } from 'lucide-react'

const TYPE_SUGGESTIONS = [
  'Assignment', 'Exam', 'Presentation', 'Hackathon',
  'Project', 'Lab Report', 'Thesis', 'Quiz', 'Group Work', 'Other',
]

const initialState: TaskState = {}

const labelStyle: React.CSSProperties = {
  display: 'block',
  fontSize: '11px', fontWeight: 700,
  letterSpacing: '0.07em', textTransform: 'uppercase',
  color: 'var(--text-muted)', marginBottom: '6px',
}

export function AddTaskForm() {
  const [state, formAction] = useActionState(addTask, initialState)

  return (
    <form action={formAction} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>

      {/* Title */}
      <div>
        <label htmlFor="title" style={labelStyle}>Title</label>
        <input
          id="title"
          name="title"
          type="text"
          required
          placeholder="e.g. OS Assignment 3"
          className="field-input"
        />
      </div>

      {/* Type */}
      <div>
        <label htmlFor="type" style={labelStyle}>Type</label>
        <Combobox
          id="type"
          name="type"
          suggestions={TYPE_SUGGESTIONS}
          placeholder="e.g. Assignment, Hackathon, or custom..."
          required
        />
      </div>

      {/* Due Date */}
      <div>
        <label htmlFor="due_date" style={labelStyle}>Due Date</label>
        <input
          id="due_date"
          name="due_date"
          type="datetime-local"
          required
          className="field-input"
        />
      </div>

      {/* Notes */}
      <div>
        <label htmlFor="notes" style={labelStyle}>
          Notes <span style={{ textTransform: 'none', fontWeight: 400, color: 'var(--text-muted)' }}>(optional)</span>
        </label>
        <textarea
          id="notes"
          name="notes"
          rows={3}
          placeholder="Any additional context..."
          className="field-input"
          style={{ resize: 'none' }}
        />
      </div>

      {state?.error && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', background: '#fef2f2', fontSize: '13px', color: '#dc2626' }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} /> {state.error}
        </div>
      )}
      {state?.success && (
        <div style={{ display: 'flex', gap: '8px', alignItems: 'center', padding: '10px 14px', borderRadius: '10px', background: 'var(--em-50)', fontSize: '13px', color: 'var(--em-700)' }}>
          <CheckCircle2 size={14} style={{ flexShrink: 0 }} /> Task added.
        </div>
      )}

      <SubmitButton label="Add Task" pendingLabel="Adding..." />
    </form>
  )
}

import { getTasks } from '@/actions/academics'
import { aiAddTask } from '@/actions/ai'
import { AppShell } from '@/components/AppShell'
import { AddTaskForm } from './AddTaskForm'
import { TaskList } from './TaskList'
import { AIInputBox } from '@/components/AIInputBox'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Academics — Mayaz OS',
  description: 'Track your academic deadlines, assignments, and presentations.',
}

export default async function AcademicsPage() {
  const tasks = await getTasks()

  return (
    <AppShell>
      <div style={{ minHeight: '100vh', backgroundColor: '#f0f0f0' }}>

        {/* Page Title */}
        <div style={{ padding: '24px 20px 16px' }}>
          <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)', marginBottom: '4px' }}>
            Academics
          </h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
            {tasks.length} {tasks.length === 1 ? 'task' : 'tasks'} tracked
          </p>
        </div>

        {/* Content */}
        <div style={{ padding: '0 16px 120px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

          {/* AI Quick Add */}
          <AIInputBox
            action={aiAddTask}
            label="AI Quick Add"
            placeholder={`"OS Assignment due next Monday, worth 20% of grade"`}
          />

          {/* New Task Form */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px', padding: '0 4px' }}>
              New Task
            </p>
            <div style={{ background: '#ffffff', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)' }}>
              <AddTaskForm />
            </div>
          </div>

          {/* Task List */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px', padding: '0 4px' }}>
              Upcoming — sorted by due date
            </p>
            <TaskList tasks={tasks} />
          </div>

        </div>
      </div>
    </AppShell>
  )
}

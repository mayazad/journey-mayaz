import { generateDailyBriefing } from '@/actions/ai'
import { getTodayPlan } from '@/actions/fitness'
import { getTasks } from '@/actions/academics'
import { AppShell } from '@/components/AppShell'
import { HomeClient } from './HomeClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home — Mayaz OS',
  description: 'Your personalized daily briefing.',
}

export default async function HomePage() {
  const [briefingData, todayPlan, tasks] = await Promise.all([
    generateDailyBriefing(),
    getTodayPlan(),
    getTasks(),
  ])

  const urgentTasks = tasks.filter((t) => {
    const diff = new Date(t.due_date).getTime() - Date.now()
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000
  }).slice(0, 4)

  // Build a serialized context snapshot for the home chat panel
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const todayName = DAYS[new Date().getDay()]
  const workoutLine = todayPlan
    ? `Workout: ${todayPlan.day_type} day (${todayName}) — ${
        Array.isArray(todayPlan.exercises) ? todayPlan.exercises.length : 0
      } exercises`
    : `Workout: No plan for ${todayName}`
  const tasksLine = urgentTasks.length
    ? `Urgent tasks: ${urgentTasks.map(t => `"${t.title}" due ${new Date(t.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}`).join(', ')}`
    : 'Urgent tasks: None this week'
  const contextSnapshot = `${workoutLine}\n${tasksLine}`

  return (
    <AppShell>
      <HomeClient
        briefingMarkdown={briefingData.markdown}
        userName={briefingData.userName}
        todayPlan={todayPlan}
        urgentTasks={urgentTasks}
        contextSnapshot={contextSnapshot}
      />
    </AppShell>
  )
}

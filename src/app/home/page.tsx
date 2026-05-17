import { getTodayPlan } from '@/actions/fitness'
import { getTasks } from '@/actions/academics'
import { AppShell } from '@/components/AppShell'
import { getAuthUser } from '@/lib/auth'
import { createClient } from '@/lib/supabase/server'
import { HomeClient } from './HomeClient'
import type { Metadata } from 'next'

export const metadata: Metadata = {
  title: 'Home — Mayaz OS',
  description: 'Your personalized daily briefing.',
}

export default async function HomePage() {
  const user = await getAuthUser()
  const supabase = await createClient()

  const rawName = (user?.user_metadata?.full_name as string | undefined) ||
                  (user?.user_metadata?.name as string | undefined) ||
                  user?.email?.split('@')[0] || 'there'
  const nameParts = rawName.trim().split(/\s+/)
  let firstName = nameParts[0]
  if (firstName.toLowerCase() === 'md' && nameParts.length > 1) {
    firstName = nameParts[nameParts.length - 1]
  }

  const [todayPlan, tasks, roadmapsResult] = await Promise.all([
    getTodayPlan(),
    getTasks(),
    supabase.from('roadmaps').select('title').eq('user_id', user?.id || '').limit(5)
  ])

  const roadmaps = roadmapsResult.data || []

  const urgentTasks = tasks.filter((t) => {
    const diff = new Date(t.due_date).getTime() - Date.now()
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000
  }).slice(0, 4)

  // Build a highly rich serialized RAG context snapshot for the home chat panel
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const todayName = DAYS[new Date().getDay()]

  const workoutSection = todayPlan
    ? `Today's Workout (${todayName} - ${todayPlan.day_type} day):\n  Target Muscles: ${(todayPlan.target_muscle_groups ?? []).join(', ') || 'Not specified'}\n  Exercises:\n  ${
        Array.isArray(todayPlan.exercises) && todayPlan.exercises.length > 0
          ? todayPlan.exercises.map((e: any) => e.sets && e.reps ? `* ${e.name} (${e.sets} sets x ${e.reps} reps)` : `* ${e.name}`).join('\n  ')
          : 'No exercises listed yet'
      }`
    : `Today's Workout: No plan set for ${todayName}`

  const tasksSection = tasks.length
    ? `Upcoming Academic Tasks:\n  ${tasks.map(t => `* [${t.type.toUpperCase()}] "${t.title}" (Due: ${new Date(t.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}, Status: ${t.status})`).join('\n  ')}`
    : 'Upcoming Academic Tasks: None'

  const learningSection = roadmaps.length
    ? `Active Learning Roadmaps: ${roadmaps.map(r => `"${r.title}"`).join(', ')}`
    : 'Active Learning Roadmaps: None'

  const contextSnapshot = `Date: ${new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}\n\n${workoutSection}\n\n${tasksSection}\n\n${learningSection}`

  return (
    <AppShell>
      <HomeClient
        initialUserName={firstName}
        todayPlan={todayPlan}
        urgentTasks={urgentTasks}
        contextSnapshot={contextSnapshot}
      />
    </AppShell>
  )
}

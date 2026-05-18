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

  // Resolve user timezone from cookie
  let userTz = 'UTC'
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    userTz = cookieStore.get('user-timezone')?.value || 'UTC'
  } catch (e) {
    console.error('Failed to read timezone cookie:', e)
  }

  // Format today's date and day name in user's local timezone
  const now = new Date()
  let dateLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  try {
    dateLabel = now.toLocaleDateString('en-US', {
      timeZone: userTz,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })
  } catch (e) {
    console.error('Timezone conversion failed:', e)
  }

  const [workoutPlansResult, tasks, roadmapsResult] = await Promise.all([
    supabase.from('workout_plans').select('id, day_of_week, day_type, target_muscle_groups, exercises').eq('user_id', user?.id || ''),
    getTasks(),
    supabase.from('roadmaps').select('title').eq('user_id', user?.id || '').limit(5)
  ])

  const workoutPlans = workoutPlansResult.data || []
  
  // Build a highly rich serialized RAG context snapshot with the full weekly schedule
  // IMPORTANT: resolve todayName using the timezone cookie, NOT new Date().getDay() which is UTC on Vercel
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  let todayName = DAYS[now.getDay()] // UTC fallback
  try {
    const dayFormatter = new Intl.DateTimeFormat('en-US', { timeZone: userTz, weekday: 'long' })
    todayName = dayFormatter.format(now)
  } catch (e) {
    console.error('Day name timezone resolution failed:', e)
  }

  // Pre-compute tomorrow's name so the AI never has to infer it
  const tomorrowName = DAYS[(DAYS.indexOf(todayName) + 1) % 7] ||
    (() => { try { const d = new Date(now); d.setDate(d.getDate() + 1); return new Intl.DateTimeFormat('en-US', { timeZone: userTz, weekday: 'long' }).format(d) } catch { return DAYS[(now.getDay() + 1) % 7] } })()

  const todayPlan = workoutPlans.find(wp => wp.day_of_week === todayName) || null
  const tomorrowPlan = workoutPlans.find(wp => wp.day_of_week === tomorrowName) || null
  const roadmaps = roadmapsResult.data || []

  const urgentTasks = tasks.filter((t) => {
    const diff = new Date(t.due_date).getTime() - Date.now()
    return diff > 0 && diff < 7 * 24 * 60 * 60 * 1000
  }).slice(0, 4)

  function formatWorkoutDay(wp: typeof workoutPlans[0] | null, dayLabel: string): string {
    if (!wp) return `${dayLabel}: No workout plan set.`
    const exercisesStr = Array.isArray(wp.exercises) && wp.exercises.length > 0
      ? wp.exercises.map((e: any) => e.sets && e.reps ? `${e.name} (${e.sets}x${e.reps})` : e.name).join(', ')
      : 'No exercises listed yet'
    return `${dayLabel} (${wp.day_type} day, Muscles: ${(wp.target_muscle_groups ?? []).join(', ') || 'None'}): ${exercisesStr}`
  }

  const workoutSection = `Today (${todayName}): ${formatWorkoutDay(todayPlan, todayName)}\nTomorrow (${tomorrowName}): ${formatWorkoutDay(tomorrowPlan, tomorrowName)}`

  const tasksSection = tasks.length
    ? `Upcoming Academic Tasks:\n  ${tasks.map(t => `* [${t.type.toUpperCase()}] "${t.title}" (Due: ${new Date(t.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}, Status: ${t.status})`).join('\n  ')}`
    : 'Upcoming Academic Tasks: None'

  const learningSection = roadmaps.length
    ? `Active Learning Roadmaps: ${roadmaps.map(r => `"${r.title}"`).join(', ')}`
    : 'Active Learning Roadmaps: None'

  const contextSnapshot = `Today's Local Date: ${dateLabel}\nToday's Day of Week: ${todayName}\nTomorrow's Day of Week: ${tomorrowName}\nTimezone: ${userTz}\n\n${workoutSection}\n\n${tasksSection}\n\n${learningSection}`

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

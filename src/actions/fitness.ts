'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type Exercise = { name: string; sets?: string; reps?: string; notes?: string }

export type DayPlan = {
  id: string
  day_of_week: string
  day_type: string
  target_muscle_groups: string[]
  exercises: Exercise[]
}

export type PlanState = { error?: string; success?: boolean }

// ── Get the full weekly plan ──────────────────────────────────────────────────
export async function getWeeklyPlan(): Promise<DayPlan[]> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (!supabaseUrl.startsWith('http')) return []

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: true })

  if (error) { console.error(error); return [] }
  return (data ?? []) as DayPlan[]
}

// ── Get today's plan ──────────────────────────────────────────────────────────
export async function getTodayPlan(): Promise<DayPlan | null> {
  const DAYS = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const today = DAYS[new Date().getDay()]

  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''
  if (!supabaseUrl.startsWith('http')) return null

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data } = await supabase
    .from('workout_plans')
    .select('*')
    .eq('user_id', user.id)
    .eq('day_of_week', today)
    .single()

  return data as DayPlan | null
}

// ── Upsert a day's plan (create or update) ────────────────────────────────────
export async function setDayPlan(_prev: PlanState, formData: FormData): Promise<PlanState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const day_of_week = formData.get('day_of_week') as string
  const day_type    = formData.get('day_type') as string
  const muscleRaw   = formData.get('target_muscle_groups') as string
  const exercisesRaw = formData.get('exercises') as string

  if (!day_of_week || !day_type) return { error: 'Day and type are required.' }

  const target_muscle_groups = muscleRaw
    ? muscleRaw.split(',').map((m) => m.trim()).filter(Boolean)
    : []

  // Parse exercises — one per line "Bench Press 4x8" or structured
  const exercises: Exercise[] = exercisesRaw
    ? exercisesRaw
        .split('\n')
        .map((line) => line.trim())
        .filter(Boolean)
        .map((line) => {
          // Try to parse "Exercise Name SetsxReps"
          const match = line.match(/^(.+?)\s+(\d+)x(\d+)\s*(.*)$/)
          if (match) {
            return { name: match[1].trim(), sets: match[2], reps: match[3], notes: match[4].trim() || undefined }
          }
          return { name: line }
        })
    : []

  const { error } = await supabase.from('workout_plans').upsert(
    {
      user_id: user.id,
      day_of_week,
      day_type,
      target_muscle_groups,
      exercises,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,day_of_week' }
  )

  if (error) return { error: error.message }

  revalidatePath('/fitness')
  revalidatePath('/home')
  return { success: true }
}

// ── Log that you completed today's workout ────────────────────────────────────
export async function logWorkoutDone(planId: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const today = new Date().toISOString().split('T')[0]

  // Avoid duplicate logs for same day
  const { data: existing } = await supabase
    .from('workout_logs')
    .select('id')
    .eq('user_id', user.id)
    .eq('logged_date', today)
    .single()

  if (existing) return {}

  await supabase.from('workout_logs').insert({
    user_id: user.id,
    plan_id: planId,
    logged_date: today,
  })

  revalidatePath('/fitness')
  revalidatePath('/home')
  return {}
}

// ── Clear a day's plan ────────────────────────────────────────────────────────
export async function clearDayPlan(day_of_week: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('workout_plans')
    .delete()
    .eq('user_id', user.id)
    .eq('day_of_week', day_of_week)

  if (error) return { error: error.message }

  revalidatePath('/fitness')
  revalidatePath('/home')
  return {}
}

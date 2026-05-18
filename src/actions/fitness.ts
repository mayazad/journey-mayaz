'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'

export type Exercise = { name: string; sets?: string; reps?: string; rest?: string; notes?: string }

export type DayPlan = {
  id: string
  day_of_week: string
  day_type: string
  target_muscle_groups: string[]
  exercises: Exercise[]
  warmup?: string
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

// ── Helper to parse complex workout plan lines ────────────────────────────────
function parseExerciseLine(line: string) {
  const cleaned = line.trim()
  if (!cleaned) return null

  let rest: string | undefined
  let nameAndReps = cleaned

  // Match "Rest: 90-120s" or "Rest: 60s" (with or without parentheses)
  const restMatch = cleaned.match(/(?:\(|,|^|\s)Rest:\s*([^\)]+)/i)
  if (restMatch) {
    rest = restMatch[1].trim()
    nameAndReps = cleaned.replace(/\s*\(?Rest:\s*[^\)]+\)?/i, '').trim()
  }

  // Parse "Exercise Name Sets x Reps" (supporting unicode × as well)
  // E.g. "Plank 3x30-60s" -> sets: "3", reps: "30-60s"
  // E.g. "Walking Lunges 3x10 each leg" -> sets: "3", reps: "10", notes: "each leg"
  const match = nameAndReps.match(/^(.+?)\s+(\d+)\s*[x×]\s*(.+?)(?:\s+(.*))?$/i)
  if (match) {
    return {
      name: match[1].trim(),
      sets: match[2].trim(),
      reps: match[3].trim(),
      rest,
      notes: match[4]?.trim() || undefined
    }
  }

  return { name: nameAndReps, rest }
}

// ── Upsert a day's plan (create or update) ────────────────────────────────────
export async function setDayPlan(_prev: PlanState, formData: FormData): Promise<PlanState> {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const day_of_week = formData.get('day_of_week') as string
  const day_type    = formData.get('day_type') as string
  const warmup      = formData.get('warmup') as string
  const muscleRaw   = formData.get('target_muscle_groups') as string
  const exercisesRaw = formData.get('exercises') as string

  if (!day_of_week || !day_type) return { error: 'Day and type are required.' }

  const target_muscle_groups = muscleRaw
    ? muscleRaw.split(',').map((m) => m.trim()).filter(Boolean)
    : []

  const exercises: Exercise[] = exercisesRaw
    ? exercisesRaw
        .split('\n')
        .map((line) => parseExerciseLine(line))
        .filter(Boolean) as Exercise[]
    : []

  const { error } = await supabase.from('workout_plans').upsert(
    {
      user_id: user.id,
      day_of_week,
      day_type,
      warmup: warmup?.trim() || null,
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

// ── Get User Fitness Profile ───────────────────────────────────────────────
export async function getFitnessProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('user_fitness_profile')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error) return null
  return data
}

// ── Update User Fitness Profile ───────────────────────────────────────────
export async function updateFitnessProfile(profile: {
  height_cm?: number
  weight_kg?: number
  age?: number
  sex?: string
  fitness_level?: string
  primary_goal?: string
  secondary_goals?: string[]
  available_equipment?: string[]
  training_days_per_week?: number
  experience_years?: number
  injuries_limitations?: string
}) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase
    .from('user_fitness_profile')
    .upsert({
      user_id: user.id,
      ...profile,
      updated_at: new Date().toISOString()
    })

  if (error) return { error: error.message }
  revalidatePath('/settings')
  return { success: true }
}


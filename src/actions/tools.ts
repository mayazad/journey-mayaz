// NOTE: No 'use server' here — MAYAZ_OS_TOOLS is a plain object (not async function).
// The individual tool_* functions ARE server actions called from within chatWithAI in ai.ts.
// Next.js 'use server' files can only export async functions — objects are not allowed.

import { createClient } from '@/lib/supabase/server'

// ════════════════════════════════════════════════════════════════════════════════
// MAYAZ OS — AGENTIC RAG TOOL EXECUTORS
// These are the ONLY database functions the AI is permitted to call.
// Vault data is structurally absent — no tool exists to read it.
// All tool results are returned as plain JSON for the AI to format.
// ════════════════════════════════════════════════════════════════════════════════

// ── Tool 1: Workout Schedule ───────────────────────────────────────────────────
export async function tool_getWorkoutSchedule(day_of_week: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const query = day_of_week === 'All'
    ? supabase.from('workout_plans').select('day_of_week, day_type, target_muscle_groups, exercises, warmup').eq('user_id', user.id).order('created_at', { ascending: true })
    : supabase.from('workout_plans').select('day_of_week, day_type, target_muscle_groups, exercises, warmup').eq('user_id', user.id).eq('day_of_week', day_of_week)

  const { data, error } = await query
  if (error) return { error: error.message }
  if (!data?.length) return { result: `No workout plan found for ${day_of_week}.` }

  return {
    result: data.map(wp => ({
      day: wp.day_of_week,
      type: wp.day_type,
      muscles: wp.target_muscle_groups,
      warmup: wp.warmup ?? null,
      exercises: Array.isArray(wp.exercises)
        ? (wp.exercises as { name: string; sets?: string; reps?: string; rest?: string }[]).map(e =>
            e.sets && e.reps ? `${e.name} — ${e.sets} sets × ${e.reps} reps${e.rest ? ` (Rest: ${e.rest})` : ''}` : e.name
          )
        : []
    }))
  }
}

// ── Tool 2: Academic Tasks ─────────────────────────────────────────────────────
export async function tool_getAcademicTasks(status: string, due_within_days: number) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const cutoff = new Date()
  cutoff.setDate(cutoff.getDate() + (due_within_days ?? 30))

  let query = supabase
    .from('academic_tasks')
    .select('title, type, due_date, status, notes')
    .eq('user_id', user.id)
    .lte('due_date', cutoff.toISOString())
    .order('due_date', { ascending: true })

  if (status && status !== 'all') {
    query = query.eq('status', status)
  }

  const { data, error } = await query
  if (error) return { error: error.message }
  if (!data?.length) return { result: 'No academic tasks found matching those filters.' }

  return {
    result: data.map(t => ({
      title: t.title,
      type: t.type,
      due_date: new Date(t.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric', year: 'numeric' }),
      status: t.status,
      notes: t.notes ?? null,
    })),
    count: data.length
  }
}

// ── Tool 3: Nutrition Summary ──────────────────────────────────────────────────
export async function tool_getNutritionSummary(date: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: meals, error } = await supabase
    .from('meal_logs')
    .select('meal_name, meal_type, calories, protein_g, carbs_g, fat_g, created_at')
    .eq('user_id', user.id)
    .eq('logged_date', date)
    .order('created_at', { ascending: true })

  if (error) return { error: error.message }
  if (!meals?.length) return { result: `No meals logged for ${date}.`, date, totals: { calories: 0, protein_g: 0, carbs_g: 0, fat_g: 0 } }

  const totals = {
    calories: meals.reduce((s, m) => s + (m.calories ?? 0), 0),
    protein_g: Math.round(meals.reduce((s, m) => s + (m.protein_g ?? 0), 0) * 10) / 10,
    carbs_g:   Math.round(meals.reduce((s, m) => s + (m.carbs_g ?? 0), 0) * 10) / 10,
    fat_g:     Math.round(meals.reduce((s, m) => s + (m.fat_g ?? 0), 0) * 10) / 10,
  }

  return {
    date,
    meals_logged: meals.length,
    meals: meals.map(m => `${m.meal_type}: ${m.meal_name} (${m.calories} kcal, ${m.protein_g}g protein)`),
    totals,
  }
}

// ── Tool 4: Sleep Log ──────────────────────────────────────────────────────────
export async function tool_getSleepLog(date: string) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('sleep_logs')
    .select('sleep_date, bedtime, wake_time, duration_hours, quality, notes')
    .eq('user_id', user.id)
    .eq('sleep_date', date)
    .single()

  if (error || !data) return { result: `No sleep data logged for ${date}.` }
  return {
    result: {
      date: data.sleep_date,
      bedtime: data.bedtime,
      wake_time: data.wake_time,
      duration_hours: data.duration_hours,
      quality_out_of_5: data.quality,
      notes: data.notes ?? null,
    }
  }
}

// ── Tool 5: Learning Roadmap Progress ─────────────────────────────────────────
export async function tool_getRoadmapProgress() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data: roadmaps, error } = await supabase
    .from('roadmaps')
    .select('id, title, description')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false })

  if (error) return { error: error.message }
  if (!roadmaps?.length) return { result: 'No active learning roadmaps found.' }

  const enriched = await Promise.all(roadmaps.map(async (r) => {
    const [{ count: total }, { count: done }, { data: nextNode }] = await Promise.all([
      supabase.from('roadmap_nodes').select('*', { count: 'exact', head: true }).eq('roadmap_id', r.id),
      supabase.from('roadmap_nodes').select('*', { count: 'exact', head: true }).eq('roadmap_id', r.id).eq('status', 'done'),
      supabase.from('roadmap_nodes').select('title').eq('roadmap_id', r.id).neq('status', 'done').order('order_index').limit(1).single(),
    ])
    const completedCount = done ?? 0
    const totalCount = total ?? 0

    return {
      title: r.title,
      total_topics: totalCount,
      completed_topics: completedCount,
      remaining_topics: totalCount - completedCount,
      progress_percent: totalCount > 0 ? Math.round((completedCount / totalCount) * 100) : 0,
      next_topic: (nextNode as { title?: string } | null)?.title ?? 'All topics complete!',
    }
  }))

  return { result: enriched }
}

// ── Tool 6: Exercise Info (Wger API — free, verified exercise data) ─────────────────
export async function tool_getExerciseInfo(exercise_name: string) {
  try {
    // Wger search endpoint — no API key needed, completely free
    const searchUrl = `https://wger.de/api/v2/exercise/search/?term=${encodeURIComponent(exercise_name)}&language=english&format=json`
    const searchRes = await fetch(searchUrl, { next: { revalidate: 86400 } })
    if (!searchRes.ok) throw new Error('Wger search failed')
    const searchData = await searchRes.json() as { suggestions: { value: string; data: { id: number; base_id: number } }[] }

    if (!searchData.suggestions?.length) {
      return { result: `No exercise data found for "${exercise_name}". Providing coaching from training knowledge.` }
    }

    // Fetch full exercise detail using base_id
    const baseId = searchData.suggestions[0].data.base_id
    const detailUrl = `https://wger.de/api/v2/exerciseinfo/${baseId}/?format=json`
    const detailRes = await fetch(detailUrl, { next: { revalidate: 86400 } })
    if (!detailRes.ok) throw new Error('Wger detail fetch failed')

    const detail = await detailRes.json() as {
      name_en?: string
      category: { name: string }
      muscles: { name_en: string }[]
      muscles_secondary: { name_en: string }[]
      equipment: { name: string }[]
      translations?: { language: number; name: string; description: string }[]
    }

    // Extract English translation for name + description
    const english = detail.translations?.find((t) => t.language === 2)
    const name    = english?.name ?? searchData.suggestions[0].value
    // Strip HTML tags from description
    const rawDesc = english?.description ?? ''
    const description = rawDesc.replace(/<[^>]+>/g, '').trim()

    return {
      result: {
        name,
        category: detail.category?.name ?? 'Unknown',
        primary_muscles: detail.muscles?.map((m) => m.name_en) ?? [],
        secondary_muscles: detail.muscles_secondary?.map((m) => m.name_en) ?? [],
        equipment: detail.equipment?.map((e) => e.name) ?? [],
        instructions: description || 'No official instructions available — use coaching knowledge.',
      }
    }
  } catch (err) {
    console.error('tool_getExerciseInfo error:', err)
    return { result: `Could not fetch exercise data for "${exercise_name}". Using training knowledge instead.` }
  }
}

// ── Tool 7: Save Workout Plan (AI writes directly to DB) ───────────────────
export async function tool_saveWorkoutPlan(
  day_of_week: string,
  day_type: string,
  target_muscle_groups: string[],
  exercises: { name: string; sets?: string; reps?: string; rest?: string }[],
  warmup?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('workout_plans').upsert(
    {
      user_id: user.id,
      day_of_week,
      day_type,
      warmup: warmup ?? null,
      target_muscle_groups,
      exercises,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,day_of_week' }
  )

  if (error) return { error: error.message }
  return { success: true, message: `${day_of_week} saved as a ${day_type} day with ${exercises.length} exercises.` }
}

// ── Tool 8: Get User Fitness Profile ───────────────────────────────────────
export async function tool_getUserProfile() {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('user_fitness_profile')
    .select('*')
    .eq('user_id', user.id)
    .single()

  if (error || !data) return { result: 'No fitness profile found. Ask the user for their goal, fitness level, and available equipment before giving advice.' }
  return { result: data }
}

// ── Tool 9: Save / Update User Fitness Profile ───────────────────────────
export async function tool_saveUserProfile(profile: {
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
    .upsert(
      { user_id: user.id, ...profile, updated_at: new Date().toISOString() },
      { onConflict: 'user_id' }
    )

  if (error) return { error: error.message }
  return { success: true, message: 'Fitness profile updated successfully.' }
}

// ── Tool 10: Get Progressive Overload Data ─────────────────────────────
export async function tool_getProgressiveOverload(exercise_name: string, sessions = 5) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { data, error } = await supabase
    .from('workout_logs')
    .select('logged_date, sets_completed, reps_per_set, weight_kg, rpe, notes')
    .eq('user_id', user.id)
    .ilike('exercise_name', `%${exercise_name}%`)
    .order('logged_date', { ascending: false })
    .limit(sessions)

  if (error) return { error: error.message }
  if (!data || data.length === 0) {
    return { result: `No workout logs found for "${exercise_name}". This is the first time tracking it.` }
  }

  return {
    result: {
      exercise: exercise_name,
      history: data.map(d => ({
        date: d.logged_date,
        sets: d.sets_completed,
        reps: d.reps_per_set,
        weight_kg: d.weight_kg,
        rpe: d.rpe,
        notes: d.notes,
      }))
    }
  }
}

// ── Tool 11: Log a Completed Workout Set ────────────────────────────────
export async function tool_logWorkoutSet(
  exercise_name: string,
  sets_completed: number,
  reps_per_set: string,
  weight_kg?: number,
  rpe?: number,
  notes?: string
) {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated' }

  const { error } = await supabase.from('workout_logs').insert({
    user_id: user.id,
    exercise_name,
    sets_completed,
    reps_per_set,
    weight_kg: weight_kg ?? null,
    rpe: rpe ?? null,
    notes: notes ?? null,
  })

  if (error) return { error: error.message }
  return {
    success: true,
    message: `Logged ${sets_completed}×${reps_per_set} ${exercise_name}${weight_kg ? ` at ${weight_kg}kg` : ''}${rpe ? ` (RPE ${rpe})` : ''}.`
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// TOOL DEFINITIONS — passed to Groq completions.create({ tools: ... })
// ════════════════════════════════════════════════════════════════════════════════
export const MAYAZ_OS_TOOLS = [
  {
    type: 'function' as const,
    function: {
      name: 'get_workout_schedule',
      description: "Get the user's workout plan and exercises. Use day_of_week='All' to retrieve the full weekly schedule, or a specific day name (e.g. 'Monday') for a single day.",
      parameters: {
        type: 'object',
        properties: {
          day_of_week: {
            type: 'string',
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday', 'All'],
            description: "The day to look up, or 'All' for the full week."
          }
        },
        required: ['day_of_week']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_academic_tasks',
      description: "Get the user's homework, exams, projects, and academic deadlines. Can filter by completion status and how far ahead to look.",
      parameters: {
        type: 'object',
        properties: {
          status: {
            type: 'string',
            enum: ['pending', 'in-progress', 'completed', 'all'],
            description: "Filter by task status. Use 'all' to see everything."
          },
          due_within_days: {
            type: 'number',
            description: 'How many days ahead to search. Use 1 for tomorrow, 7 for this week, 30 for this month.'
          }
        }
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_nutrition_summary',
      description: "Get all meals logged and aggregated macros (calories, protein, carbs, fat) for a specific date. Always use the user's local date in YYYY-MM-DD format.",
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: "Date in YYYY-MM-DD format. Use today's or yesterday's local date as provided in the context."
          }
        },
        required: ['date']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_sleep_log',
      description: "Get the user's sleep data (bedtime, wake time, duration, quality rating) for a specific date.",
      parameters: {
        type: 'object',
        properties: {
          date: {
            type: 'string',
            description: "Date in YYYY-MM-DD format."
          }
        },
        required: ['date']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_roadmap_progress',
      description: "Get all active learning roadmaps with their completion percentage, number of remaining topics, and the next topic to study.",
      parameters: {
        type: 'object',
        properties: {}
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_exercise_info',
      description: "Look up verified data for any exercise: primary and secondary muscles targeted, equipment needed, and official step-by-step instructions. ALWAYS call this before explaining how to do an exercise — never describe form from memory alone.",
      parameters: {
        type: 'object',
        properties: {
          exercise_name: {
            type: 'string',
            description: "The exact name of the exercise, e.g. 'Romanian Deadlift', 'Barbell Squat', 'Plank'."
          }
        },
        required: ['exercise_name']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'save_workout_plan',
      description: "Save or update a specific day's workout plan to the user's database. ONLY call this after the user explicitly confirms they want to save the plan (e.g. 'yes save it', 'apply this'). Never save without confirmation.",
      parameters: {
        type: 'object',
        properties: {
          day_of_week: {
            type: 'string',
            enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
          },
          day_type: {
            type: 'string',
            description: "Short label like 'Push', 'Pull', 'Legs', 'Full Body', 'Rest', 'Cardio'."
          },
          target_muscle_groups: {
            type: 'array',
            items: { type: 'string' },
            description: 'Array of muscle groups targeted, e.g. ["Chest", "Triceps", "Shoulders"].'
          },
          exercises: {
            type: 'array',
            items: {
              type: 'object',
              properties: {
                name: { type: 'string' },
                sets: { type: 'string' },
                reps: { type: 'string' },
                rest: { type: 'string' }
              },
              required: ['name']
            },
            description: 'Array of exercises with name, sets, reps, and optional rest period.'
          },
          warmup: {
            type: 'string',
            description: 'Optional warmup instructions, e.g. "5 mins walk + hip circles".'
          }
        },
        required: ['day_of_week', 'day_type', 'target_muscle_groups', 'exercises']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_user_profile',
      description: "Retrieve the user's saved fitness profile: height, weight, age, fitness level, primary goal, available equipment, training days per week, experience, and any injuries. In Coach Mode, ALWAYS call this first before giving any fitness advice — it allows fully personalized responses without asking the same questions repeatedly.",
      parameters: { type: 'object', properties: {} }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'save_user_profile',
      description: "Save or update the user's fitness profile. Call this after the user shares their stats or goal changes. Only call with the fields you actually have — omit any unknown fields.",
      parameters: {
        type: 'object',
        properties: {
          height_cm:              { type: 'number',  description: 'Height in centimeters.' },
          weight_kg:              { type: 'number',  description: 'Body weight in kilograms.' },
          age:                    { type: 'integer', description: 'Age in years.' },
          sex:                    { type: 'string',  enum: ['male', 'female', 'other', 'prefer_not_to_say'] },
          fitness_level:          { type: 'string',  enum: ['beginner', 'intermediate', 'advanced'] },
          primary_goal:           { type: 'string',  description: "e.g. 'fat_loss', 'muscle_gain', 'strength', 'recomposition', 'posture', 'endurance'" },
          secondary_goals:        { type: 'array',   items: { type: 'string' }, description: 'Additional goals.' },
          available_equipment:    { type: 'array',   items: { type: 'string' }, description: "e.g. ['barbell', 'dumbbells', 'cables', 'machines', 'bodyweight']" },
          training_days_per_week: { type: 'integer', description: 'How many days per week the user can train.' },
          experience_years:       { type: 'number',  description: 'Years of consistent training experience.' },
          injuries_limitations:   { type: 'string',  description: 'Free text: any injuries or movement restrictions.' }
        }
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'get_progressive_overload',
      description: "Get the last N sessions of a specific exercise to show weight/reps progression. Use this when discussing any exercise the user has logged before — it lets you say 'last week you did 60kg, try 62.5kg today' instead of guessing. Always call this alongside get_exercise_info for a complete picture.",
      parameters: {
        type: 'object',
        properties: {
          exercise_name: { type: 'string', description: "Name of the exercise, e.g. 'Barbell Squat', 'Romanian Deadlift'." },
          sessions:      { type: 'integer', description: 'Number of past sessions to retrieve. Default 5.' }
        },
        required: ['exercise_name']
      }
    }
  },
  {
    type: 'function' as const,
    function: {
      name: 'log_workout_set',
      description: "Log a completed exercise set with weight, reps, and optional RPE. Only call this when the user explicitly says they finished a set (e.g. 'done', 'logged', 'just did'). Never log without the user reporting it.",
      parameters: {
        type: 'object',
        properties: {
          exercise_name:  { type: 'string',  description: 'Name of the exercise.' },
          sets_completed: { type: 'integer', description: 'Number of sets completed.' },
          reps_per_set:   { type: 'string',  description: "Reps per set, e.g. '8' or '8,8,7' if they varied." },
          weight_kg:      { type: 'number',  description: 'Weight used in kg. Omit for bodyweight exercises.' },
          rpe:            { type: 'integer', description: 'Rate of Perceived Exertion 1-10. Optional.' },
          notes:          { type: 'string',  description: 'Optional note, e.g. "felt strong", "knees caved slightly".' }
        },
        required: ['exercise_name', 'sets_completed', 'reps_per_set']
      }
    }
  }
] as const

// ── Tool dispatcher — routes AI tool_call to the correct executor ─────────────
export async function dispatchTool(name: string, args: Record<string, unknown>) {
  switch (name) {
    case 'get_workout_schedule':
      return tool_getWorkoutSchedule(args.day_of_week as string)
    case 'get_academic_tasks':
      return tool_getAcademicTasks(
        (args.status as string) ?? 'all',
        (args.due_within_days as number) ?? 30
      )
    case 'get_nutrition_summary':
      return tool_getNutritionSummary(args.date as string)
    case 'get_sleep_log':
      return tool_getSleepLog(args.date as string)
    case 'get_roadmap_progress':
      return tool_getRoadmapProgress()
    case 'get_exercise_info':
      return tool_getExerciseInfo(args.exercise_name as string)
    case 'save_workout_plan':
      return tool_saveWorkoutPlan(
        args.day_of_week as string,
        args.day_type as string,
        args.target_muscle_groups as string[],
        args.exercises as { name: string; sets?: string; reps?: string; rest?: string }[],
        args.warmup as string | undefined
      )
    case 'get_user_profile':
      return tool_getUserProfile()
    case 'save_user_profile':
      return tool_saveUserProfile(args as Parameters<typeof tool_saveUserProfile>[0])
    case 'get_progressive_overload':
      return tool_getProgressiveOverload(
        args.exercise_name as string,
        (args.sessions as number) ?? 5
      )
    case 'log_workout_set':
      return tool_logWorkoutSet(
        args.exercise_name as string,
        args.sets_completed as number,
        args.reps_per_set as string,
        args.weight_kg as number | undefined,
        args.rpe as number | undefined,
        args.notes as string | undefined
      )
    default:
      return { error: `Unknown tool: ${name}` }
  }
}

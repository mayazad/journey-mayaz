'use server'

import Groq from 'groq-sdk'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createRoadmap, bulkInsertNodes } from './learning'

// ── Groq client (server-only — GROQ_API_KEY has no NEXT_PUBLIC_ prefix) ──────
function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey || apiKey === 'your-groq-api-key-here') return null
  return new Groq({ apiKey })
}

function getTimeOfDay(): string {
  const h = new Date().getHours()
  if (h < 12) return 'morning'
  if (h < 17) return 'afternoon'
  return 'evening'
}

function parseJsonFromGroq(raw: string): unknown {
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  const start = cleaned.indexOf('{')
  const end   = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON object found')
  return JSON.parse(cleaned.slice(start, end + 1))
}

function parseJsonArrayFromGroq(raw: string): unknown[] {
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  const start = cleaned.indexOf('[')
  const end   = cleaned.lastIndexOf(']')
  if (start === -1 || end === -1) throw new Error('No JSON array found')
  return JSON.parse(cleaned.slice(start, end + 1)) as unknown[]
}

// ════════════════════════════════════════════════════════════════════════════════
// PERSONALIZED DAILY BRIEFING — cached 2x per day (morning + afternoon slots)
// Addresses user by name. Uses workout_plans + academic_tasks + roadmaps.
// VAULT DATA IS NEVER ACCESSED HERE — INTENTIONAL.
// ════════════════════════════════════════════════════════════════════════════════
export async function generateDailyBriefing(
  opts: { skipCache?: boolean } = {}
): Promise<{ markdown: string; userName: string }> {
  const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? ''

  const fallbackName = 'there'
  function fallback(name: string): { markdown: string; userName: string } {
    return {
      userName: name,
      markdown: `## Ready when you are, ${name}\n\n- Add your **Groq API key** to \`.env.local\` to enable personalized AI briefings.\n- Connect your **Supabase project** and run the schema files to start tracking.\n- Once configured, I'll brief you twice a day — morning and afternoon.`,
    }
  }

  if (!supabaseUrl.startsWith('http')) return fallback(fallbackName)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fallback(fallbackName)

  // Resolve first name
  const rawName = (user.user_metadata?.full_name as string | undefined) ||
                  (user.user_metadata?.name as string | undefined) ||
                  user.email?.split('@')[0] ||
                  fallbackName
  const nameParts = rawName.trim().split(/\s+/)
  let firstName = nameParts[0]
  if (firstName.toLowerCase() === 'md' && nameParts.length > 1) {
    firstName = nameParts[nameParts.length - 1]
  }

  // Determine cache slot
  const now        = new Date()
  const period     = now.getHours() < 12 ? 'morning' : 'afternoon'
  const todayDate  = now.toISOString().split('T')[0] // YYYY-MM-DD
  const dateLabel  = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  const DAYS       = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday']
  const todayName  = DAYS[now.getDay()]
  const in7Days    = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

  // ── Check cache (skip if /dailybrief forces a fresh generation) ──
  if (!opts.skipCache) {
    const { data: cached } = await supabase
      .from('daily_briefings')
      .select('markdown')
      .eq('user_id', user.id)
      .eq('date', todayDate)
      .eq('period', period)
      .single()
    if (cached?.markdown) {
      return { userName: firstName, markdown: cached.markdown }
    }
  }

  // ── Fetch context data in parallel ──
  const [planResult, tasksResult, roadmapsResult] = await Promise.all([
    supabase
      .from('workout_plans')
      .select('day_type, target_muscle_groups, exercises')
      .eq('user_id', user.id)
      .eq('day_of_week', todayName)
      .single(),
    supabase
      .from('academic_tasks')
      .select('title, type, due_date, status')
      .eq('user_id', user.id)
      .in('status', ['pending', 'in-progress'])
      .lte('due_date', in7Days)
      .order('due_date', { ascending: true })
      .limit(6),
    supabase
      .from('roadmaps')
      .select('title')
      .eq('user_id', user.id)
      .limit(5),
  ])

  // ── Build rich context string ──
  let workoutSection: string
  if (planResult.data) {
    const p = planResult.data
    const muscles = (p.target_muscle_groups ?? []).join(', ') || 'not specified'
    const exList  = Array.isArray(p.exercises) && p.exercises.length > 0
      ? p.exercises.map((e: { name: string; sets?: string; reps?: string }) =>
          e.sets && e.reps ? `${e.name} — ${e.sets} sets × ${e.reps} reps` : e.name
        ).join('\n  ')
      : 'No exercises listed yet'
    workoutSection = `TODAY'S WORKOUT (${todayName} = ${p.day_type} day):\n  Muscles: ${muscles}\n  Exercises:\n  ${exList}`
  } else {
    workoutSection = `TODAY'S WORKOUT: No plan set for ${todayName}. Suggest a rest day or light activity.`
  }

  const tasksSection = tasksResult.data?.length
    ? `UPCOMING TASKS (next 7 days):\n${tasksResult.data.map(t =>
        `  - [${t.type.toUpperCase()}] "${t.title}" — due ${
          new Date(t.due_date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })
        } (${t.status})`
      ).join('\n')}`
    : 'UPCOMING TASKS: None due this week — good to get ahead.'

  const learningSection = roadmapsResult.data?.length
    ? `ACTIVE LEARNING ROADMAPS: ${roadmapsResult.data.map(r => `"${r.title}"`).join(', ')}`
    : 'ACTIVE LEARNING ROADMAPS: None set up yet.'

  const context = `Date: ${dateLabel} (${period} session)\nUser first name: ${firstName}\n\n${workoutSection}\n\n${tasksSection}\n\n${learningSection}`

  // ── Tone differs by period ──
  const toneInstruction = period === 'morning'
    ? 'It is morning. Be energizing and focused. Help the user start the day with clarity and momentum.'
    : 'It is afternoon. Be a calm check-in. Acknowledge what they may have already done and help them refocus for the rest of the day.'

  const groq = getGroqClient()
  if (!groq) return fallback(firstName)

  let markdown: string
  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are the personal AI inside Mayaz OS — a premium life-management app. You speak directly to ${firstName} in a warm, sharp, personal tone. ${toneInstruction}

Rules:
- Use clean markdown: ## headings for sections, bullet points for lists
- Be specific — mention actual exercise names, task titles, roadmap names
- Under 220 words total
- No filler phrases like "Great news!" or "Don't forget to..."
- No emojis
- Do not start with "Good morning/afternoon" — start directly with the user's name or a strong opening line`,
        },
        {
          role: 'user',
          content: `Write ${firstName}'s personalized ${period} briefing.\n\nData:\n${context}`,
        },
      ],
      max_tokens: 500,
      temperature: 0.6,
    })
    markdown = completion.choices[0]?.message?.content ?? fallback(firstName).markdown
  } catch (err) {
    console.error('Groq briefing error:', err)
    return fallback(firstName)
  }

  // ── Cache result (only if not skipped) ──
  if (!opts.skipCache) {
    await supabase.from('daily_briefings').upsert(
      { user_id: user.id, date: todayDate, period, markdown },
      { onConflict: 'user_id,date,period' }
    )
  }

  return { userName: firstName, markdown }
}

// ════════════════════════════════════════════════════════════════════════════════
// HOME AI CHAT
// Context-aware chat for the home floating panel.
// Uses the same data snapshot as the briefing but never accesses Vault.
// ════════════════════════════════════════════════════════════════════════════════
export async function chatWithAI(
  message: string,
  contextSnapshot: string
): Promise<{ reply: string } | { error: string }> {
  const groq = getGroqClient()
  if (!groq) return { error: 'Groq API key not configured.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const rawName = (user.user_metadata?.full_name as string | undefined) ||
                  (user.user_metadata?.name as string | undefined) ||
                  user.email?.split('@')[0] || 'there'
  const nameParts = rawName.trim().split(/\s+/)
  let firstName = nameParts[0]
  if (firstName.toLowerCase() === 'md' && nameParts.length > 1) {
    firstName = nameParts[nameParts.length - 1]
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are the personal AI inside Mayaz OS. You are chatting directly with ${firstName}. Be concise, direct, and personal. You have access to their daily context below — use it when relevant. Do not access or mention Vault/password data. No emojis. Under 150 words per reply.\n\nContext:\n${contextSnapshot}`,
        },
        { role: 'user', content: message },
      ],
      max_tokens: 350,
      temperature: 0.65,
    })
    const reply = completion.choices[0]?.message?.content ?? 'Sorry, I couldn\'t generate a response.'
    return { reply }
  } catch (err) {
    console.error('chatWithAI error:', err)
    return { error: 'Failed to get a response. Try again.' }
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// PARSE ROADMAP FROM RAW TEXT
// User pastes any unstructured text (ChatGPT output, notes, etc.)
// AI returns structured nodes array → saved to Supabase
// ════════════════════════════════════════════════════════════════════════════════
export async function parseRoadmapFromText(
  rawText: string,
  title: string,
  description?: string
): Promise<{ success: true; roadmapId: string; nodeCount: number } | { error: string }> {
  const groq = getGroqClient()
  if (!groq) return { error: 'Groq API key not configured. Add GROQ_API_KEY to .env.local.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  let nodes: { title: string; description?: string; order_index: number; parent_ids?: string[] }[]

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You convert unstructured learning roadmap text into a structured JSON array of nodes.
Each node must have:
- "title": string (topic name, short, max 50 chars)
- "description": string or null (1 sentence explanation)
- "order_index": number (0-based sequence)

Rules:
- Extract every distinct topic, concept, or skill mentioned.
- Preserve the logical sequence (basics before advanced).
- Maximum 25 nodes.
- Return ONLY a valid JSON array, nothing else.
- Example: [{"title":"Variables & Types","description":"Basic data types","order_index":0}, ...]`,
        },
        {
          role: 'user',
          content: `Roadmap title: "${title}"\n\nRaw content:\n${rawText.slice(0, 3000)}`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    })

    nodes = parseJsonArrayFromGroq(
      completion.choices[0]?.message?.content ?? '[]'
    ) as typeof nodes
  } catch (err) {
    console.error('parseRoadmapFromText error:', err)
    return { error: 'Could not parse the roadmap. Try providing cleaner, more structured text.' }
  }

  if (!nodes || nodes.length === 0) {
    return { error: 'No topics were found in the text. Make sure the content describes a learning path.' }
  }

  // Create the roadmap
  const { id: roadmapId, error: createError } = await createRoadmap(title, description)
  if (createError || !roadmapId) return { error: createError ?? 'Failed to create roadmap.' }

  // Bulk insert nodes
  const { error: insertError } = await bulkInsertNodes(roadmapId, nodes)
  if (insertError) return { error: insertError }

  revalidatePath('/learning')
  return { success: true, roadmapId, nodeCount: nodes.length }
}

// ════════════════════════════════════════════════════════════════════════════════
// APPEND NODES TO EXISTING ROADMAP (add more topics later)
// ════════════════════════════════════════════════════════════════════════════════
export async function appendNodesToRoadmap(
  roadmapId: string,
  rawText: string,
  roadmapTitle: string
): Promise<{ success: true; nodeCount: number } | { error: string }> {
  const groq = getGroqClient()
  if (!groq) return { error: 'Groq API key not configured.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  let nodes: { title: string; description?: string; order_index: number }[]

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You convert unstructured learning roadmap text into a structured JSON array of nodes.
Each node must have:
- "title": string (topic name, short, max 50 chars)
- "description": string or null (1 sentence explanation)
- "order_index": number (0-based sequence)

Rules:
- Extract every distinct topic, concept, or skill mentioned.
- Preserve the logical sequence (basics before advanced).
- Maximum 25 nodes.
- Return ONLY a valid JSON array, nothing else.`,
        },
        {
          role: 'user',
          content: `Roadmap: "${roadmapTitle}"\n\nAdditional content to add:\n${rawText.slice(0, 3000)}`,
        },
      ],
      max_tokens: 2000,
      temperature: 0.1,
    })

    nodes = parseJsonArrayFromGroq(
      completion.choices[0]?.message?.content ?? '[]'
    ) as typeof nodes
  } catch (err) {
    console.error('appendNodesToRoadmap error:', err)
    return { error: 'Could not parse the content. Try providing clearer topic names.' }
  }

  if (!nodes || nodes.length === 0) {
    return { error: 'No topics found. Make sure the content describes learning topics.' }
  }

  const { error: insertError } = await bulkInsertNodes(roadmapId, nodes)
  if (insertError) return { error: insertError }

  revalidatePath('/learning')
  revalidatePath(`/learning/${roadmapId}`)
  return { success: true, nodeCount: nodes.length }
}

// ════════════════════════════════════════════════════════════════════════════════
// AI-ASSISTED TASK ENTRY — Step 1: Preview (parse only, no save)
// ════════════════════════════════════════════════════════════════════════════════
export async function previewTask(
  text: string
): Promise<{ preview: { title: string; type: string; due_date: string; notes: string | null } } | { error: string }> {
  const groq = getGroqClient()
  if (!groq) return { error: 'Groq API key not configured.' }

  const todayStr = new Date().toISOString().split('T')[0]
  let parsed: { title?: string; type?: string; due_date?: string; notes?: string }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `Extract academic task data from natural language. Return ONLY valid JSON:
- title: string (task name)
- type: string (assignment/exam/presentation/hackathon/project/other)
- due_date: ISO 8601 datetime (infer from text; today is ${todayStr}T23:59:00)
- notes: string or null`,
        },
        { role: 'user', content: text },
      ],
      max_tokens: 300,
      temperature: 0.1,
    })
    parsed = parseJsonFromGroq(completion.choices[0]?.message?.content ?? '{}') as typeof parsed
  } catch {
    return { error: 'Could not parse. Try: "OS Assignment due next Monday, worth 20%"' }
  }

  return {
    preview: {
      title: parsed.title ?? text.slice(0, 80),
      type: parsed.type ?? 'other',
      due_date: parsed.due_date ?? new Date(Date.now() + 7 * 86400000).toISOString(),
      notes: parsed.notes ?? null,
    }
  }
}

// Step 2: Confirm & save task
export async function aiAddTask(
  text: string
): Promise<{ success: true; summary: string } | { error: string }> {
  const groq = getGroqClient()
  if (!groq) return { error: 'Groq API key not configured.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  const todayStr = new Date().toISOString().split('T')[0]
  let parsed: { title?: string; type?: string; due_date?: string; notes?: string }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `Extract academic task data from natural language. Return ONLY valid JSON:
- title: string (task name)
- type: string (assignment/exam/presentation/hackathon/project/other)
- due_date: ISO 8601 datetime (infer from text; today is ${todayStr}T23:59:00)
- notes: string or null`,
        },
        { role: 'user', content: text },
      ],
      max_tokens: 300,
      temperature: 0.1,
    })
    parsed = parseJsonFromGroq(completion.choices[0]?.message?.content ?? '{}') as typeof parsed
  } catch {
    return { error: 'Could not parse. Try: "OS Assignment due next Monday, worth 20%"' }
  }

  const { error } = await supabase.from('academic_tasks').insert({
    user_id: user.id,
    title: parsed.title ?? text.slice(0, 80),
    type: parsed.type ?? 'other',
    due_date: parsed.due_date ?? new Date(Date.now() + 7 * 86400000).toISOString(),
    status: 'pending',
    notes: parsed.notes ?? null,
  })

  if (error) return { error: error.message }
  revalidatePath('/academics')
  revalidatePath('/home')

  const dueLabel = parsed.due_date ? new Date(parsed.due_date).toLocaleDateString('en-US', { month: 'short', day: 'numeric' }) : 'next week'
  return { success: true, summary: `Saved: "${parsed.title}" due ${dueLabel}` }
}

// ════════════════════════════════════════════════════════════════════════════════
// AI-ASSISTED WORKOUT PLAN ENTRY — Step 1: Preview (parse only, no save)
// ════════════════════════════════════════════════════════════════════════════════
export async function previewWorkoutPlan(
  text: string
): Promise<{ preview: { day_of_week: string; day_type: string; target_muscle_groups: string[]; exercises: string[] } } | { error: string }> {
  const groq = getGroqClient()
  if (!groq) return { error: 'Groq API key not configured.' }

  const todayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]

  const dayMatch = text.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i)
  const inferredDay = dayMatch ? dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1).toLowerCase() : todayName

  let parsed: { day_of_week?: string; day_type?: string; target_muscle_groups?: string[]; exercises?: string[] }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are a fitness assistant that parses workout plans from casual, conversational text.
Today is ${todayName}. User explicitly or implicitly requested: ${inferredDay}.

Extract the workout details and return ONLY a valid JSON object with these fields:
{
  "day_of_week": "Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday",
  "day_type": "short workout type e.g. Push, Pull, Legs, Cardio, Home Workout, Rest, Full Body, Light",
  "target_muscle_groups": ["array of muscles targeted, e.g. Chest, Triceps"],
  "exercises": ["exercise name with sets/reps if given, e.g. Pushups 3x15", "Plank 3x60s"]
}

IMPORTANT RULES:
- If the user mentions exercises (pushups, plank, etc.) ALWAYS include them in exercises[] even if they also say 'rest day'
- If they say 'rest day' but also mention exercises, use day_type = 'Light' or 'Home Workout'
- If no day is mentioned, default to ${inferredDay}
- If no sets/reps given, include the exercise name only
- target_muscle_groups can be inferred from exercises (pushups → Chest, Triceps)
- Be flexible with casual language like "ok so", "I wanted", "something like"
- Return ONLY the JSON object, no explanation`,
        },
        { role: 'user', content: text },
      ],
      max_tokens: 500,
      temperature: 0.1,
    })
    parsed = parseJsonFromGroq(completion.choices[0]?.message?.content ?? '{}') as typeof parsed
  } catch {
    return { error: 'Could not understand that. Try: "Friday is home workout — pushups 3x15 and plank 3x60s"' }
  }

  // Ensure we never return an empty exercises list if exercises were mentioned in the text
  const exercises = parsed.exercises ?? []

  return {
    preview: {
      day_of_week: parsed.day_of_week ?? inferredDay,
      day_type: parsed.day_type ?? 'Custom',
      target_muscle_groups: parsed.target_muscle_groups ?? [],
      exercises,
    }
  }
}

// Step 2: Confirm & save workout plan
export async function aiSetDayPlan(
  text: string
): Promise<{ success: true; summary: string } | { error: string }> {
  const groq = getGroqClient()
  if (!groq) return { error: 'Groq API key not configured.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  let parsed: { day_of_week?: string; day_type?: string; target_muscle_groups?: string[]; exercises?: string[] }

  const todayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]

  const dayMatch = text.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i)
  const inferredDay = dayMatch ? dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1).toLowerCase() : todayName

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are a fitness assistant that parses workout plans from casual, conversational text.
Today is ${todayName}. User explicitly or implicitly requested: ${inferredDay}.

Extract the workout details and return ONLY a valid JSON object:
{
  "day_of_week": "Monday|Tuesday|Wednesday|Thursday|Friday|Saturday|Sunday",
  "day_type": "short workout type e.g. Push, Pull, Legs, Cardio, Home Workout, Rest, Full Body, Light",
  "target_muscle_groups": ["muscles targeted"],
  "exercises": ["exercise name with sets/reps if given"]
}

IMPORTANT RULES:
- If the user mentions exercises, ALWAYS include them even if they also say 'rest day'
- If they say 'rest day' but mention exercises, use day_type = 'Light' or 'Home Workout'
- If no day is mentioned, default to ${inferredDay}
- Be flexible with casual language
- Return ONLY the JSON object`,
        },
        { role: 'user', content: text },
      ],
      max_tokens: 500,
      temperature: 0.1,
    })
    parsed = parseJsonFromGroq(completion.choices[0]?.message?.content ?? '{}') as typeof parsed
  } catch {
    return { error: 'Could not understand that. Try: "Friday is home workout — pushups 3x15 and plank 3x60s"' }
  }

  const exercises = (parsed.exercises ?? []).map((e) => {
    const match = String(e).match(/^(.+?)\s+(\d+)x(\d+)$/)
    if (match) return { name: match[1].trim(), sets: match[2], reps: match[3] }
    return { name: String(e) }
  })

  const { error } = await supabase.from('workout_plans').upsert(
    {
      user_id: user.id,
      day_of_week: parsed.day_of_week ?? 'Monday',
      day_type: parsed.day_type ?? 'Custom',
      target_muscle_groups: parsed.target_muscle_groups ?? [],
      exercises,
      updated_at: new Date().toISOString(),
    },
    { onConflict: 'user_id,day_of_week' }
  )

  if (error) return { error: error.message }
  revalidatePath('/fitness')
  revalidatePath('/home')

  return {
    success: true,
    summary: `Set ${parsed.day_of_week} as ${parsed.day_type} day${parsed.exercises?.length ? ` · ${parsed.exercises.length} exercises` : ''}`,
  }
}

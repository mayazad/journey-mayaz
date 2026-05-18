'use server'

import Groq from 'groq-sdk'
import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import { createRoadmap, bulkInsertNodes } from './learning'
import { MAYAZ_OS_TOOLS, dispatchTool } from './tools'

// ── Groq key resolver — admin uses env key, others use their stored key ─────
async function resolveGroqKey(): Promise<{ groq: Groq; isAdmin: boolean } | null> {
  try {
    const supabase = await createClient()
    const { data: { user } } = await supabase.auth.getUser()
    if (!user) return null

    const { data: profile } = await supabase
      .from('profiles')
      .select('is_admin, groq_api_key')
      .eq('id', user.id)
      .single()

    if (profile?.is_admin) {
      const envKey = process.env.GROQ_API_KEY
      if (!envKey || envKey === 'your-groq-api-key-here') return null
      return { groq: new Groq({ apiKey: envKey }), isAdmin: true }
    }

    if (profile?.groq_api_key) {
      return { groq: new Groq({ apiKey: profile.groq_api_key }), isAdmin: false }
    }

    return null // user hasn't set their key yet
  } catch {
    return null
  }
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
  function fallback(name: string, isAdminUser: boolean): { markdown: string; userName: string } {
    return {
      userName: name,
      markdown: isAdminUser
        ? `## Ready when you are, ${name}\n\n- Add your **Groq API key** to \`.env.local\` to enable personalized AI briefings.\n- Once configured, I'll brief you twice a day — morning and afternoon.`
        : `## Ready when you are, ${name}\n\n- Add your **Groq API key** in Settings to unlock your personalized AI briefings and features.\n- Once configured, I'll brief you twice a day — morning and afternoon.`,
    }
  }

  if (!supabaseUrl.startsWith('http')) return fallback(fallbackName, false)

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return fallback(fallbackName, false)

  const { data: profile } = await supabase
    .from('profiles')
    .select('is_admin')
    .eq('id', user.id)
    .single()
  const isAdmin = profile?.is_admin ?? false

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

  // Determine cache slot in user's local timezone
  const now        = new Date()
  let userTz       = 'UTC'
  try {
    const { cookies } = await import('next/headers')
    const cookieStore = await cookies()
    userTz = cookieStore.get('user-timezone')?.value || 'UTC'
  } catch (e) {
    console.error('Failed to read timezone cookie:', e)
  }

  // Format current hour in user's local timezone
  let serverHour = now.getHours()
  try {
    const formatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTz,
      hour: 'numeric',
      hour12: false,
    })
    serverHour = parseInt(formatter.format(now), 10)
  } catch (e) {
    console.error('Timezone format failed, fallback to server time:', e)
  }

  const period     = serverHour < 12 ? 'morning' : 'afternoon'
  
  // Format current date and day name in user's local timezone
  let todayDate = now.toISOString().split('T')[0]
  let dateLabel = now.toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })
  let todayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][now.getDay()]
  try {
    const dFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTz,
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    })
    const formattedParts = dFormatter.formatToParts(now)
    const y = formattedParts.find(p => p.type === 'year')?.value ?? ''
    const m = formattedParts.find(p => p.type === 'month')?.value ?? ''
    const d = formattedParts.find(p => p.type === 'day')?.value ?? ''
    if (y && m && d) {
      todayDate = `${y}-${m}-${d}`
    }

    dateLabel = now.toLocaleDateString('en-US', {
      timeZone: userTz,
      weekday: 'long',
      month: 'long',
      day: 'numeric',
    })

    const dayFormatter = new Intl.DateTimeFormat('en-US', {
      timeZone: userTz,
      weekday: 'long',
    })
    todayName = dayFormatter.format(now)
  } catch (e) {
    console.error('Timezone date conversion failed:', e)
  }

  const in7Days = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString()

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

  const resolved = await resolveGroqKey()
  if (!resolved) return fallback(firstName, isAdmin)

  let markdown: string
  try {
    const completion = await resolved.groq.chat.completions.create({
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
    markdown = completion.choices[0]?.message?.content ?? fallback(firstName, isAdmin).markdown
  } catch (err) {
    console.error('Groq briefing error:', err)
    return fallback(firstName, isAdmin)
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
// CHAT HISTORY PERSISTENCE
// ════════════════════════════════════════════════════════════════════════════════
export async function getChatHistory(mode: 'general' | 'coach' = 'general') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return []

  const { data, error } = await supabase
    .from('chat_messages')
    .select('id, role, content, created_at')
    .eq('user_id', user.id)
    .eq('mode', mode)
    .order('created_at', { ascending: true })
    .limit(30)

  if (error) {
    console.error('Failed to get chat history:', error)
    return []
  }

  return data.map(msg => ({
    id: msg.id,
    role: msg.role as 'user' | 'assistant',
    content: msg.content,
  }))
}

export async function saveChatMessage(role: 'user' | 'assistant', content: string, mode: 'general' | 'coach' = 'general') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return null

  const { data, error } = await supabase
    .from('chat_messages')
    .insert({
      user_id: user.id,
      role,
      content,
      mode,
    })
    .select('id')
    .single()

  if (error) {
    console.error('Failed to save chat message:', error)
    return null
  }

  return data.id
}

export async function clearChatHistory(mode?: 'general' | 'coach') {
  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return

  const query = supabase.from('chat_messages').delete().eq('user_id', user.id)
  if (mode) {
    await query.eq('mode', mode)
  } else {
    await query
  }
}

// ════════════════════════════════════════════════════════════════════════════════
// HOME AI CHAT — Agentic Tool-Calling RAG
// Round 1: AI picks which tool(s) to call based on the user's question.
// Round 2: AI receives fresh DB results and produces a fully grounded answer.
// Vault is structurally absent — no tool exists to access it.
// ════════════════════════════════════════════════════════════════════════════════
export async function chatWithAI(
  message: string,
  contextSnapshot: string,
  clientTime?: string,
  clientDateISO?: string,  // YYYY-MM-DD from browser — used by nutrition/sleep tools
  chatHistory?: { role: 'user' | 'assistant'; content: string }[],  // prior conversation turns
  coachMode?: boolean   // true = full fitness coaching rules active
): Promise<{ reply: string } | { error: string }> {
  const resolved = await resolveGroqKey()
  if (!resolved) return { error: 'Please add your Groq API key in Settings to use AI chat.' }

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

  const systemContent = `You are the personal AI inside Mayaz OS, speaking directly to ${firstName}. You are both a general assistant AND a professional fitness coach.

You have access to live tools that query ${firstName}'s real database. Always prefer calling a tool over guessing.

== GENERAL RULES ==
1. CHIT-CHAT IS ALLOWED: For casual messages ("hi", "what's up", general questions), reply naturally and conversationally. Do NOT force data or call tools.
2. For questions about workouts, tasks, nutrition, sleep, or learning — call the appropriate tool. Never guess or invent data.
3. If a tool returns no data, say clearly there is nothing recorded — never make something up.
4. Do NOT access or mention Vault/password data. It does not exist in your toolset.
5. Be specific with numbers from tool results (e.g. "You logged 1,850 calories").
6. RESPONSE LENGTH: Match the length to the complexity of the question. Simple questions get short answers. Detailed questions (exercise form, workout plans, plan reviews) get full structured responses. Maximum 600 words for general replies, up to full detail for fitness coaching.
${clientTime ? `\nUser's current local date and time: ${clientTime}` : ''}
${clientDateISO ? `User's current local date (YYYY-MM-DD): ${clientDateISO}` : ''}

${coachMode ? `== COACH MODE — ACTIVE ==
You are now acting as a professional fitness coach. The user has explicitly enabled this mode.

STEP 0 — ALWAYS DO THIS FIRST: Call get_user_profile() before responding to ANY fitness question. 
* IMPORTANT (PARALLEL TOOL CALLS): If the user is sharing their height, weight, age, or goals in their very first message, call BOTH get_user_profile() AND save_user_profile() in parallel during the first round to instantly persist their data without waiting.
* If no profile exists, ask the user 1-2 clarifying questions for missing details (like goals or fitness level) so you can finish configuring their profile.

A. EXERCISE FORM QUESTIONS — When the user asks how to do an exercise:
   1. Call get_exercise_info() AND get_progressive_overload() in the same round.
   2. Structure your response EXACTLY as:
      MUSCLES TARGETED: (list primary, then secondary)
      STEP-BY-STEP FORM: (numbered, one action per step)
      WHERE YOU SHOULD FEEL IT: (specific body-part sensation cues so they self-verify)
      COMMON MISTAKES TO AVOID: (3–4 specific errors)
      YOUR HISTORY: (if they have past logs, show last 3 sessions + suggest today's target weight)
      YOUR PLAN: (if this exercise is in their DB schedule, show the sets/reps)

B. GOAL-BASED PLANNING — When the user mentions any fitness goal:
   1. Call get_user_profile() first. Use it to tailor the plan precisely.
   2. Different goals need different approaches:
      - Fat loss → moderate deficit, compound lifts, preserve muscle, avoid excessive cardio
      - Muscle building → progressive overload, slight surplus, compound + isolation
      - Strength → low reps, heavy weight, long rest, powerlifting movements
      - Posture / mobility → posterior chain work, stretching, corrective exercises
      - Skinny fat recomposition → build muscle first at maintenance calories, then cut
      - Endurance → cardio periodisation, zone 2 training, lighter weights high reps
   3. Ask ONE clarifying question only if critical info is missing (equipment, days/week).
   4. Generate a full structured weekly plan with warmup, exercises, sets/reps, rest days.
   5. After presenting, ask: "Want me to save this to your schedule?"
   6. Only call save_workout_plan() if the user explicitly confirms.

C. PLAN EVALUATION & HOLISTIC REVIEW — When asked to review their plan or check recovery:
   1. Call ALL three tools: get_workout_schedule('All'), get_nutrition_summary(date), get_sleep_log(date).
   2. Also call get_user_profile() to check if the plan matches their stated goal.
   3. Structure: Training | Nutrition | Recovery | Profile Match | Overall Verdict
   4. Be specific — name exact exercises to swap, exact protein targets, exact sleep hours.

D. LOGGING — When the user says they completed a set (e.g. "done", "just did", "finished"):
   1. Ask for weight and RPE if not provided.
   2. Call log_workout_set() only after confirmation.
   3. Immediately compare to their last session: "Last time you did 60kg. You just hit 62.5kg — that's progress."

E. PROFILE UPDATES, CONFLICTS & CONFIRMATIONS — When the user shares any new personal info (weight, goal change, new injury, etc.):
   1. CHECK FOR CONFLICTS: Compare the new info against what is currently saved in their profile:
      - If the field is currently EMPTY or UNSET in their profile: Silently call save_user_profile() to set it, and acknowledge briefly.
      - If the field has an EXISTING value that conflicts with what they just said: Do NOT call save_user_profile() yet. Instead, politely point out the conflict (e.g., "Your profile lists your weight as 75kg, but you mentioned 80kg today...") and ask if they would like you to update it (e.g., "Would you like me to update your profile weight to 80kg?").
      - Only call save_user_profile() in the subsequent turn once they explicitly confirm ("yes", "go ahead", etc.).` : ''}

Context (pre-loaded snapshot for general awareness):
${contextSnapshot}`


  const userMessage = { role: 'user' as const, content: message }
  const systemMessage = { role: 'system' as const, content: systemContent }

  // Keep only the last 6 turns (3 user + 3 assistant) to stay within Vercel 10s timeout and Groq TPM limits
  const recentHistory = (chatHistory ?? []).slice(-6)

  try {
    let messages: any[] = [
      systemMessage,
      ...recentHistory,
      userMessage,
    ]

    let rounds = 0
    const maxRounds = 4

    while (rounds < maxRounds) {
      const response = await resolved.groq.chat.completions.create({
        model: 'llama-3.1-8b-instant',
        tools: MAYAZ_OS_TOOLS as unknown as Parameters<typeof resolved.groq.chat.completions.create>[0]['tools'],
        tool_choice: 'auto',
        messages,
        max_tokens: 2048,
        temperature: 0.3,
      })

      const choice = response.choices[0]
      if (!choice) break

      const assistantMessage = choice.message
      messages.push(assistantMessage)

      // If the model requested tool calls, execute them and continue the loop
      if (assistantMessage.tool_calls && assistantMessage.tool_calls.length > 0) {
        for (const tc of assistantMessage.tool_calls) {
          let args: Record<string, unknown> = {}
          try { args = JSON.parse(tc.function.arguments) } catch { /* use empty */ }

          const toolResult = await dispatchTool(tc.function.name, args)
          messages.push({
            role: 'tool',
            tool_call_id: tc.id,
            content: JSON.stringify(toolResult),
          })
        }
        rounds++
      } else {
        // No more tool calls requested - this is the final conversational answer!
        const reply = assistantMessage.content ?? "Sorry, I couldn't generate a response."
        return { reply }
      }
    }

    // Fallback if maxRounds was reached (rare)
    const finalMessage = messages.find(m => m.role === 'assistant' && m.content)
    const reply = finalMessage?.content ?? "Sorry, I couldn't generate a response."
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
  const resolved = await resolveGroqKey()
  if (!resolved) return { error: 'Please add your Groq API key in Settings to use AI features.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  let nodes: { title: string; description?: string; order_index: number; parent_ids?: string[] }[]

  try {
    const completion = await resolved.groq.chat.completions.create({
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
  const resolved = await resolveGroqKey()
  if (!resolved) return { error: 'Please add your Groq API key in Settings to use AI features.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  let nodes: { title: string; description?: string; order_index: number }[]

  try {
    const completion = await resolved.groq.chat.completions.create({
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
  const resolved = await resolveGroqKey()
  if (!resolved) return { error: 'Please add your Groq API key in Settings to use AI features.' }

  const todayStr = new Date().toISOString().split('T')[0]
  let parsed: { title?: string; type?: string; due_date?: string; notes?: string }

  try {
    const completion = await resolved.groq.chat.completions.create({
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
  const resolved = await resolveGroqKey()
  if (!resolved) return { error: 'Please add your Groq API key in Settings to use AI features.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  const todayStr = new Date().toISOString().split('T')[0]
  let parsed: { title?: string; type?: string; due_date?: string; notes?: string }

  try {
    const completion = await resolved.groq.chat.completions.create({
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
  const resolved = await resolveGroqKey()
  if (!resolved) return { error: 'Please add your Groq API key in Settings to use AI features.' }

  const todayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]

  const dayMatch = text.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i)
  const inferredDay = dayMatch ? dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1).toLowerCase() : todayName

  let parsed: { day_of_week?: string; day_type?: string; target_muscle_groups?: string[]; exercises?: string[] }

  try {
    const completion = await resolved.groq.chat.completions.create({
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

// Helper to parse complex workout plan lines
function parseExerciseLine(line: string) {
  const cleaned = line.trim()
  if (!cleaned) return null

  let rest: string | undefined
  let nameAndReps = cleaned

  const restMatch = cleaned.match(/(?:\(|,|^|\s)Rest:\s*([^\)]+)/i)
  if (restMatch) {
    rest = restMatch[1].trim()
    nameAndReps = cleaned.replace(/\s*\(?Rest:\s*[^\)]+\)?/i, '').trim()
  }

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

// Step 2: Confirm & save workout plan
export async function aiSetDayPlan(
  text: string
): Promise<{ success: true; summary: string } | { error: string }> {
  const resolved = await resolveGroqKey()
  if (!resolved) return { error: 'Please add your Groq API key in Settings to use AI features.' }

  const supabase = await createClient()
  const { data: { user } } = await supabase.auth.getUser()
  if (!user) return { error: 'You must be logged in.' }

  let parsed: {
    day_of_week?: string
    day_type?: string
    warmup?: string
    target_muscle_groups?: string[]
    exercises?: string[]
  }

  const todayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]

  const dayMatch = text.match(/\b(monday|tuesday|wednesday|thursday|friday|saturday|sunday)\b/i)
  const inferredDay = dayMatch ? dayMatch[1].charAt(0).toUpperCase() + dayMatch[1].slice(1).toLowerCase() : todayName

  try {
    const completion = await resolved.groq.chat.completions.create({
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
  "warmup": "warmup instructions e.g. 5 mins walk, leg swings, or null if none",
  "target_muscle_groups": ["muscles targeted"],
  "exercises": ["exercise name with sets/reps if given e.g. Bench Press 3x8-10 (Rest: 90s)"]
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
      max_tokens: 600,
      temperature: 0.1,
    })
    parsed = parseJsonFromGroq(completion.choices[0]?.message?.content ?? '{}') as typeof parsed
  } catch {
    return { error: 'Could not understand that. Try: "Friday is home workout — pushups 3x15 and plank 3x60s"' }
  }

  const exercises = (parsed.exercises ?? [])
    .map((e) => parseExerciseLine(String(e)))
    .filter(Boolean)

  const { error } = await supabase.from('workout_plans').upsert(
    {
      user_id: user.id,
      day_of_week: parsed.day_of_week ?? 'Monday',
      day_type: parsed.day_type ?? 'Custom',
      warmup: parsed.warmup ?? null,
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

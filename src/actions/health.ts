'use server'

import { revalidatePath } from 'next/cache'
import { createClient } from '@/lib/supabase/server'
import Groq from 'groq-sdk'

function getGroqClient(): Groq | null {
  const apiKey = process.env.GROQ_API_KEY
  if (!apiKey || apiKey === 'your-groq-api-key-here') return null
  return new Groq({ apiKey })
}

function parseJsonFromGroq(raw: string): unknown {
  const cleaned = raw.replace(/```json\s*/gi, '').replace(/```\s*/g, '').trim()
  const start = cleaned.indexOf('{')
  const end = cleaned.lastIndexOf('}')
  if (start === -1 || end === -1) throw new Error('No JSON found')
  return JSON.parse(cleaned.slice(start, end + 1))
}

// ── Open Food Facts lookup (completely free, no API key needed) ─────────────
async function lookupFoodNutrition(
  foodName: string,
  weightG: number
): Promise<{ calories: number; protein_g: number; carbs_g: number; fat_g: number } | null> {
  try {
    const url = `https://world.openfoodfacts.org/cgi/search.pl?search_terms=${encodeURIComponent(foodName)}&search_simple=1&action=process&json=1&page_size=3`
    const res = await fetch(url, {
      next: { revalidate: 3600 },
      headers: { 'User-Agent': 'MayazOS/1.0 (personal nutrition app)' },
    })
    if (!res.ok) return null

    const data = await res.json() as {
      products?: Array<{ nutriments?: Record<string, number> }>
    }

    const product = data.products?.find(
      (p) =>
        p.nutriments &&
        (p.nutriments['energy-kcal_100g'] ?? 0) > 0 &&
        p.nutriments['proteins_100g'] !== undefined
    )
    if (!product?.nutriments) return null

    const n = product.nutriments
    const factor = weightG / 100
    return {
      calories: Math.round((n['energy-kcal_100g'] ?? 0) * factor),
      protein_g: Math.round((n['proteins_100g'] ?? 0) * factor * 10) / 10,
      carbs_g: Math.round((n['carbohydrates_100g'] ?? 0) * factor * 10) / 10,
      fat_g: Math.round((n['fat_100g'] ?? 0) * factor * 10) / 10,
    }
  } catch {
    return null
  }
}

// ── Meal Types ───────────────────────────────────────────────────────────────
export type MealLog = {
  id: string
  meal_name: string
  meal_type: 'breakfast' | 'lunch' | 'dinner' | 'snack'
  calories: number
  protein_g: number
  carbs_g: number
  fat_g: number
  source: string
  created_at: string
}

export type SleepLog = {
  id: string
  sleep_date: string
  bedtime: string
  wake_time: string
  duration_hours: number
  quality: number
  notes: string | null
}

// ── Preview Meal (parse + cross-check, do NOT save) ─────────────────────────
export async function previewMeal(text: string): Promise<
  | {
      preview: {
        meal_name: string
        meal_type: string
        calories: number
        protein_g: number
        carbs_g: number
        fat_g: number
        source: string
      }
    }
  | { error: string }
> {
  const groq = getGroqClient()
  if (!groq) return { error: 'Groq API key not configured.' }

  const todayTime = new Date().getHours()
  const suggestedType =
    todayTime < 10 ? 'breakfast' : todayTime < 14 ? 'lunch' : todayTime < 18 ? 'snack' : 'dinner'

  let parsed: {
    meal_name?: string
    meal_type?: string
    items?: Array<{ food: string; estimated_weight_g: number }>
    calories?: number
    protein_g?: number
    carbs_g?: number
    fat_g?: number
  }

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are a precision nutrition analyzer. Parse the meal and return ONLY valid JSON.
Reference values (per unit):
- 1 large egg = 70 kcal, 6g protein, 5g fat, 0.5g carbs, weight 50g
- 1 slice bread/toast = 80 kcal, 3g protein, 15g carbs, 1g fat, weight 30g
- 1 cup cooked rice = 200 kcal, 4g protein, 44g carbs, 0.4g fat, weight 195g
- 100g chicken breast = 165 kcal, 31g protein, 0g carbs, 3.6g fat
- 100g beef = 250 kcal, 26g protein, 0g carbs, 17g fat
- 1 cup milk = 150 kcal, 8g protein, 12g carbs, 8g fat, weight 244g
- 1 medium banana = 105 kcal, 1.3g protein, 27g carbs, 0.4g fat, weight 118g
- 1 apple = 95 kcal, 0.5g protein, 25g carbs, 0.3g fat, weight 182g
- 1 tbsp peanut butter = 95 kcal, 4g protein, 3g carbs, 8g fat, weight 16g
- 1 cup oats (dry) = 300 kcal, 10g protein, 54g carbs, 6g fat, weight 81g
- 100g lentils cooked = 116 kcal, 9g protein, 20g carbs, 0.4g fat

Return JSON:
{
  "meal_name": "concise name",
  "meal_type": "breakfast|lunch|dinner|snack",
  "items": [{ "food": "simple English name for db lookup", "estimated_weight_g": 100 }],
  "calories": 0,
  "protein_g": 0,
  "carbs_g": 0,
  "fat_g": 0
}
Suggested meal_type if not mentioned: "${suggestedType}". Sum all items for totals.`,
        },
        { role: 'user', content: text },
      ],
      max_tokens: 600,
      temperature: 0.1,
    })
    parsed = parseJsonFromGroq(
      completion.choices[0]?.message?.content ?? '{}'
    ) as typeof parsed
  } catch {
    return {
      error: 'Could not parse. Try: "2 eggs, 2 slices toast and a glass of milk for breakfast"',
    }
  }

  // Try Open Food Facts cross-check on the main item
  let source = 'ai_estimated'
  if (parsed.items && parsed.items.length > 0) {
    const main = parsed.items[0]
    const dbData = await lookupFoodNutrition(main.food, main.estimated_weight_g)
    if (dbData && dbData.calories > 0) {
      source = 'ai+database'
    }
  }

  return {
    preview: {
      meal_name: parsed.meal_name ?? text.slice(0, 60),
      meal_type: parsed.meal_type ?? suggestedType,
      calories: parsed.calories ?? 0,
      protein_g: parsed.protein_g ?? 0,
      carbs_g: parsed.carbs_g ?? 0,
      fat_g: parsed.fat_g ?? 0,
      source,
    },
  }
}

// ── Log Meal (save to DB) ────────────────────────────────────────────────────
export async function logMeal(
  text: string
): Promise<{ success: true; summary: string } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const preview = await previewMeal(text)
  if ('error' in preview) return { error: preview.error }

  const { meal_name, meal_type, calories, protein_g, carbs_g, fat_g, source } = preview.preview

  const { error } = await supabase.from('meal_logs').insert({
    user_id: user.id,
    meal_name,
    meal_type,
    calories,
    protein_g,
    carbs_g,
    fat_g,
    raw_input: text,
    source,
  })

  if (error) return { error: error.message }

  revalidatePath('/fitness')
  return { success: true, summary: `${meal_name} — ${calories} kcal · ${protein_g}g protein` }
}

// ── Get today's meals ────────────────────────────────────────────────────────
export async function getTodayMeals(): Promise<MealLog[]> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return []

  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('meal_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('logged_date', today)
    .order('created_at', { ascending: true })

  return (data ?? []) as MealLog[]
}

// ── Delete a meal ────────────────────────────────────────────────────────────
export async function deleteMeal(id: string): Promise<{ error?: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const { error } = await supabase
    .from('meal_logs')
    .delete()
    .eq('id', id)
    .eq('user_id', user.id)

  if (error) return { error: error.message }
  revalidatePath('/fitness')
  return {}
}

// ── Log Sleep ────────────────────────────────────────────────────────────────
export async function logSleep(
  bedtime: string,
  wakeTime: string,
  quality: number,
  notes: string
): Promise<{ success: true } | { error: string }> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return { error: 'Not authenticated.' }

  const [bh, bm] = bedtime.split(':').map(Number)
  const [wh, wm] = wakeTime.split(':').map(Number)
  let duration = wh * 60 + wm - (bh * 60 + bm)
  if (duration < 0) duration += 24 * 60 // overnight
  const duration_hours = Math.round((duration / 60) * 10) / 10

  const today = new Date().toISOString().split('T')[0]
  const { error } = await supabase.from('sleep_logs').upsert(
    {
      user_id: user.id,
      sleep_date: today,
      bedtime,
      wake_time: wakeTime,
      duration_hours,
      quality,
      notes: notes || null,
    },
    { onConflict: 'user_id,sleep_date' }
  )

  if (error) return { error: error.message }
  revalidatePath('/fitness')
  return { success: true }
}

// ── Get today's sleep ────────────────────────────────────────────────────────
export async function getTodaySleep(): Promise<SleepLog | null> {
  const supabase = await createClient()
  const {
    data: { user },
  } = await supabase.auth.getUser()
  if (!user) return null

  const today = new Date().toISOString().split('T')[0]
  const { data } = await supabase
    .from('sleep_logs')
    .select('*')
    .eq('user_id', user.id)
    .eq('sleep_date', today)
    .single()

  return data as SleepLog | null
}

// ── AI Health Insights (workout + diet + sleep combined) ─────────────────────
export async function getHealthInsights(
  workoutType: string | null,
  meals: MealLog[],
  sleep: SleepLog | null
): Promise<string> {
  const groq = getGroqClient()
  if (!groq) return 'Connect your Groq API key to get personalized health insights.'

  const totalCals = meals.reduce((s, m) => s + m.calories, 0)
  const totalProtein = meals.reduce((s, m) => s + m.protein_g, 0)
  const totalCarbs = meals.reduce((s, m) => s + m.carbs_g, 0)
  const totalFat = meals.reduce((s, m) => s + m.fat_g, 0)

  const context = `
TODAY'S WORKOUT: ${workoutType ?? 'No workout planned / Rest day'}

TODAY'S NUTRITION (${meals.length} meals logged):
- Total calories: ${totalCals} kcal
- Protein: ${totalProtein}g | Carbs: ${totalCarbs}g | Fat: ${totalFat}g
${meals.map((m) => `  • ${m.meal_type}: ${m.meal_name} (${m.calories} kcal, ${m.protein_g}g protein)`).join('\n') || '  • No meals logged yet'}

LAST NIGHT'S SLEEP:
${
  sleep
    ? `- Duration: ${sleep.duration_hours}h (${sleep.bedtime} → ${sleep.wake_time})\n- Quality: ${sleep.quality}/5`
    : '- No sleep data logged'
}
`

  try {
    const completion = await groq.chat.completions.create({
      model: 'llama-3.1-8b-instant',
      messages: [
        {
          role: 'system',
          content: `You are a personal health and fitness coach inside Mayaz OS. Give concise, specific, actionable health insights based on the user's actual data. 
Rules:
- Use ## for section headings
- Be specific with numbers (e.g., "You need 40g more protein today")
- Cover: remaining nutrition needs, sleep assessment, recovery tips
- Under 200 words total
- No generic advice, no emojis
- If data is missing, acknowledge it and give sensible defaults`,
        },
        {
          role: 'user',
          content: `Give me today's health insights:\n${context}`,
        },
      ],
      max_tokens: 400,
      temperature: 0.5,
    })
    return completion.choices[0]?.message?.content ?? 'Could not generate insights.'
  } catch {
    return 'Could not generate insights right now. Try again later.'
  }
}

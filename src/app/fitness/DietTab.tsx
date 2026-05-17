'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Utensils, Trash2, Loader2, Sparkles, ArrowLeft, CheckCircle2, AlertCircle, Database, Brain, TrendingUp, ChevronDown, ChevronUp } from 'lucide-react'
import { logMeal, deleteMeal, getHealthInsights } from '@/actions/health'
import { previewMeal } from '@/actions/health'
import { useRouter } from 'next/navigation'
import type { MealLog, SleepLog } from '@/actions/health'
import ReactMarkdown from 'react-markdown'

/** Safe UUID — works on HTTP (mobile local dev) and HTTPS (Vercel) */
function safeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

type MealPreview = {
  meal_name: string; meal_type: string
  calories: number; protein_g: number; carbs_g: number; fat_g: number; source: string
}

const MEAL_ORDER = ['breakfast', 'lunch', 'dinner', 'snack'] as const
const MEAL_COLORS: Record<string, string> = {
  breakfast: '#f59e0b', lunch: '#10b981', dinner: '#6366f1', snack: '#f43f5e'
}
const MEAL_LABELS: Record<string, string> = {
  breakfast: '☀️ Breakfast', lunch: '🌿 Lunch', dinner: '🌙 Dinner', snack: '🍎 Snack'
}

function MacroBar({ label, value, max, color }: { label: string; value: number; max: number; color: string }) {
  const pct = Math.min((value / max) * 100, 100)
  return (
    <div style={{ flex: 1 }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '5px' }}>
        <span style={{ fontSize: '11px', color: 'var(--text-muted)', fontWeight: 600 }}>{label}</span>
        <span style={{ fontSize: '11px', color: 'var(--text-primary)', fontWeight: 700 }}>{Math.round(value)}g</span>
      </div>
      <div style={{ height: '6px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ height: '100%', background: color, borderRadius: '99px' }}
        />
      </div>
    </div>
  )
}

export function DietTab({ initialMeals, todaySleep, workoutType }: {
  initialMeals: MealLog[]
  todaySleep: SleepLog | null
  workoutType: string | null
}) {
  const [meals, setMeals] = useState<MealLog[]>(initialMeals)
  const [text, setText] = useState('')
  const [preview, setPreview] = useState<MealPreview | null>(null)
  const [result, setResult] = useState<{ success?: string; error?: string } | null>(null)
  const [insights, setInsights] = useState<string | null>(null)
  const [showInsights, setShowInsights] = useState(false)
  const [isPending, startTransition] = useTransition()
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)
  const router = useRouter()

  const totalCals = meals.reduce((s, m) => s + m.calories, 0)
  const totalProtein = meals.reduce((s, m) => s + m.protein_g, 0)
  const totalCarbs = meals.reduce((s, m) => s + m.carbs_g, 0)
  const totalFat = meals.reduce((s, m) => s + m.fat_g, 0)

  // Daily targets (reasonable defaults)
  const TARGET_CALS = 2000
  const TARGET_PROTEIN = 140
  const TARGET_CARBS = 220
  const TARGET_FAT = 65

  const calsPercent = Math.min((totalCals / TARGET_CALS) * 100, 100)

  function handlePreview() {
    if (!text.trim()) return
    setResult(null)
    startTransition(async () => {
      const res = await previewMeal(text)
      if ('preview' in res) setPreview(res.preview as MealPreview)
      else setResult({ error: res.error })
    })
  }

  function handleConfirm() {
    if (!preview) return
    startTransition(async () => {
      const res = await logMeal(text)
      if ('success' in res) {
        setResult({ success: res.summary })
        setText('')
        setPreview(null)
        router.refresh()
        // optimistically update
        setMeals(prev => [...prev, {
          id: safeId(),
          meal_name: preview.meal_name,
          meal_type: preview.meal_type as MealLog['meal_type'],
          calories: preview.calories,
          protein_g: preview.protein_g,
          carbs_g: preview.carbs_g,
          fat_g: preview.fat_g,
          source: preview.source,
          created_at: new Date().toISOString(),
        }])
      } else {
        setResult({ error: res.error })
      }
    })
  }

  function handleDelete(id: string) {
    startTransition(async () => {
      await deleteMeal(id)
      setMeals(prev => prev.filter(m => m.id !== id))
    })
  }

  async function handleLoadInsights() {
    setIsLoadingInsights(true)
    setShowInsights(true)
    const result = await getHealthInsights(workoutType, meals, todaySleep)
    setInsights(result)
    setIsLoadingInsights(false)
  }

  const grouped = MEAL_ORDER.reduce<Record<string, MealLog[]>>((acc, type) => {
    acc[type] = meals.filter(m => m.meal_type === type)
    return acc
  }, {} as Record<string, MealLog[]>)

  return (
    <div style={{ padding: '0 16px 120px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Daily Summary Card */}
      <div style={{ background: '#fff', borderRadius: '20px', padding: '18px 20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px' }}>
          <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Today's Intake</p>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '22px', fontWeight: 800, color: totalCals > TARGET_CALS ? '#ef4444' : 'var(--em-600)', letterSpacing: '-0.5px' }}>
              {totalCals}
            </span>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', marginLeft: '3px' }}>/ {TARGET_CALS} kcal</span>
          </div>
        </div>

        {/* Calorie bar */}
        <div style={{ height: '8px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden', marginBottom: '14px' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${calsPercent}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{
              height: '100%', borderRadius: '99px',
              background: calsPercent > 95 ? '#ef4444' : 'linear-gradient(90deg, var(--em-400), var(--em-600))',
            }}
          />
        </div>

        {/* Macros */}
        <div style={{ display: 'flex', gap: '12px' }}>
          <MacroBar label="Protein" value={totalProtein} max={TARGET_PROTEIN} color="#6366f1" />
          <MacroBar label="Carbs" value={totalCarbs} max={TARGET_CARBS} color="#f59e0b" />
          <MacroBar label="Fat" value={totalFat} max={TARGET_FAT} color="#f43f5e" />
        </div>

        {/* Remaining hint */}
        {totalCals < TARGET_CALS && meals.length > 0 && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>
            {TARGET_CALS - totalCals} kcal remaining · {Math.max(0, Math.round(TARGET_PROTEIN - totalProtein))}g protein to go
          </p>
        )}
      </div>

      {/* AI Insights toggle */}
      <button
        onClick={showInsights ? () => setShowInsights(false) : handleLoadInsights}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '13px 18px',
          background: showInsights ? 'var(--em-50)' : '#fff',
          border: showInsights ? '1px solid var(--em-200)' : '1px solid var(--border)',
          borderRadius: '14px', cursor: 'pointer', transition: 'all 0.2s',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: 'var(--em-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={14} color="#fff" />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: showInsights ? 'var(--em-700)' : 'var(--text-primary)' }}>
            AI Health Insights
          </span>
        </div>
        {isLoadingInsights ? <Loader2 size={16} color="var(--em-500)" className="animate-spin" /> :
          showInsights ? <ChevronUp size={16} color="var(--text-muted)" /> : <ChevronDown size={16} color="var(--text-muted)" />}
      </button>

      <AnimatePresence>
        {showInsights && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -8 }}
            style={{ background: '#fff', borderRadius: '16px', padding: '16px 18px', boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)', marginTop: '-8px' }}
          >
            {isLoadingInsights ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
                <Loader2 size={14} className="animate-spin" color="var(--em-500)" /> Analyzing your workout, diet & sleep…
              </div>
            ) : insights ? (
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.7 }}>
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => <p style={{ fontWeight: 800, fontSize: '13px', color: 'var(--em-700)', marginBottom: '4px', marginTop: '10px' }}>{children}</p>,
                    p: ({ children }) => <p style={{ marginBottom: '6px' }}>{children}</p>,
                    ul: ({ children }) => <ul style={{ paddingLeft: '16px', marginBottom: '6px' }}>{children}</ul>,
                    li: ({ children }) => <li style={{ marginBottom: '3px' }}>{children}</li>,
                    strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
                  }}
                >{insights}</ReactMarkdown>
              </div>
            ) : null}
          </motion.div>
        )}
      </AnimatePresence>

      {/* AI Meal Add */}
      <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 18px 0' }}>
          <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'var(--em-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Sparkles size={10} color="#fff" />
          </div>
          <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--em-600)' }}>AI Meal Log</span>
        </div>

        <AnimatePresence mode="wait">
          {!preview ? (
            <motion.div key="input" initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}>
              <textarea
                rows={2}
                value={text}
                onChange={e => setText(e.target.value)}
                placeholder={`"2 eggs, toast and milk for breakfast"`}
                style={{
                  display: 'block', width: '100%', resize: 'none',
                  padding: '12px 18px', border: 'none', fontSize: '13px',
                  lineHeight: 1.6, color: 'var(--text-primary)',
                  background: 'transparent', outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
              <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 18px', borderTop: '1px solid var(--border)', background: text.trim() ? 'var(--em-50)' : '#fafafa' }}>
                <button
                  onClick={handlePreview}
                  disabled={isPending || !text.trim()}
                  style={{
                    display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px',
                    borderRadius: '10px', background: text.trim() ? 'var(--em-500)' : 'transparent',
                    border: text.trim() ? 'none' : '1px solid var(--border)',
                    color: text.trim() ? '#fff' : 'var(--text-muted)',
                    fontSize: '12px', fontWeight: 600, cursor: text.trim() ? 'pointer' : 'default',
                  }}
                >
                  {isPending ? <><Loader2 size={12} className="animate-spin" /> Analyzing...</> : <><Sparkles size={12} /> Preview</>}
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="preview" initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }} style={{ padding: '14px 18px 18px' }}>
              {/* Source badge */}
              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '10px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em' }}>AI understood:</p>
                <span style={{
                  fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px',
                  background: preview.source === 'ai+database' ? 'var(--em-50)' : '#fff7ed',
                  color: preview.source === 'ai+database' ? 'var(--em-700)' : '#c2410c',
                  border: `1px solid ${preview.source === 'ai+database' ? 'var(--em-200)' : '#fed7aa'}`,
                  display: 'flex', alignItems: 'center', gap: '4px',
                }}>
                  {preview.source === 'ai+database' ? <><Database size={9} /> DB Verified</> : <><Brain size={9} /> AI Estimated</>}
                </span>
              </div>

              {/* Preview card */}
              <div style={{ background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)', overflow: 'hidden', marginBottom: '14px' }}>
                <div style={{ padding: '10px 14px', borderBottom: '1px solid var(--border)', display: 'flex', justifyContent: 'space-between' }}>
                  <span style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>{preview.meal_name}</span>
                  <span style={{
                    fontSize: '11px', fontWeight: 700, padding: '2px 10px', borderRadius: '20px',
                    background: MEAL_COLORS[preview.meal_type] + '18',
                    color: MEAL_COLORS[preview.meal_type],
                    border: `1px solid ${MEAL_COLORS[preview.meal_type]}40`,
                    textTransform: 'capitalize',
                  }}>{preview.meal_type}</span>
                </div>
                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '0' }}>
                  {[
                    { label: 'Calories', value: `${preview.calories}`, unit: 'kcal' },
                    { label: 'Protein', value: `${preview.protein_g}`, unit: 'g' },
                    { label: 'Carbs', value: `${preview.carbs_g}`, unit: 'g' },
                    { label: 'Fat', value: `${preview.fat_g}`, unit: 'g' },
                  ].map((item, i) => (
                    <div key={item.label} style={{ padding: '10px 8px', textAlign: 'center', borderRight: i < 3 ? '1px solid var(--border)' : 'none' }}>
                      <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px' }}>{item.value}</p>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)', fontWeight: 600 }}>{item.unit}</p>
                      <p style={{ fontSize: '10px', color: 'var(--text-muted)' }}>{item.label}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div style={{ display: 'flex', gap: '10px' }}>
                <button onClick={() => setPreview(null)} disabled={isPending}
                  style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '10px', background: '#fff', border: '1px solid var(--border)', color: 'var(--text-secondary)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
                  <ArrowLeft size={13} /> Edit
                </button>
                <button onClick={handleConfirm} disabled={isPending}
                  style={{ flex: 2, display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px', padding: '10px', borderRadius: '10px', background: 'var(--em-500)', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 700, cursor: isPending ? 'default' : 'pointer', opacity: isPending ? 0.8 : 1 }}>
                  {isPending ? <><Loader2 size={13} className="animate-spin" /> Saving...</> : <><CheckCircle2 size={13} /> Log Meal</>}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {result?.error && (
          <div style={{ margin: '0 18px 14px', display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '10px 12px', borderRadius: '10px', background: '#fef2f2', fontSize: '13px', color: '#dc2626' }}>
            <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />{result.error}
          </div>
        )}
        {result?.success && (
          <div style={{ margin: '0 18px 14px', display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '10px 12px', borderRadius: '10px', background: 'var(--em-50)', fontSize: '13px', color: 'var(--em-700)' }}>
            <CheckCircle2 size={14} style={{ flexShrink: 0, marginTop: '1px' }} />{result.success}
          </div>
        )}
      </div>

      {/* Meal List grouped by type */}
      {meals.length > 0 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
          {MEAL_ORDER.filter(type => grouped[type].length > 0).map(type => (
            <div key={type}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '8px', padding: '0 4px' }}>
                {MEAL_LABELS[type]}
              </p>
              <div style={{ background: '#fff', borderRadius: '16px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.06), 0 0 0 1px rgba(0,0,0,0.04)' }}>
                {grouped[type].map((meal, i) => (
                  <div key={meal.id} style={{ display: 'flex', alignItems: 'center', gap: '12px', padding: '12px 16px', borderBottom: i < grouped[type].length - 1 ? '1px solid var(--border)' : 'none' }}>
                    <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: MEAL_COLORS[type], flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '13px', fontWeight: 600, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{meal.meal_name}</p>
                      <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                        {meal.calories} kcal · {meal.protein_g}g protein · {meal.carbs_g}g carbs
                      </p>
                    </div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
                      <span style={{ fontSize: '10px', color: meal.source === 'ai+database' ? 'var(--em-600)' : '#c2410c', fontWeight: 600 }}>
                        {meal.source === 'ai+database' ? '●' : '○'}
                      </span>
                      <button
                        onClick={() => handleDelete(meal.id)}
                        disabled={isPending}
                        style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#fef2f2', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                      >
                        <Trash2 size={12} color="#ef4444" />
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}

      {meals.length === 0 && (
        <div style={{ background: '#fff', borderRadius: '20px', padding: '40px 20px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '8px' }}>
          <Utensils size={32} color="var(--border-2)" strokeWidth={1.5} />
          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)' }}>No meals logged yet</p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)' }}>Tell the AI what you ate and it'll track the macros</p>
        </div>
      )}

      {/* Legend */}
      <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', padding: '4px 0' }}>
        <span style={{ fontSize: '10px', color: 'var(--em-600)', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><Database size={10} /> DB verified</span>
        <span style={{ fontSize: '10px', color: '#c2410c', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '4px' }}><TrendingUp size={10} /> AI estimated</span>
      </div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Dumbbell, Plus, Sparkles, CheckCircle2, AlertCircle, Tag, ChevronDown, ChevronUp, Loader2, Trash2, Utensils, Moon, Upload, Copy, Check } from 'lucide-react'
import { setDayPlan, clearDayPlan, importWorkoutPlans } from '@/actions/fitness'
import { aiSetDayPlan, previewWorkoutPlan } from '@/actions/ai'
import { Combobox } from '@/components/Combobox'
import { AIInputBox } from '@/components/AIInputBox'
import { DietTab } from './DietTab'
import { SleepTab } from './SleepTab'
import type { MealLog, SleepLog } from '@/actions/health'

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday']
const DAY_SUGGESTIONS = ['Push', 'Pull', 'Legs', 'Upper', 'Lower', 'Full Body', 'Cardio', 'Rest', 'Olympic', 'Calisthenics']

type Exercise = { name: string; sets?: string; reps?: string; rest?: string }
type DayPlan = {
  id: string; day_of_week: string; day_type: string
  target_muscle_groups: string[]; exercises: Exercise[]
  warmup?: string
}

function DayCard({ day, plan, isToday, onEdit, isLast }: {
  day: string; plan: DayPlan | undefined; isToday: boolean; onEdit: (day: string) => void; isLast?: boolean
}) {
  const [expanded, setExpanded] = useState(isToday)

  return (
    <motion.div layout style={{ borderBottom: isLast ? 'none' : '1px solid var(--border)' }}>
      {/* Header row */}
      <div
        onClick={() => setExpanded(!expanded)}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          padding: '14px 18px',
          background: isToday ? 'rgba(16,185,129,0.06)' : 'transparent',
          cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          {/* Status dot */}
          <span style={{
            width: '8px', height: '8px', borderRadius: '50%', flexShrink: 0,
            background: isToday ? 'var(--em-500)' : plan ? 'var(--em-300)' : 'var(--border-2)',
          }} />
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
              <span style={{ fontSize: '14px', fontWeight: 700, color: isToday ? 'var(--em-700)' : 'var(--text-primary)' }}>{day}</span>
              {isToday && <span style={{ fontSize: '10px', fontWeight: 700, padding: '2px 8px', borderRadius: '20px', background: 'var(--em-100)', color: 'var(--em-700)', textTransform: 'uppercase', letterSpacing: '0.04em' }}>Today</span>}
            </div>
            <span style={{ fontSize: '12px', color: 'var(--text-muted)', fontStyle: plan ? 'normal' : 'italic' }}>
              {plan ? `${plan.day_type} · ${(plan.exercises ?? []).length} exercises` : 'Not planned'}
            </span>
          </div>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <button
            onClick={(e) => { e.stopPropagation(); onEdit(day) }}
            style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'transparent', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: 'var(--text-muted)' }}
          >
            <Plus size={14} />
          </button>
          {expanded ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
        </div>
      </div>

      {/* Expandable body */}
      <AnimatePresence>
        {expanded && plan && (
          <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }} transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}>
            <div style={{ padding: '0 18px 16px', borderTop: '1px solid var(--border)' }}>
              
              {/* Render Warmup notes if present */}
              {plan.warmup && (
                <div style={{
                  background: '#fffbeb', border: '1px solid #fde68a', borderRadius: '12px',
                  padding: '10px 12px', marginTop: '12px', marginBottom: '8px'
                }}>
                  <p style={{ fontSize: '10px', fontWeight: 800, color: '#b45309', textTransform: 'uppercase', letterSpacing: '0.04em', marginBottom: '3px' }}>
                    🔥 Warm-up instructions
                  </p>
                  <p style={{ fontSize: '12.5px', color: '#78350f', margin: 0, whiteSpace: 'pre-wrap', lineHeight: 1.4 }}>
                    {plan.warmup}
                  </p>
                </div>
              )}

              {(plan.target_muscle_groups ?? []).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px', margin: '12px 0' }}>
                  {[...new Set(plan.target_muscle_groups ?? [])].map((m, i) => (
                    <span key={`${m}-${i}`} style={{ fontSize: '10px', padding: '3px 10px', borderRadius: '20px', background: 'var(--em-50)', border: '1px solid var(--em-200)', color: 'var(--em-700)', fontWeight: 600 }}>{m}</span>
                  ))}
                </div>
              )}

              {Array.isArray(plan.exercises) && plan.exercises.length > 0 ? (
                <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '8px', marginTop: (plan.target_muscle_groups ?? []).length > 0 || plan.warmup ? 0 : '12px' }}>
                  {(plan.exercises ?? []).map((ex, i) => (
                    <li key={i} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                      <span style={{ width: '22px', height: '22px', borderRadius: '50%', background: 'var(--em-50)', border: '1px solid var(--em-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '10px', fontWeight: 800, color: 'var(--em-700)', flexShrink: 0 }}>{i + 1}</span>
                      <span style={{ flex: 1, fontSize: '13px', color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{ex.name}</span>
                      {(ex.sets || ex.reps) && (
                        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'flex-end', gap: '1px', flexShrink: 0 }}>
                          {ex.sets && ex.reps ? (
                            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', fontWeight: 600 }}>{ex.sets}×{ex.reps}</span>
                          ) : ex.reps ? (
                            <span style={{ fontSize: '11px', fontFamily: 'monospace', color: 'var(--text-muted)', fontWeight: 600 }}>{ex.reps}</span>
                          ) : null}
                          {ex.rest && (
                            <span style={{ fontSize: '9px', color: '#f59e0b', fontWeight: 700, display: 'flex', alignItems: 'center', gap: '1px' }}>⏱️ {ex.rest}</span>
                          )}
                        </div>
                      )}
                    </li>
                  ))}
                </ul>
              ) : (
                <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '12px' }}>No exercises listed.</p>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.div>
  )
}

function DayPlanForm({ day, existing, onClose }: {
  day: string; existing?: DayPlan; onClose: () => void
}) {
  const [state, setState] = useState<{ error?: string; success?: boolean }>({})
  const [isPending, startTransition] = useTransition()
  const [isClearing, startClearing] = useTransition()

  function handleSubmit(formData: FormData) {
    setState({})
    startTransition(async () => {
      const result = await setDayPlan({}, formData)
      setState(result)
      if (result.success) onClose()  // close immediately, data is saved
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 8 }}
      style={{
        background: '#ffffff', borderRadius: '20px', padding: '20px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
        marginBottom: '16px',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>Set {day} Plan</p>
        <div style={{ display: 'flex', gap: '12px' }}>
          {existing && (
            <button 
              type="button" 
              onClick={() => startClearing(async () => { await clearDayPlan(day); onClose() })}
              disabled={isClearing}
              style={{ fontSize: '13px', color: '#ef4444', background: 'none', border: 'none', cursor: 'pointer', display: 'flex', alignItems: 'center', gap: '4px' }}
            >
              {isClearing ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />} Clear
            </button>
          )}
          <button type="button" onClick={onClose} style={{ fontSize: '13px', color: 'var(--text-muted)', background: 'none', border: 'none', cursor: 'pointer' }}>Cancel</button>
        </div>
      </div>

      <form action={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
        <input type="hidden" name="day_of_week" value={day} />

        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Day Type</label>
          <Combobox id={`day_type_${day}`} name="day_type" suggestions={DAY_SUGGESTIONS}
            placeholder="Push, Pull, Rest, or custom..." defaultValue={existing?.day_type ?? ''} required />
        </div>

        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Warm-up <span style={{ textTransform: 'none', fontWeight: 400 }}>(e.g. 5-10 mins cardio/dynamic stretching)</span></label>
          <textarea name="warmup" rows={2} className="field-input" style={{ resize: 'none', fontSize: '12px' }}
            placeholder="5 min light treadmill walk + dynamic leg swings and bodyweight squats"
            defaultValue={existing?.warmup ?? ''} />
        </div>

        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Target Muscles <span style={{ textTransform: 'none', fontWeight: 400 }}>(comma-separated)</span></label>
          <input name="target_muscle_groups" type="text" className="field-input"
            placeholder="Chest, Triceps, Anterior Deltoid"
            defaultValue={existing?.target_muscle_groups?.join(', ') ?? ''} />
        </div>

        <div>
          <label style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', display: 'block', marginBottom: '6px' }}>Exercises <span style={{ textTransform: 'none', fontWeight: 400 }}>(one per line, supports reps, durations, and rest times)</span></label>
          <textarea name="exercises" rows={6} className="field-input" style={{ resize: 'none', fontFamily: 'monospace', fontSize: '12px' }}
            placeholder={"Bench Press 4x8 (Rest: 90s)\nPlank 3x30-60s (Rest: 60s)\nCable Flyes 3x12"}
            defaultValue={existing?.exercises?.map(e => {
              let line = e.name
              if (e.sets && e.reps) {
                line += ` ${e.sets}x${e.reps}`
              }
              if (e.rest) {
                line += ` (Rest: ${e.rest})`
              }
              return line
            }).join('\n') ?? ''} />
        </div>

        {state.error && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: '#dc2626', background: '#fef2f2', borderRadius: '10px', padding: '10px 14px' }}>
            <AlertCircle size={14} /> {state.error}
          </div>
        )}
        {state.success && (
          <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '13px', color: 'var(--em-700)', background: 'var(--em-50)', borderRadius: '10px', padding: '10px 14px' }}>
            <CheckCircle2 size={14} /> Saved!
          </div>
        )}

        <button
          type="submit"
          disabled={isPending}
          style={{
            display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
            padding: '12px', borderRadius: '12px',
            background: 'var(--em-500)', color: '#fff',
            border: 'none', fontWeight: 700, fontSize: '14px', cursor: 'pointer',
          }}
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle2 size={14} />}
          {isPending ? 'Saving...' : 'Save Plan'}
        </button>
      </form>
    </motion.div>
  )
}

const IMPORT_PROMPT = `Convert the workout plan I provide into this exact JSON format. Output ONLY the raw JSON array — no explanations, no markdown fences, no "Here is your JSON", no closing remarks. Start your response with [ and end with ].

JSON Schema:
[
  {
    "day_of_week": "Monday",
    "day_type": "Push",
    "warmup": "5 min light cycling (optional, omit if not mentioned)",
    "target_muscle_groups": ["Chest", "Triceps"],
    "exercises": [
      { "name": "Bench Press", "sets": "4", "reps": "8", "rest": "90s" },
      { "name": "Incline Treadmill Walk", "reps": "10m", "rest": null },
      { "name": "Plank", "sets": "3", "reps": "30-60s", "rest": "30s" }
    ]
  }
]

Rules:
- Use null for rest if not specified
- Duration exercises (cardio, holds) use reps field for time: "10m", "10m30s", "5-15m", "30-60s"
- Set/rep exercises use sets + reps: "3" + "12" or "3" + "10-15"
- One object per training day
- day_of_week must be exactly: Monday, Tuesday, Wednesday, Thursday, Friday, Saturday, or Sunday

My workout plan:
[PASTE YOUR PLAN BELOW THIS LINE]`

function ImportPlanSection() {
  const [open, setOpen] = useState(false)
  const [json, setJson] = useState('')
  const [isPending, startTransition] = useTransition()
  const [result, setResult] = useState<{ success?: boolean; count?: number; error?: string }>({})
  const [copied, setCopied] = useState(false)

  function copyPrompt() {
    navigator.clipboard.writeText(IMPORT_PROMPT)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  function handleImport() {
    if (!json.trim()) return
    setResult({})
    startTransition(async () => {
      const res = await importWorkoutPlans(json)
      setResult(res)
      if ('success' in res) {
        setJson('')
        setTimeout(() => { setOpen(false); setResult({}) }, 1500)
      }
    })
  }

  return (
    <div style={{ background: '#ffffff', borderRadius: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)', overflow: 'hidden' }}>
      <button
        onClick={() => setOpen(o => !o)}
        style={{ width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '14px 18px', background: 'transparent', border: 'none', cursor: 'pointer' }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: '#f0fdf4', border: '1px solid #bbf7d0', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Upload size={13} color="var(--em-600)" />
          </div>
          <div style={{ textAlign: 'left' }}>
            <p style={{ fontSize: '13px', fontWeight: 700, color: 'var(--text-primary)' }}>Import Plan from AI</p>
            <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>Paste a ChatGPT-formatted plan</p>
          </div>
        </div>
        {open ? <ChevronUp size={14} color="var(--text-muted)" /> : <ChevronDown size={14} color="var(--text-muted)" />}
      </button>

      <AnimatePresence>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.2 }} style={{ overflow: 'hidden' }}
          >
            <div style={{ padding: '0 18px 18px', borderTop: '1px solid var(--border)', display: 'flex', flexDirection: 'column', gap: '12px' }}>

              {/* Step 1 */}
              <div style={{ marginTop: '14px' }}>
                <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--em-600)', marginBottom: '6px' }}>Step 1 — Copy this prompt into ChatGPT / any AI</p>
                <div style={{ background: '#f8fafc', border: '1px solid var(--border)', borderRadius: '12px', padding: '10px 12px', position: 'relative' }}>
                  <pre style={{ fontSize: '11px', color: 'var(--text-secondary)', lineHeight: 1.5, whiteSpace: 'pre-wrap', wordBreak: 'break-word', margin: 0, maxHeight: '120px', overflowY: 'auto', fontFamily: 'monospace' }}>{IMPORT_PROMPT.slice(0, 300)}…</pre>
                  <button
                    onClick={copyPrompt}
                    style={{ position: 'absolute', top: '8px', right: '8px', display: 'flex', alignItems: 'center', gap: '4px', padding: '4px 10px', borderRadius: '8px', background: copied ? 'var(--em-500)' : '#e2e8f0', border: 'none', cursor: 'pointer', fontSize: '11px', fontWeight: 600, color: copied ? '#fff' : 'var(--text-secondary)', transition: 'all 0.2s' }}
                  >
                    {copied ? <Check size={11} /> : <Copy size={11} />}
                    {copied ? 'Copied!' : 'Copy'}
                  </button>
                </div>
                <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>Paste your workout plan at the bottom of the prompt, then run it. The AI will reply with pure JSON only.</p>
              </div>

              {/* Step 2 */}
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, textTransform: 'uppercase', letterSpacing: '0.08em', color: 'var(--em-600)', marginBottom: '6px' }}>Step 2 — Paste the AI&apos;s JSON response here</p>
                <textarea
                  value={json}
                  onChange={e => setJson(e.target.value)}
                  rows={6}
                  placeholder={'[\n  {\n    "day_of_week": "Monday",\n    ...\n  }\n]'}
                  style={{ width: '100%', borderRadius: '12px', border: '1.5px solid var(--border)', padding: '10px 12px', fontFamily: 'monospace', fontSize: '11px', resize: 'vertical', outline: 'none', color: 'var(--text-primary)', boxSizing: 'border-box' }}
                />
              </div>

              {result.error && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: '#dc2626', background: '#fef2f2', borderRadius: '10px', padding: '10px 12px' }}>
                  <AlertCircle size={13} /> {result.error}
                </div>
              )}
              {'success' in result && result.success && (
                <div style={{ display: 'flex', gap: '8px', alignItems: 'center', fontSize: '12px', color: 'var(--em-700)', background: 'var(--em-50)', borderRadius: '10px', padding: '10px 12px' }}>
                  <CheckCircle2 size={13} /> {result.count} day{result.count !== 1 ? 's' : ''} imported successfully!
                </div>
              )}

              <button
                onClick={handleImport}
                disabled={isPending || !json.trim()}
                style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px', padding: '11px', borderRadius: '12px', background: !json.trim() ? 'var(--border)' : 'var(--em-500)', color: '#fff', border: 'none', fontWeight: 700, fontSize: '13px', cursor: json.trim() ? 'pointer' : 'default', transition: 'background 0.2s' }}
              >
                {isPending ? <Loader2 size={13} className="animate-spin" /> : <Upload size={13} />}
                {isPending ? 'Importing...' : 'Import Plan'}
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

export function FitnessClient({ weeklyPlan, todayPlan, aiAction, initialMeals, initialSleep }: {
  weeklyPlan: DayPlan[]
  todayPlan: DayPlan | null
  aiAction: (text: string) => Promise<{ success: true; summary: string } | { error: string }>
  initialMeals: MealLog[]
  initialSleep: SleepLog | null
}) {
  const [editingDay, setEditingDay] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'workout' | 'diet' | 'sleep'>('workout')
  const planMap = Object.fromEntries(weeklyPlan.map(p => [p.day_of_week, p]))
  const todayName = ['Sunday','Monday','Tuesday','Wednesday','Thursday','Friday','Saturday'][new Date().getDay()]

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f0f0' }}>

      {/* Page Title */}
      <div style={{ padding: '24px 20px 12px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)', marginBottom: '4px' }}>Fitness</h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
          {activeTab === 'workout' ? `${weeklyPlan.length} of 7 days planned` :
           activeTab === 'diet' ? 'Track meals & macros' : 'Sleep & recovery'}
        </p>
      </div>

      {/* Tab Bar */}
      <div style={{ padding: '0 16px 14px' }}>
        <div style={{ display: 'flex', background: '#e8e8e6', borderRadius: '14px', padding: '4px', gap: '2px' }}>
          {(['workout', 'diet', 'sleep'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              style={{
                flex: 1, padding: '8px 0', borderRadius: '10px', border: 'none',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.2s',
                background: activeTab === tab ? '#fff' : 'transparent',
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {tab === 'workout' && (
                  <motion.div animate={activeTab === 'workout' ? { rotate: [-20, 20, -10, 10, 0], scale: [1, 1.15, 1] } : {}} transition={{ duration: 0.5, ease: "easeInOut" }}>
                    <Dumbbell size={14} />
                  </motion.div>
                )}
                {tab === 'diet' && (
                  <motion.div animate={activeTab === 'diet' ? { rotate: [0, -20, 15, -10, 0], scale: [1, 1.1, 1] } : {}} transition={{ duration: 0.6, ease: "easeInOut" }}>
                    <Utensils size={14} />
                  </motion.div>
                )}
                {tab === 'sleep' && (
                  <motion.div animate={activeTab === 'sleep' ? { rotate: [0, -15, 10, 0], y: [0, -2, 0] } : {}} transition={{ duration: 1.5, ease: "easeInOut", repeat: activeTab === 'sleep' ? Infinity : 0, repeatType: "reverse" }}>
                    <Moon size={14} />
                  </motion.div>
                )}
                {tab === 'workout' ? 'Workout' : tab === 'diet' ? 'Diet' : 'Sleep'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'workout' && (
          <motion.div key="workout" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }}>
            <div style={{ padding: '0 16px 120px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
              <AIInputBox
                action={aiAction}
                previewAction={previewWorkoutPlan}
                label="AI Quick Set"
                placeholder={`e.g. "Friday is a light home day — pushups and plank" or "Saturday is Push — bench press 4x8, incline dumbbell 3x10"`}
              />
              <ImportPlanSection />
              <AnimatePresence>
                {editingDay && (
                  <DayPlanForm
                    key={editingDay}
                    day={editingDay}
                    existing={planMap[editingDay]}
                    onClose={() => setEditingDay(null)}
                  />
                )}
              </AnimatePresence>
              <div>
                <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '10px', padding: '0 4px' }}>Weekly Plan</p>
                <div style={{ background: '#ffffff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)' }}>
                  {DAYS.map((day, index) => (
                    <DayCard
                      key={day}
                      day={day}
                      plan={planMap[day]}
                      isToday={day === todayName}
                      onEdit={setEditingDay}
                      isLast={index === DAYS.length - 1}
                    />
                  ))}
                </div>
              </div>
            </div>
          </motion.div>
        )}

        {activeTab === 'diet' && (
          <motion.div key="diet" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.18 }}>
            <DietTab
              initialMeals={initialMeals}
              todaySleep={initialSleep}
              workoutType={todayPlan?.day_type ?? null}
            />
          </motion.div>
        )}

        {activeTab === 'sleep' && (
          <motion.div key="sleep" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.18 }}>
            <SleepTab
              initialSleep={initialSleep}
              meals={initialMeals}
              workoutType={todayPlan?.day_type ?? null}
            />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

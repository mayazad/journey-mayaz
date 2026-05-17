'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Moon, Star, CheckCircle2, AlertCircle, Loader2, Brain } from 'lucide-react'
import { logSleep, getHealthInsights } from '@/actions/health'
import { useRouter } from 'next/navigation'
import type { SleepLog, MealLog } from '@/actions/health'
import ReactMarkdown from 'react-markdown'

const QUALITY_LABELS = ['', 'Terrible', 'Poor', 'Okay', 'Good', 'Great']
const QUALITY_COLORS = ['', '#ef4444', '#f97316', '#f59e0b', '#10b981', '#6366f1']

function QualityStars({ value, onChange }: { value: number; onChange: (v: number) => void }) {
  return (
    <div style={{ display: 'flex', gap: '6px' }}>
      {[1, 2, 3, 4, 5].map(n => (
        <button
          key={n}
          type="button"
          onClick={() => onChange(n)}
          style={{
            width: '36px', height: '36px', borderRadius: '10px',
            background: value >= n ? QUALITY_COLORS[n] + '18' : 'var(--bg-surface)',
            border: `1.5px solid ${value >= n ? QUALITY_COLORS[n] : 'var(--border)'}`,
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
            transition: 'all 0.15s',
          }}
        >
          <Star
            size={16}
            color={value >= n ? QUALITY_COLORS[n] : 'var(--border-2)'}
            fill={value >= n ? QUALITY_COLORS[n] : 'transparent'}
          />
        </button>
      ))}
    </div>
  )
}

function SleepSummaryCard({ sleep }: { sleep: SleepLog }) {
  const quality = sleep.quality
  const color = QUALITY_COLORS[quality]
  const label = QUALITY_LABELS[quality]
  const hours = sleep.duration_hours

  const recommendation = hours < 6 ? 'below optimal — aim for 7–9h'
    : hours < 7 ? 'slightly low — try to sleep earlier tonight'
    : hours <= 9 ? 'within healthy range'
    : 'above average — ensure quality over quantity'

  return (
    <div style={{ background: '#fff', borderRadius: '20px', padding: '18px 20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)' }}>
      <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.08em', marginBottom: '14px' }}>Last Night</p>
      <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '14px' }}>
        <div style={{ width: '52px', height: '52px', borderRadius: '16px', background: color + '18', border: `1.5px solid ${color}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <Moon size={22} color={color} />
        </div>
        <div>
          <p style={{ fontSize: '28px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.5px', lineHeight: 1 }}>
            {hours}h
          </p>
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>
            {sleep.bedtime} → {sleep.wake_time} · <span style={{ color, fontWeight: 600 }}>{label}</span>
          </p>
        </div>
      </div>

      <div style={{ display: 'flex', gap: '6px' }}>
        {[1, 2, 3, 4, 5].map(n => (
          <div key={n} style={{
            flex: 1, height: '5px', borderRadius: '99px',
            background: quality >= n ? color : 'var(--border)',
            transition: 'background 0.3s',
          }} />
        ))}
      </div>

      <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '10px' }}>
        Your sleep is <strong style={{ color }}>{recommendation}</strong>
      </p>
    </div>
  )
}

export function SleepTab({ initialSleep, meals, workoutType }: {
  initialSleep: SleepLog | null
  meals: MealLog[]
  workoutType: string | null
}) {
  const [sleep, setSleep] = useState<SleepLog | null>(initialSleep)
  const [bedtime, setBedtime] = useState(sleep?.bedtime ?? '23:00')
  const [wakeTime, setWakeTime] = useState(sleep?.wake_time ?? '07:00')
  const [quality, setQuality] = useState(sleep?.quality ?? 3)
  const [notes, setNotes] = useState(sleep?.notes ?? '')
  const [result, setResult] = useState<{ success?: boolean; error?: string } | null>(null)
  const [insights, setInsights] = useState<string | null>(null)
  const [showInsights, setShowInsights] = useState(false)
  const [isLoadingInsights, setIsLoadingInsights] = useState(false)
  const [isPending, startTransition] = useTransition()
  const router = useRouter()

  function handleSave() {
    startTransition(async () => {
      const res = await logSleep(bedtime, wakeTime, quality, notes)
      if ('success' in res) {
        setResult({ success: true })
        const [bh, bm] = bedtime.split(':').map(Number)
        const [wh, wm] = wakeTime.split(':').map(Number)
        let dur = wh * 60 + wm - (bh * 60 + bm)
        if (dur < 0) dur += 24 * 60
        const duration_hours = Math.round(dur / 60 * 10) / 10
        setSleep({ id: 'temp', sleep_date: new Date().toISOString().split('T')[0], bedtime, wake_time: wakeTime, duration_hours, quality, notes: notes || null })
        router.refresh()
      } else {
        setResult({ error: res.error })
      }
    })
  }

  async function handleLoadInsights() {
    setIsLoadingInsights(true)
    setShowInsights(true)
    const res = await getHealthInsights(workoutType, meals, sleep)
    setInsights(res)
    setIsLoadingInsights(false)
  }

  return (
    <div style={{ padding: '0 16px 120px', display: 'flex', flexDirection: 'column', gap: '16px' }}>

      {/* Sleep summary if already logged */}
      {sleep && <SleepSummaryCard sleep={sleep} />}

      {/* Log/Update form */}
      <div style={{ background: '#fff', borderRadius: '20px', padding: '20px', boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '18px' }}>
          <Moon size={16} color="var(--em-600)" />
          <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)' }}>
            {sleep ? 'Update Tonight\'s Sleep' : 'Log Sleep'}
          </p>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Time pickers */}
          <div style={{ display: 'flex', gap: '12px' }}>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Bedtime</p>
              <input
                type="time"
                value={bedtime}
                onChange={e => setBedtime(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '12px',
                  border: '1.5px solid var(--border)', fontSize: '15px', fontWeight: 700,
                  color: 'var(--text-primary)', background: '#fafafa', outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            </div>
            <div style={{ flex: 1 }}>
              <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Wake Time</p>
              <input
                type="time"
                value={wakeTime}
                onChange={e => setWakeTime(e.target.value)}
                style={{
                  width: '100%', padding: '10px 12px', borderRadius: '12px',
                  border: '1.5px solid var(--border)', fontSize: '15px', fontWeight: 700,
                  color: 'var(--text-primary)', background: '#fafafa', outline: 'none',
                  fontFamily: 'inherit', boxSizing: 'border-box',
                }}
              />
            </div>
          </div>

          {/* Quality */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>
              Sleep Quality — <span style={{ color: QUALITY_COLORS[quality], fontWeight: 800 }}>{QUALITY_LABELS[quality]}</span>
            </p>
            <QualityStars value={quality} onChange={setQuality} />
          </div>

          {/* Notes */}
          <div>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Notes (optional)</p>
            <input
              type="text"
              value={notes}
              onChange={e => setNotes(e.target.value)}
              placeholder="e.g. woke up at 3am, felt groggy"
              style={{
                width: '100%', padding: '10px 14px', borderRadius: '12px',
                border: '1.5px solid var(--border)', fontSize: '13px',
                color: 'var(--text-primary)', background: '#fafafa', outline: 'none',
                fontFamily: 'inherit', boxSizing: 'border-box',
              }}
            />
          </div>

          <button
            onClick={handleSave}
            disabled={isPending}
            style={{
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              width: '100%', padding: '13px', borderRadius: '12px',
              background: 'var(--em-500)', border: 'none', color: '#fff',
              fontSize: '14px', fontWeight: 700, cursor: isPending ? 'default' : 'pointer',
              opacity: isPending ? 0.8 : 1,
            }}
          >
            {isPending ? <><Loader2 size={15} className="animate-spin" /> Saving...</> : <><CheckCircle2 size={15} /> Save Sleep</>}
          </button>
        </div>

        {result?.error && (
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', padding: '10px 12px', borderRadius: '10px', background: '#fef2f2', fontSize: '13px', color: '#dc2626' }}>
            <AlertCircle size={14} style={{ flexShrink: 0 }} />{result.error}
          </div>
        )}
        {result?.success && (
          <div style={{ marginTop: '12px', display: 'flex', gap: '8px', padding: '10px 12px', borderRadius: '10px', background: 'var(--em-50)', fontSize: '13px', color: 'var(--em-700)' }}>
            <CheckCircle2 size={14} style={{ flexShrink: 0 }} />Sleep logged successfully!
          </div>
        )}
      </div>

      {/* AI sleep insight */}
      <button
        onClick={showInsights ? () => setShowInsights(false) : handleLoadInsights}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'space-between',
          width: '100%', padding: '13px 18px',
          background: showInsights ? 'var(--em-50)' : '#fff',
          border: showInsights ? '1px solid var(--em-200)' : '1px solid var(--border)',
          borderRadius: '14px', cursor: 'pointer',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
          <div style={{ width: '26px', height: '26px', borderRadius: '8px', background: '#6366f1', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Brain size={14} color="#fff" />
          </div>
          <span style={{ fontSize: '13px', fontWeight: 700, color: showInsights ? 'var(--em-700)' : 'var(--text-primary)' }}>AI Sleep & Recovery Tips</span>
        </div>
        {isLoadingInsights ? <Loader2 size={16} color="var(--em-500)" className="animate-spin" /> : null}
      </button>

      <AnimatePresence>
        {showInsights && (
          <motion.div
            initial={{ opacity: 0, y: -8 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }}
            style={{ background: '#fff', borderRadius: '16px', padding: '16px 18px', boxShadow: '0 4px 24px rgba(0,0,0,0.08)', marginTop: '-8px' }}
          >
            {isLoadingInsights ? (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: 'var(--text-muted)', fontSize: '13px' }}>
                <Loader2 size={14} className="animate-spin" color="var(--em-500)" /> Analyzing your sleep & recovery…
              </div>
            ) : insights ? (
              <div style={{ fontSize: '13px', color: 'var(--text-primary)', lineHeight: 1.7 }}>
                <ReactMarkdown
                  components={{
                    h2: ({ children }) => <p style={{ fontWeight: 800, fontSize: '13px', color: '#6366f1', marginBottom: '4px', marginTop: '10px' }}>{children}</p>,
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
    </div>
  )
}

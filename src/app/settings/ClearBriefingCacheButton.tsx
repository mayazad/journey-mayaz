'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Loader2, Trash2, CheckCircle2 } from 'lucide-react'

export function ClearBriefingCacheButton({ userId }: { userId?: string }) {
  const [isPending, startTransition] = useTransition()
  const [done, setDone] = useState(false)

  function handleClear() {
    if (!userId) return
    startTransition(async () => {
      const supabase = createClient()
      await supabase
        .from('daily_briefings')
        .delete()
        .eq('user_id', userId)
      setDone(true)
      setTimeout(() => setDone(false), 3000)
    })
  }

  return (
    <button
      onClick={handleClear}
      disabled={isPending}
      style={{
        display: 'flex', alignItems: 'center', gap: '6px',
        padding: '7px 12px', borderRadius: '10px',
        background: done ? 'var(--em-50)' : '#fef2f2',
        border: `1px solid ${done ? 'var(--em-200)' : '#fecaca'}`,
        color: done ? 'var(--em-700)' : '#dc2626',
        fontSize: '12px', fontWeight: 600,
        cursor: isPending ? 'default' : 'pointer',
        transition: 'all 0.2s',
        flexShrink: 0,
      }}
    >
      {isPending
        ? <><Loader2 size={12} className="animate-spin" /> Clearing...</>
        : done
          ? <><CheckCircle2 size={12} /> Cleared</>
          : <><Trash2 size={12} /> Clear</>
      }
    </button>
  )
}

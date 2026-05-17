'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  BookOpen, Plus, Sparkles, Loader2, CheckCircle2, AlertCircle,
  Trash2, ArrowRight, X, ChevronRight, FileText,
} from 'lucide-react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { createRoadmap, deleteRoadmap } from '@/actions/learning'
import type { LearningNote } from '@/actions/learning'
import { NotesTab } from './NotesTab'

type Roadmap = {
  id: string; title: string; description?: string
  node_count?: number; done_count?: number; created_at: string
}

type ParseAction = (
  rawText: string, title: string, description?: string
) => Promise<{ success: true; roadmapId: string; nodeCount: number } | { error: string }>

// ── Progress Bar ─────────────────────────────────────────────────────────────
function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100)
  return (
    <div style={{ marginTop: '10px' }}>
      <div style={{ height: '5px', background: 'var(--border)', borderRadius: '99px', overflow: 'hidden' }}>
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          style={{ height: '100%', background: 'var(--em-500)', borderRadius: '99px' }}
        />
      </div>
      <p style={{ fontSize: '10px', color: 'var(--text-muted)', marginTop: '4px', textAlign: 'right' }}>{pct}%</p>
    </div>
  )
}

// ── Roadmap Card ─────────────────────────────────────────────────────────────
function RoadmapCard({ roadmap, onDelete }: { roadmap: Roadmap; onDelete: (id: string) => void }) {
  const [deleting, startDelete] = useTransition()
  const nodeCount = roadmap.node_count ?? 0
  const doneCount = roadmap.done_count ?? 0

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      style={{
        background: '#fff', borderRadius: '20px', padding: '18px 20px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
      }}
    >
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
        {/* Icon */}
        <div style={{ width: '44px', height: '44px', borderRadius: '14px', background: 'var(--em-50)', border: '1px solid var(--em-200)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
          <BookOpen size={18} color="var(--em-600)" strokeWidth={1.75} />
        </div>

        {/* Info */}
        <div style={{ flex: 1, minWidth: 0 }}>
          <h3 style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {roadmap.title}
          </h3>
          {roadmap.description && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{roadmap.description}</p>
          )}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '8px', flexWrap: 'wrap' }}>
            {nodeCount === 0 ? (
              <span style={{ fontSize: '11px', color: '#f97316', fontWeight: 600, background: '#fff7ed', padding: '3px 10px', borderRadius: '20px', border: '1px solid #fed7aa', whiteSpace: 'nowrap' }}>
                No topics yet
              </span>
            ) : (
              <>
                <span style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap' }}>{nodeCount} topics</span>
                <span style={{ fontSize: '12px', color: 'var(--em-600)', fontWeight: 600, whiteSpace: 'nowrap' }}>{doneCount} done</span>
              </>
            )}
          </div>
        </div>

        {/* Actions */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
          <button
            onClick={() => startDelete(async () => { await deleteRoadmap(roadmap.id); onDelete(roadmap.id) })}
            disabled={deleting}
            style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#fef2f2', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
          >
            {deleting ? <Loader2 size={13} color="#ef4444" className="animate-spin" /> : <Trash2 size={13} color="#ef4444" />}
          </button>
          <Link
            href={`/learning/${roadmap.id}`}
            style={{ display: 'flex', alignItems: 'center', gap: '4px', padding: '7px 14px', borderRadius: '10px', background: 'var(--em-500)', color: '#fff', fontSize: '13px', fontWeight: 600, textDecoration: 'none' }}
          >
            Open <ChevronRight size={13} />
          </Link>
        </div>
      </div>

      <ProgressBar value={doneCount} total={nodeCount} />
    </motion.div>
  )
}

// ── New Roadmap Panel ────────────────────────────────────────────────────────
function NewRoadmapPanel({
  onClose,
  parseAction,
  onCreated,
}: {
  onClose: () => void
  parseAction: ParseAction
  onCreated: (roadmapId: string) => void
}) {
  const [mode, setMode] = useState<'ai' | 'blank'>('ai')
  const [title, setTitle] = useState('')
  const [desc, setDesc] = useState('')
  const [text, setText] = useState('')
  const [result, setResult] = useState<{ error: string } | null>(null)
  const [isPending, startTransition] = useTransition()
  const [creating, startCreate] = useTransition()

  function handleAIImport() {
    if (!title.trim() || !text.trim()) return
    setResult(null)
    startTransition(async () => {
      const res = await parseAction(text, title, desc || undefined)
      if ('success' in res) {
        onCreated(res.roadmapId)
      } else {
        setResult({ error: res.error })
      }
    })
  }

  function handleBlankCreate() {
    if (!title.trim()) return
    startCreate(async () => {
      const res = await createRoadmap(title, desc || undefined)
      if (res.id) {
        onCreated(res.id)
      } else {
        setResult({ error: res.error ?? 'Failed to create roadmap.' })
      }
    })
  }

  const isLoading = isPending || creating

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      style={{
        background: '#fff', borderRadius: '20px', padding: '20px',
        marginBottom: '16px',
        boxShadow: '0 4px 24px rgba(0,0,0,0.1), 0 0 0 1px rgba(0,0,0,0.06)',
      }}
    >
      {/* Panel header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px' }}>
        <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)' }}>New Roadmap</p>
        <button onClick={onClose} style={{ width: '28px', height: '28px', borderRadius: '50%', background: 'var(--bg-surface2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}>
          <X size={13} color="var(--text-muted)" />
        </button>
      </div>

      {/* Mode switcher */}
      <div style={{ display: 'flex', background: '#f0f0f0', borderRadius: '10px', padding: '3px', gap: '2px', marginBottom: '16px' }}>
        {(['ai', 'blank'] as const).map(m => (
          <button
            key={m}
            onClick={() => setMode(m)}
            style={{
              flex: 1, padding: '7px 0', borderRadius: '8px', border: 'none', fontSize: '13px', fontWeight: 700, cursor: 'pointer', transition: 'all 0.15s',
              background: mode === m ? '#fff' : 'transparent',
              color: mode === m ? 'var(--text-primary)' : 'var(--text-muted)',
              boxShadow: mode === m ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
            }}
          >
            {m === 'ai' ? 'AI Import' : 'Blank'}
          </button>
        ))}
      </div>

      {/* Title field */}
      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '7px' }}>Title</p>
        <input
          value={title}
          onChange={e => setTitle(e.target.value)}
          placeholder={mode === 'ai' ? 'e.g. NumPy & Pandas Roadmap' : 'e.g. Rust Systems Programming'}
          style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid var(--border)', fontSize: '14px', color: 'var(--text-primary)', background: '#fafafa', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
          onKeyDown={e => mode === 'blank' && e.key === 'Enter' && handleBlankCreate()}
        />
      </div>

      <div style={{ marginBottom: '12px' }}>
        <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '7px' }}>Description <span style={{ fontWeight: 400, textTransform: 'none' }}>(optional)</span></p>
        <input
          value={desc}
          onChange={e => setDesc(e.target.value)}
          placeholder="What is this roadmap for?"
          style={{ width: '100%', padding: '10px 14px', borderRadius: '12px', border: '1.5px solid var(--border)', fontSize: '13px', color: 'var(--text-primary)', background: '#fafafa', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
        />
      </div>

      {/* AI Import paste area */}
      <AnimatePresence>
        {mode === 'ai' && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }} style={{ overflow: 'hidden', marginBottom: '14px' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '7px' }}>Paste Your Roadmap Content</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginBottom: '8px', lineHeight: 1.5 }}>
              Paste anything — ChatGPT output, bullet lists, topic names, course outlines. AI will structure it into topics.
            </p>
            <textarea
              value={text}
              onChange={e => setText(e.target.value)}
              rows={6}
              placeholder={'1. Introduction to NumPy\n   - Arrays and ndarray\n   - Indexing & slicing\n2. Pandas DataFrames\n   - Series vs DataFrame\n   - Reading CSV/Excel\n...'}
              style={{ display: 'block', width: '100%', padding: '12px 14px', borderRadius: '12px', border: '1.5px solid var(--border)', fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)', background: '#fafafa', outline: 'none', fontFamily: 'inherit', resize: 'none', boxSizing: 'border-box' }}
            />
          </motion.div>
        )}
      </AnimatePresence>

      {/* Action button */}
      <button
        onClick={mode === 'ai' ? handleAIImport : handleBlankCreate}
        disabled={isLoading || !title.trim() || (mode === 'ai' && !text.trim())}
        style={{
          display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
          width: '100%', padding: '12px', borderRadius: '12px',
          background: 'var(--em-500)', border: 'none', color: '#fff',
          fontSize: '14px', fontWeight: 700,
          cursor: isLoading || !title.trim() ? 'default' : 'pointer',
          opacity: isLoading || !title.trim() || (mode === 'ai' && !text.trim()) ? 0.6 : 1,
        }}
      >
        {isLoading
          ? <><Loader2 size={15} className="animate-spin" /> {mode === 'ai' ? 'AI is parsing…' : 'Creating…'}</>
          : mode === 'ai'
            ? <><Sparkles size={15} /> Parse & Create Roadmap</>
            : <><Plus size={15} /> Create Blank Roadmap</>
        }
      </button>

      {result?.error && (
        <div style={{ marginTop: '12px', display: 'flex', gap: '8px', alignItems: 'flex-start', padding: '10px 12px', borderRadius: '10px', background: '#fef2f2', fontSize: '13px', color: '#dc2626' }}>
          <AlertCircle size={14} style={{ flexShrink: 0, marginTop: '1px' }} />{result.error}
        </div>
      )}
    </motion.div>
  )
}

// ── Main LearningClient ──────────────────────────────────────────────────────
export function LearningClient({ roadmaps: initialRoadmaps, initialNotes, parseAction }: {
  roadmaps: Roadmap[]
  initialNotes: LearningNote[]
  parseAction: ParseAction
}) {
  const [roadmaps, setRoadmaps] = useState(initialRoadmaps)
  const [activeTab, setActiveTab] = useState<'roadmaps' | 'notes'>('roadmaps')
  const [showNew, setShowNew] = useState(false)
  const router = useRouter()

  function handleDelete(id: string) {
    setRoadmaps(r => r.filter(x => x.id !== id))
  }

  function handleCreated(roadmapId: string) {
    setShowNew(false)
    router.push(`/learning/${roadmapId}`)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f0f0' }}>

      {/* Header */}
      <div style={{ padding: '24px 20px 12px', display: 'flex', alignItems: 'flex-end', justifyContent: 'space-between' }}>
        <div>
          <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)', marginBottom: '4px' }}>Learning</h1>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
            {activeTab === 'roadmaps' ? `${roadmaps.length} roadmap${roadmaps.length !== 1 ? 's' : ''}` : 'Manage your study notes'}
          </p>
        </div>
        <AnimatePresence>
          {activeTab === 'roadmaps' && (
            <motion.button
              initial={{ opacity: 0, scale: 0.9 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.9 }}
              onClick={() => setShowNew(!showNew)}
              style={{
                display: 'flex', alignItems: 'center', gap: '6px',
                padding: '10px 18px', borderRadius: '12px',
                background: showNew ? 'var(--bg-surface2)' : 'var(--em-500)',
                border: 'none', color: showNew ? 'var(--text-muted)' : '#fff',
                fontSize: '14px', fontWeight: 600, cursor: 'pointer',
              }}
            >
              {showNew ? <><X size={14} /> Cancel</> : <><Plus size={14} /> New Roadmap</>}
            </motion.button>
          )}
        </AnimatePresence>
      </div>

      {/* Tab Bar */}
      <div style={{ padding: '0 16px 14px' }}>
        <div style={{ display: 'flex', background: '#e8e8e6', borderRadius: '14px', padding: '4px', gap: '2px' }}>
          {(['roadmaps', 'notes'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => { setActiveTab(tab); setShowNew(false); }}
              style={{
                flex: 1, padding: '8px 0', borderRadius: '10px', border: 'none',
                fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                transition: 'all 0.2s',
                background: activeTab === tab ? '#fff' : 'transparent',
                color: activeTab === tab ? 'var(--text-primary)' : 'var(--text-muted)',
                boxShadow: activeTab === tab ? '0 1px 4px rgba(0,0,0,0.1)' : 'none',
                textTransform: 'capitalize',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                {tab === 'roadmaps' && <BookOpen size={14} />}
                {tab === 'notes' && <FileText size={14} />}
                {tab === 'roadmaps' ? 'Roadmaps' : 'Notes'}
              </div>
            </button>
          ))}
        </div>
      </div>

      {/* Content */}
      <AnimatePresence mode="wait">
        {activeTab === 'roadmaps' && (
          <motion.div key="roadmaps" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.18 }} style={{ padding: '0 16px 120px' }}>
        <AnimatePresence>
          {showNew && (
            <NewRoadmapPanel
              key="new-panel"
              onClose={() => setShowNew(false)}
              parseAction={parseAction}
              onCreated={handleCreated}
            />
          )}
        </AnimatePresence>

        {roadmaps.length === 0 && !showNew ? (
          <div style={{
            background: '#fff', borderRadius: '20px', padding: '60px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
          }}>
            <BookOpen size={40} color="var(--border-2)" strokeWidth={1.25} style={{ marginBottom: '16px' }} />
            <p style={{ fontWeight: 700, fontSize: '16px', color: 'var(--text-secondary)', marginBottom: '8px' }}>No roadmaps yet</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '260px', lineHeight: 1.6, marginBottom: '20px' }}>
              Paste your ChatGPT roadmap and AI will break it into structured topics automatically.
            </p>
            <button
              onClick={() => setShowNew(true)}
              style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '10px 20px', borderRadius: '12px', background: 'var(--em-500)', border: 'none', color: '#fff', fontSize: '14px', fontWeight: 600, cursor: 'pointer' }}
            >
              <Plus size={14} /> Create Your First Roadmap
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <AnimatePresence>
              {roadmaps.map(r => <RoadmapCard key={r.id} roadmap={r} onDelete={handleDelete} />)}
            </AnimatePresence>
          </div>
        )}
          </motion.div>
        )}
        
        {activeTab === 'notes' && (
          <motion.div key="notes" initial={{ opacity: 0, x: 10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: 10 }} transition={{ duration: 0.18 }}>
            <NotesTab initialNotes={initialNotes} parseAction={parseAction} />
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  )
}

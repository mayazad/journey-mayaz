'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Plus, Sparkles, Loader2, CheckCircle2, AlertCircle, Trash2, ArrowRight } from 'lucide-react'
import Link from 'next/link'
import { createRoadmap, deleteRoadmap } from '@/actions/learning'

type Roadmap = {
  id: string; title: string; description?: string
  node_count?: number; done_count?: number; created_at: string
}

type ParseAction = (
  rawText: string, title: string, description?: string
) => Promise<{ success: true; roadmapId: string; nodeCount: number } | { error: string }>

function ProgressBar({ value, total }: { value: number; total: number }) {
  const pct = total === 0 ? 0 : Math.round((value / total) * 100)
  return (
    <div className="flex items-center gap-2 mt-2">
      <div className="flex-1 h-1.5 rounded-full bg-[var(--bg-surface2)] overflow-hidden">
        <motion.div
          initial={{ width: 0 }}
          animate={{ width: `${pct}%` }}
          transition={{ duration: 0.6, ease: 'easeOut' }}
          className="h-full bg-[var(--em-500)] rounded-full"
        />
      </div>
      <span className="text-[10px] mono text-[var(--text-muted)]">{pct}%</span>
    </div>
  )
}

function ImportPanel({ onClose, parseAction }: {
  onClose: () => void
  parseAction: ParseAction
}) {
  const [title, setTitle] = useState('')
  const [desc, setDesc]   = useState('')
  const [text, setText]   = useState('')
  const [result, setResult] = useState<{ success: true; roadmapId: string; nodeCount: number } | { error: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleImport() {
    if (!title.trim() || !text.trim()) return
    setResult(null)
    startTransition(async () => {
      const res = await parseAction(text, title, desc || undefined)
      setResult(res)
    })
  }

  return (
    <motion.div
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, y: 10 }}
      className="card border-[var(--border-accent)] shadow-md mb-6"
    >
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Sparkles size={14} className="text-[var(--em-500)]" />
          <p className="heading-3 text-[var(--text-primary)]">Import Roadmap via AI</p>
        </div>
        <button onClick={onClose} className="text-xs text-[var(--text-muted)] hover:text-[var(--text-primary)]">Cancel</button>
      </div>

      <div className="space-y-3">
        <div className="space-y-1.5">
          <label className="label">Roadmap Title</label>
          <input value={title} onChange={e => setTitle(e.target.value)}
            placeholder="e.g. NumPy & Pandas Roadmap" className="field-input" />
        </div>
        <div className="space-y-1.5">
          <label className="label">Description <span className="normal-case font-normal text-[var(--text-muted)]">(optional)</span></label>
          <input value={desc} onChange={e => setDesc(e.target.value)}
            placeholder="What is this roadmap for?" className="field-input" />
        </div>
        <div className="space-y-1.5">
          <label className="label">Paste Your Roadmap Content</label>
          <p className="text-[11px] text-[var(--text-muted)] mb-1.5">
            Paste anything — ChatGPT output, bullet lists, topic names, course outlines. AI will structure it.
          </p>
          <textarea
            value={text}
            onChange={e => setText(e.target.value)}
            rows={7}
            className="field-input resize-none text-sm"
            placeholder={"1. Introduction to NumPy\n   - Arrays and ndarray\n   - Indexing & slicing\n2. Pandas DataFrames\n   - Series vs DataFrame\n   - Reading CSV/Excel\n..."}
          />
        </div>

        <button
          onClick={handleImport}
          disabled={isPending || !title.trim() || !text.trim()}
          className="btn btn-primary w-full justify-center"
        >
          {isPending ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
          {isPending ? 'AI is parsing...' : 'Parse & Create Roadmap'}
        </button>

        {result && 'error' in result && (
          <div className="flex gap-2 items-start text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2">
            <AlertCircle size={12} className="flex-shrink-0 mt-0.5" /> {result.error}
          </div>
        )}
        {result && 'success' in result && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            className="flex items-center justify-between gap-2 text-sm bg-[var(--em-50)] border border-[var(--border-accent)] rounded-lg px-3 py-2.5"
          >
            <div className="flex items-center gap-2 text-[var(--em-700)]">
              <CheckCircle2 size={14} /> Created with {result.nodeCount} nodes!
            </div>
            <Link href={`/learning/${result.roadmapId}`} className="flex items-center gap-1 text-xs font-medium text-[var(--em-600)] hover:text-[var(--em-700)]">
              Open <ArrowRight size={11} />
            </Link>
          </motion.div>
        )}
      </div>
    </motion.div>
  )
}

function RoadmapCard({ roadmap, onDelete }: { roadmap: Roadmap; onDelete: (id: string) => void }) {
  const [deleting, startDelete] = useTransition()

  return (
    <motion.div
      layout
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      exit={{ opacity: 0, scale: 0.96 }}
      className="card group flex flex-col gap-3"
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex items-start gap-3 flex-1 min-w-0">
          <div className="w-9 h-9 rounded-xl bg-[var(--em-50)] border border-[var(--border-accent)] flex items-center justify-center flex-shrink-0 mt-0.5">
            <BookOpen size={15} className="text-[var(--em-600)]" strokeWidth={1.75} />
          </div>
          <div className="min-w-0">
            <h3 className="font-semibold text-sm text-[var(--text-primary)] truncate">{roadmap.title}</h3>
            {roadmap.description && (
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5 line-clamp-1">{roadmap.description}</p>
            )}
            <div className="flex items-center gap-3 mt-1">
              <span className="text-[10px] mono text-[var(--text-muted)]">{roadmap.node_count ?? 0} topics</span>
              <span className="text-[10px] mono text-[var(--em-600)]">{roadmap.done_count ?? 0} done</span>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-1.5 flex-shrink-0">
          <button
            onClick={() => startDelete(async () => { await deleteRoadmap(roadmap.id); onDelete(roadmap.id) })}
            disabled={deleting}
            className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-red-500 hover:bg-red-50 transition-all opacity-0 group-hover:opacity-100"
            aria-label="Delete roadmap"
          >
            {deleting ? <Loader2 size={12} className="animate-spin" /> : <Trash2 size={12} />}
          </button>
          <Link href={`/learning/${roadmap.id}`}
            className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium text-[var(--em-600)] bg-[var(--em-50)] border border-[var(--border-accent)] hover:bg-[var(--em-100)] transition-all">
            Open <ArrowRight size={11} />
          </Link>
        </div>
      </div>

      <ProgressBar value={roadmap.done_count ?? 0} total={roadmap.node_count ?? 0} />
    </motion.div>
  )
}

export function LearningClient({ roadmaps: initialRoadmaps, parseAction }: {
  roadmaps: Roadmap[]
  parseAction: ParseAction
}) {
  const [roadmaps, setRoadmaps] = useState(initialRoadmaps)
  const [showImport, setShowImport] = useState(false)
  const [showNewForm, setShowNewForm] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [creating, startCreate] = useTransition()

  function handleDelete(id: string) {
    setRoadmaps(r => r.filter(x => x.id !== id))
  }

  function handleCreateManual() {
    if (!newTitle.trim()) return
    startCreate(async () => {
      await createRoadmap(newTitle)
      setNewTitle('')
      setShowNewForm(false)
    })
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f0f0' }}>

      {/* Page Title Area */}
      <div style={{ padding: '24px 20px 16px' }}>
        <h1 style={{ fontSize: '28px', fontWeight: 800, letterSpacing: '-0.5px', color: 'var(--text-primary)', marginBottom: '4px' }}>
          Learning
        </h1>
        <p style={{ fontSize: '13px', color: 'var(--text-muted)', fontWeight: 500 }}>
          {roadmaps.length} roadmap{roadmaps.length !== 1 ? 's' : ''}
        </p>
      </div>

      {/* Action Buttons */}
      <div style={{ display: 'flex', gap: '10px', padding: '0 20px 20px' }}>
        <button
          onClick={() => { setShowImport(!showImport); setShowNewForm(false) }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 18px', borderRadius: '12px',
            background: 'transparent', border: '1.5px solid var(--em-400)',
            color: 'var(--em-600)', fontSize: '14px', fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Sparkles size={14} /> AI Import
        </button>
        <button
          onClick={() => { setShowNewForm(!showNewForm); setShowImport(false) }}
          style={{
            display: 'flex', alignItems: 'center', gap: '6px',
            padding: '10px 20px', borderRadius: '12px',
            background: 'var(--em-500)', border: 'none',
            color: '#fff', fontSize: '14px', fontWeight: 600,
            cursor: 'pointer',
          }}
        >
          <Plus size={14} /> New
        </button>
      </div>

      {/* Content Area */}
      <div style={{ padding: '0 16px 120px' }}>

        <AnimatePresence>
          {showImport && <ImportPanel onClose={() => setShowImport(false)} parseAction={parseAction} />}
        </AnimatePresence>

        <AnimatePresence>
          {showNewForm && (
            <motion.div
              initial={{ opacity: 0, y: 8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0 }}
              style={{
                background: '#fff', borderRadius: '20px', padding: '20px',
                marginBottom: '16px',
                boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
              }}
            >
              <p style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.08em', textTransform: 'uppercase', color: 'var(--text-muted)', marginBottom: '12px' }}>
                New Roadmap
              </p>
              <div style={{ display: 'flex', gap: '10px' }}>
                <input
                  value={newTitle}
                  onChange={e => setNewTitle(e.target.value)}
                  placeholder="e.g. Rust Systems Programming"
                  className="field-input"
                  style={{ flex: 1 }}
                  onKeyDown={e => e.key === 'Enter' && handleCreateManual()}
                />
                <button
                  onClick={handleCreateManual}
                  disabled={creating || !newTitle.trim()}
                  style={{
                    padding: '10px 18px', borderRadius: '10px',
                    background: 'var(--em-500)', color: '#fff',
                    border: 'none', fontWeight: 600, fontSize: '14px', cursor: 'pointer',
                  }}
                >
                  {creating ? <Loader2 size={14} className="animate-spin" /> : 'Create'}
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>

        {roadmaps.length === 0 ? (
          <div style={{
            background: '#ffffff', borderRadius: '20px', padding: '60px 20px',
            display: 'flex', flexDirection: 'column', alignItems: 'center',
            textAlign: 'center',
            boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)',
          }}>
            <BookOpen size={40} color="var(--border-2)" strokeWidth={1.25} style={{ marginBottom: '16px' }} />
            <p style={{ fontWeight: 700, fontSize: '15px', color: 'var(--text-secondary)', marginBottom: '6px' }}>No roadmaps yet</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '260px', lineHeight: 1.6 }}>
              Paste your ChatGPT roadmap using <strong style={{ color: 'var(--em-600)' }}>AI Import</strong>, or create one manually.
            </p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
            <AnimatePresence>
              {roadmaps.map(r => <RoadmapCard key={r.id} roadmap={r} onDelete={handleDelete} />)}
            </AnimatePresence>
          </div>
        )}
      </div>
    </div>
  )
}

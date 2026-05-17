'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  ArrowLeft, BookOpen, Sparkles, Loader2, CheckCircle2,
  AlertCircle, Trash2, Plus, ChevronRight,
} from 'lucide-react'
import Link from 'next/link'
import { updateNodeStatus, deleteNode } from '@/actions/learning'
import { appendNodesToRoadmap } from '@/actions/ai'
import type { RoadmapNode, Roadmap } from '@/actions/learning'

// ── Status config ─────────────────────────────────────────────────────────────
const STATUS = {
  not_started: { label: 'Not Started', bg: '#f5f5f5', color: '#6b7280', dot: '#d1d5db' },
  in_progress:  { label: 'In Progress', bg: '#ecfdf5', color: '#047857', dot: '#10b981' },
  done:         { label: 'Done',        bg: '#10b981', color: '#fff',    dot: '#fff' },
  skipped:      { label: 'Skipped',     bg: '#f9fafb', color: '#9ca3af', dot: '#d1d5db' },
} as const

// ── Node Bottom Sheet ─────────────────────────────────────────────────────────
function NodeSheet({
  node,
  index,
  total,
  onClose,
  onStatusChange,
  onDelete,
}: {
  node: RoadmapNode
  index: number
  total: number
  onClose: () => void
  onStatusChange: (id: string, status: RoadmapNode['status']) => void
  onDelete: (id: string) => void
}) {
  const [isPending, startTransition] = useTransition()
  const [confirmDel, setConfirmDel] = useState(false)

  function handleStatus(status: RoadmapNode['status']) {
    startTransition(async () => {
      await updateNodeStatus(node.id, status)
      onStatusChange(node.id, status)
    })
  }

  function handleDelete() {
    startTransition(async () => {
      await deleteNode(node.id)
      onDelete(node.id)
      onClose()
    })
  }

  const s = STATUS[node.status]

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={onClose}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200 }}
      />

      {/* Sheet */}
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#fff', borderRadius: '24px 24px 0 0',
          zIndex: 201, maxHeight: '80vh', overflowY: 'auto',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        }}
      >
        {/* Handle */}
        <div style={{ width: '36px', height: '4px', background: '#e5e7eb', borderRadius: '99px', margin: '12px auto 0' }} />

        {/* Header */}
        <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'flex-start', gap: '14px' }}>
          <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: s.bg, border: `1.5px solid ${s.dot}40`, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
            <span style={{ fontSize: '14px', fontWeight: 800, color: s.color }}>
              {String(index + 1).padStart(2, '0')}
            </span>
          </div>
          <div style={{ flex: 1 }}>
            <p style={{ fontSize: '17px', fontWeight: 800, color: 'var(--text-primary)', letterSpacing: '-0.3px', lineHeight: 1.2 }}>{node.title}</p>
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '4px' }}>Topic {index + 1} of {total}</p>
          </div>
        </div>

        {/* Description */}
        {node.description && (
          <div style={{ margin: '16px 20px 0', padding: '12px 14px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
            <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6 }}>{node.description}</p>
          </div>
        )}

        {/* Status buttons */}
        <div style={{ padding: '16px 20px 0' }}>
          <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '10px' }}>Status</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
            {(Object.entries(STATUS) as [RoadmapNode['status'], typeof STATUS[keyof typeof STATUS]][]).map(([key, cfg]) => (
              <button
                key={key}
                onClick={() => handleStatus(key)}
                disabled={isPending}
                style={{
                  padding: '10px 14px', borderRadius: '12px', border: `1.5px solid ${node.status === key ? cfg.dot : 'var(--border)'}`,
                  background: node.status === key ? cfg.bg : '#fafafa',
                  color: node.status === key ? cfg.color : 'var(--text-muted)',
                  fontSize: '13px', fontWeight: node.status === key ? 700 : 500,
                  cursor: isPending ? 'default' : 'pointer', transition: 'all 0.15s',
                  display: 'flex', alignItems: 'center', gap: '8px',
                }}
              >
                <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: node.status === key ? cfg.dot : '#d1d5db', flexShrink: 0 }} />
                {cfg.label}
                {isPending && node.status !== key && null}
              </button>
            ))}
          </div>
        </div>

        {/* Notes */}
        {node.notes && (
          <div style={{ padding: '16px 20px 0' }}>
            <p style={{ fontSize: '11px', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', letterSpacing: '0.07em', marginBottom: '8px' }}>Notes</p>
            <div style={{ padding: '12px 14px', background: 'var(--bg-surface)', borderRadius: '12px', border: '1px solid var(--border)' }}>
              <p style={{ fontSize: '13px', color: 'var(--text-secondary)', lineHeight: 1.6, whiteSpace: 'pre-wrap' }}>{node.notes}</p>
            </div>
          </div>
        )}

        {/* Delete */}
        <div style={{ padding: '20px 20px 0' }}>
          {confirmDel ? (
            <div style={{ padding: '12px 14px', background: '#fef2f2', border: '1px solid #fecaca', borderRadius: '12px' }}>
              <p style={{ fontSize: '13px', fontWeight: 600, color: '#991b1b', textAlign: 'center', marginBottom: '10px' }}>Remove this topic?</p>
              <div style={{ display: 'flex', gap: '8px' }}>
                <button onClick={() => setConfirmDel(false)} style={{ flex: 1, padding: '9px', borderRadius: '8px', background: '#fff', border: '1px solid #fca5a5', color: '#dc2626', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>Cancel</button>
                <button onClick={handleDelete} disabled={isPending} style={{ flex: 1, padding: '9px', borderRadius: '8px', background: '#dc2626', border: 'none', color: '#fff', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                  {isPending ? <Loader2 size={13} className="animate-spin" /> : null} Delete
                </button>
              </div>
            </div>
          ) : (
            <button
              onClick={() => setConfirmDel(true)}
              style={{ width: '100%', padding: '11px', borderRadius: '12px', background: '#fff', border: '1px solid #fee2e2', color: '#ef4444', fontSize: '13px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px' }}
            >
              <Trash2 size={14} /> Remove Topic
            </button>
          )}
        </div>
      </motion.div>
    </>
  )
}

// ── Add Topics Panel ──────────────────────────────────────────────────────────
function AddTopicsPanel({ roadmapId, roadmapTitle, onAdded }: {
  roadmapId: string
  roadmapTitle: string
  onAdded: (count: number) => void
}) {
  const [text, setText] = useState('')
  const [result, setResult] = useState<{ success?: number; error?: string } | null>(null)
  const [isPending, startTransition] = useTransition()

  function handleAdd() {
    if (!text.trim()) return
    setResult(null)
    startTransition(async () => {
      const res = await appendNodesToRoadmap(roadmapId, text, roadmapTitle)
      if ('success' in res) {
        setResult({ success: res.nodeCount })
        setText('')
        onAdded(res.nodeCount)
      } else {
        setResult({ error: res.error })
      }
    })
  }

  return (
    <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)', marginBottom: '16px' }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '14px 18px 0' }}>
        <div style={{ width: '20px', height: '20px', borderRadius: '6px', background: 'var(--em-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <Sparkles size={10} color="#fff" />
        </div>
        <span style={{ fontSize: '11px', fontWeight: 700, letterSpacing: '0.07em', textTransform: 'uppercase', color: 'var(--em-600)' }}>Add More Topics via AI</span>
      </div>
      <textarea
        rows={3}
        value={text}
        onChange={e => setText(e.target.value)}
        placeholder="Paste more content from ChatGPT, notes, or a course outline…"
        style={{ display: 'block', width: '100%', resize: 'none', padding: '12px 18px', border: 'none', fontSize: '13px', lineHeight: 1.6, color: 'var(--text-primary)', background: 'transparent', outline: 'none', fontFamily: 'inherit', boxSizing: 'border-box' }}
      />
      <div style={{ display: 'flex', justifyContent: 'flex-end', padding: '10px 18px', borderTop: '1px solid var(--border)', background: text.trim() ? 'var(--em-50)' : '#fafafa' }}>
        <button
          onClick={handleAdd}
          disabled={isPending || !text.trim()}
          style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '7px 14px', borderRadius: '10px', background: text.trim() ? 'var(--em-500)' : 'transparent', border: text.trim() ? 'none' : '1px solid var(--border)', color: text.trim() ? '#fff' : 'var(--text-muted)', fontSize: '12px', fontWeight: 600, cursor: text.trim() ? 'pointer' : 'default' }}
        >
          {isPending ? <><Loader2 size={12} className="animate-spin" /> Parsing…</> : <><Plus size={12} /> Add Topics</>}
        </button>
      </div>
      {result?.error && (
        <div style={{ margin: '0 18px 14px', display: 'flex', gap: '8px', padding: '10px 12px', borderRadius: '10px', background: '#fef2f2', fontSize: '13px', color: '#dc2626' }}>
          <AlertCircle size={14} style={{ flexShrink: 0 }} />{result.error}
        </div>
      )}
      {result?.success && (
        <div style={{ margin: '0 18px 14px', display: 'flex', gap: '8px', padding: '10px 12px', borderRadius: '10px', background: 'var(--em-50)', fontSize: '13px', color: 'var(--em-700)' }}>
          <CheckCircle2 size={14} style={{ flexShrink: 0 }} /> Added {result.success} new topics!
        </div>
      )}
    </div>
  )
}

// ── Topic Row ─────────────────────────────────────────────────────────────────
function TopicRow({ node, index, total, onSelect }: {
  node: RoadmapNode
  index: number
  total: number
  onSelect: (node: RoadmapNode) => void
}) {
  const s = STATUS[node.status]
  return (
    <motion.button
      layout
      initial={{ opacity: 0, y: 6 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.03 }}
      onClick={() => onSelect(node)}
      style={{
        display: 'flex', alignItems: 'center', gap: '14px',
        width: '100%', padding: '14px 16px',
        background: 'transparent', border: 'none',
        borderBottom: index < total - 1 ? '1px solid var(--border)' : 'none',
        cursor: 'pointer', textAlign: 'left',
      }}
    >
      {/* Number badge */}
      <div style={{
        width: '32px', height: '32px', borderRadius: '10px', flexShrink: 0,
        background: s.bg, border: `1.5px solid ${s.dot}40`,
        display: 'flex', alignItems: 'center', justifyContent: 'center',
      }}>
        {node.status === 'done'
          ? <CheckCircle2 size={16} color="#fff" />
          : <span style={{ fontSize: '12px', fontWeight: 800, color: s.color }}>{String(index + 1).padStart(2, '0')}</span>
        }
      </div>

      {/* Title + description */}
      <div style={{ flex: 1, minWidth: 0 }}>
        <p style={{
          fontSize: '14px', fontWeight: 600,
          color: node.status === 'done' ? 'var(--text-muted)' : node.status === 'skipped' ? 'var(--text-muted)' : 'var(--text-primary)',
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
          textDecoration: node.status === 'skipped' ? 'line-through' : 'none',
        }}>
          {node.title}
        </p>
        {node.description && (
          <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {node.description}
          </p>
        )}
      </div>

      {/* Status pill + chevron */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexShrink: 0 }}>
        <span style={{ fontSize: '11px', fontWeight: 700, padding: '3px 10px', borderRadius: '20px', background: s.bg, color: s.color, border: `1px solid ${s.dot}50`, whiteSpace: 'nowrap' }}>
          {s.label}
        </span>
        <ChevronRight size={14} color="var(--text-muted)" />
      </div>
    </motion.button>
  )
}

// ── Main RoadmapList ──────────────────────────────────────────────────────────
export function RoadmapList({ roadmap, initialNodes }: {
  roadmap: Roadmap
  initialNodes: RoadmapNode[]
}) {
  const [nodes, setNodes] = useState<RoadmapNode[]>(
    [...initialNodes].sort((a, b) => a.order_index - b.order_index)
  )
  const [selectedNode, setSelectedNode] = useState<RoadmapNode | null>(null)
  const [showAddTopics, setShowAddTopics] = useState(false)

  const done  = nodes.filter(n => n.status === 'done').length
  const total = nodes.length
  const pct   = total === 0 ? 0 : Math.round((done / total) * 100)

  function handleStatusChange(id: string, status: RoadmapNode['status']) {
    setNodes(prev => prev.map(n => n.id === id ? { ...n, status } : n))
    setSelectedNode(prev => prev?.id === id ? { ...prev, status } : prev)
  }

  function handleDelete(id: string) {
    setNodes(prev => prev.filter(n => n.id !== id))
  }

  function handleTopicsAdded() {
    // Server revalidated, close the panel — user refreshes to see new nodes
    setShowAddTopics(false)
  }

  return (
    <div style={{ minHeight: '100vh', backgroundColor: '#f0f0f0' }}>

      {/* Header */}
      <div style={{ padding: '16px 20px 0', display: 'flex', alignItems: 'center', gap: '12px' }}>
        <Link
          href="/learning"
          style={{ width: '36px', height: '36px', borderRadius: '12px', background: '#fff', border: '1px solid var(--border)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, textDecoration: 'none' }}
        >
          <ArrowLeft size={16} color="var(--text-muted)" />
        </Link>
        <div style={{ flex: 1, minWidth: 0 }}>
          <h1 style={{ fontSize: '18px', fontWeight: 800, color: 'var(--text-primary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', letterSpacing: '-0.3px' }}>
            {roadmap.title}
          </h1>
          {roadmap.description && (
            <p style={{ fontSize: '12px', color: 'var(--text-muted)', marginTop: '2px', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{roadmap.description}</p>
          )}
        </div>
        <div style={{ textAlign: 'right', flexShrink: 0 }}>
          <p style={{ fontSize: '16px', fontWeight: 800, color: 'var(--em-600)', letterSpacing: '-0.3px' }}>{done}/{total}</p>
          <p style={{ fontSize: '11px', color: 'var(--text-muted)' }}>topics</p>
        </div>
      </div>

      {/* Progress bar */}
      <div style={{ padding: '12px 20px 16px' }}>
        <div style={{ height: '6px', background: '#e5e7eb', borderRadius: '99px', overflow: 'hidden' }}>
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${pct}%` }}
            transition={{ duration: 0.7, ease: 'easeOut' }}
            style={{ height: '100%', background: pct === 100 ? '#10b981' : 'var(--em-500)', borderRadius: '99px' }}
          />
        </div>
        <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '5px' }}>
          {pct}% complete{pct === 100 ? ' 🎉' : ''}
        </p>
      </div>

      {/* Content */}
      <div style={{ padding: '0 16px 120px' }}>

        {/* Add Topics via AI toggle */}
        <button
          onClick={() => setShowAddTopics(!showAddTopics)}
          style={{
            display: 'flex', alignItems: 'center', gap: '8px',
            width: '100%', padding: '12px 16px', marginBottom: '12px',
            background: showAddTopics ? 'var(--em-50)' : '#fff',
            border: `1.5px solid ${showAddTopics ? 'var(--em-300)' : 'var(--border)'}`,
            borderRadius: '14px', cursor: 'pointer', textAlign: 'left',
          }}
        >
          <Sparkles size={15} color="var(--em-500)" />
          <span style={{ fontSize: '13px', fontWeight: 600, color: 'var(--em-700)', flex: 1 }}>
            {showAddTopics ? 'Close' : 'Add More Topics via AI'}
          </span>
          <ChevronRight size={14} color="var(--text-muted)" style={{ transform: showAddTopics ? 'rotate(90deg)' : 'none', transition: 'transform 0.2s' }} />
        </button>

        <AnimatePresence>
          {showAddTopics && (
            <motion.div
              initial={{ opacity: 0, y: -8 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -8 }}
            >
              <AddTopicsPanel
                roadmapId={roadmap.id}
                roadmapTitle={roadmap.title}
                onAdded={handleTopicsAdded}
              />
            </motion.div>
          )}
        </AnimatePresence>

        {/* Topic list */}
        {nodes.length === 0 ? (
          <div style={{ background: '#fff', borderRadius: '20px', padding: '48px 20px', textAlign: 'center', boxShadow: '0 4px 24px rgba(0,0,0,0.06)' }}>
            <BookOpen size={36} color="var(--border-2)" strokeWidth={1.25} style={{ margin: '0 auto 12px' }} />
            <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-secondary)', marginBottom: '6px' }}>No topics yet</p>
            <p style={{ fontSize: '13px', color: 'var(--text-muted)', lineHeight: 1.5 }}>Use the "Add More Topics via AI" button above to get started.</p>
          </div>
        ) : (
          <div style={{ background: '#fff', borderRadius: '20px', overflow: 'hidden', boxShadow: '0 4px 24px rgba(0,0,0,0.08), 0 0 0 1px rgba(0,0,0,0.05)' }}>
            {nodes.map((node, i) => (
              <TopicRow
                key={node.id}
                node={node}
                index={i}
                total={nodes.length}
                onSelect={setSelectedNode}
              />
            ))}
          </div>
        )}
      </div>

      {/* Node bottom sheet */}
      <AnimatePresence>
        {selectedNode && (
          <NodeSheet
            key={selectedNode.id}
            node={selectedNode}
            index={nodes.findIndex(n => n.id === selectedNode.id)}
            total={nodes.length}
            onClose={() => setSelectedNode(null)}
            onStatusChange={handleStatusChange}
            onDelete={handleDelete}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

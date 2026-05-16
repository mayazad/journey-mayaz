'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import {
  X, ExternalLink, Plus, Trash2, Loader2,
  CheckCircle2, Circle, SkipForward, PlayCircle,
} from 'lucide-react'
import { updateNodeStatus, updateNodeDetails } from '@/actions/learning'
import type { RoadmapNode } from '@/actions/learning'

const STATUS_CONFIG = {
  not_started: { label: 'Not Started', icon: Circle,      color: 'text-[var(--text-muted)]',  bg: 'bg-[var(--bg-surface2)]' },
  in_progress:  { label: 'In Progress', icon: PlayCircle,  color: 'text-[var(--em-600)]',      bg: 'bg-[var(--em-50)] border border-[var(--border-accent)]' },
  done:         { label: 'Done',        icon: CheckCircle2, color: 'text-[var(--em-600)]',     bg: 'bg-[var(--em-100)] border border-[var(--border-accent)]' },
  skipped:      { label: 'Skipped',    icon: SkipForward,  color: 'text-[var(--text-muted)]', bg: 'bg-[var(--bg-surface2)]' },
} as const

interface NodeSidePanelProps {
  node: RoadmapNode
  onClose: () => void
  onStatusChange: (nodeId: string, status: RoadmapNode['status']) => void
}

export function NodeSidePanel({ node, onClose, onStatusChange }: NodeSidePanelProps) {
  const [notes, setNotes]   = useState(node.notes ?? '')
  const [links, setLinks]   = useState<{ label: string; url: string }[]>(
    Array.isArray(node.links) ? node.links as { label: string; url: string }[] : []
  )
  const [newLink, setNewLink] = useState({ label: '', url: '' })
  const [saving, startSave]   = useTransition()
  const [toggling, startToggle] = useTransition()
  const [saved, setSaved]     = useState(false)

  function cycleStatus() {
    const order: RoadmapNode['status'][] = ['not_started', 'in_progress', 'done', 'skipped']
    const next = order[(order.indexOf(node.status) + 1) % order.length]
    startToggle(async () => {
      await updateNodeStatus(node.id, next)
      onStatusChange(node.id, next)
    })
  }

  function addLink() {
    if (!newLink.url.trim()) return
    const label = newLink.label.trim() || newLink.url
    setLinks([...links, { label, url: newLink.url.trim() }])
    setNewLink({ label: '', url: '' })
  }

  function removeLink(i: number) {
    setLinks(links.filter((_, idx) => idx !== i))
  }

  function handleSave() {
    setSaved(false)
    startSave(async () => {
      await updateNodeDetails(node.id, notes, links)
      setSaved(true)
      setTimeout(() => setSaved(false), 2000)
    })
  }

  const status = node.status
  const cfg    = STATUS_CONFIG[status] || STATUS_CONFIG.not_started
  const Icon   = cfg.icon

  return (
    <motion.div
      initial={{ x: '100%', opacity: 0 }}
      animate={{ x: 0, opacity: 1 }}
      exit={{ x: '100%', opacity: 0 }}
      transition={{ type: 'spring', damping: 28, stiffness: 280 }}
      className="fixed top-0 right-0 h-full w-full max-w-sm bg-[var(--bg-surface)] border-l border-[var(--border)] shadow-xl z-50 flex flex-col"
    >
      {/* Header */}
      <div className="flex items-start gap-3 px-5 py-4 border-b border-[var(--border)]">
        <div className="flex-1 min-w-0">
          <h2 className="font-semibold text-[var(--text-primary)] text-sm leading-snug">{node.title}</h2>
          {node.description && (
            <p className="text-xs text-[var(--text-tertiary)] mt-1 leading-relaxed">{node.description}</p>
          )}
        </div>
        <button onClick={onClose} className="p-1.5 rounded-lg text-[var(--text-muted)] hover:text-[var(--text-primary)] hover:bg-[var(--bg-surface2)] transition-all flex-shrink-0">
          <X size={15} />
        </button>
      </div>

      {/* Scrollable body */}
      <div className="flex-1 overflow-y-auto px-5 py-5 space-y-5">

        {/* Status toggle */}
        <div>
          <p className="label mb-2">Status</p>
          <button
            onClick={cycleStatus}
            disabled={toggling}
            className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-medium transition-all ${cfg.bg} ${cfg.color} hover:opacity-80`}
          >
            {toggling ? <Loader2 size={14} className="animate-spin" /> : <Icon size={14} />}
            {cfg.label}
            <span className="ml-1 text-[11px] font-normal text-[var(--text-muted)]">— click to cycle</span>
          </button>
        </div>

        {/* Notes */}
        <div>
          <p className="label mb-2">Notes</p>
          <textarea
            rows={5}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className="field-input resize-none text-sm"
            placeholder="Add notes, key concepts, resources, or anything useful..."
          />
        </div>

        {/* Links */}
        <div>
          <p className="label mb-2">Links & Resources</p>
          {links.length > 0 && (
            <div className="space-y-1.5 mb-2.5">
              {links.map((link, i) => (
                <div key={i} className="flex items-center gap-2 px-3 py-2 rounded-lg bg-[var(--bg-surface2)] border border-[var(--border)] group">
                  <a href={link.url} target="_blank" rel="noopener noreferrer"
                    className="flex-1 min-w-0 flex items-center gap-1.5 text-sm text-[var(--em-600)] hover:text-[var(--em-700)] truncate">
                    <ExternalLink size={11} className="flex-shrink-0" />
                    <span className="truncate">{link.label}</span>
                  </a>
                  <button onClick={() => removeLink(i)}
                    className="p-1 rounded text-[var(--text-muted)] hover:text-red-500 opacity-0 group-hover:opacity-100 transition-all flex-shrink-0">
                    <Trash2 size={11} />
                  </button>
                </div>
              ))}
            </div>
          )}

          {/* Add link form */}
          <div className="space-y-1.5">
            <input
              value={newLink.label}
              onChange={e => setNewLink(l => ({ ...l, label: e.target.value }))}
              placeholder="Label (e.g. Official Docs)"
              className="field-input text-sm"
            />
            <div className="flex gap-2">
              <input
                value={newLink.url}
                onChange={e => setNewLink(l => ({ ...l, url: e.target.value }))}
                placeholder="https://..."
                className="field-input text-sm flex-1"
                onKeyDown={e => e.key === 'Enter' && addLink()}
              />
              <button onClick={addLink} className="btn btn-ghost px-3 py-2 flex-shrink-0">
                <Plus size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Save footer */}
      <div className="px-5 py-4 border-t border-[var(--border)]">
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn btn-primary w-full justify-center"
        >
          {saving ? <Loader2 size={14} className="animate-spin" /> : saved ? <CheckCircle2 size={14} /> : null}
          {saving ? 'Saving...' : saved ? 'Saved!' : 'Save Notes & Links'}
        </button>
      </div>
    </motion.div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Plus, X, Loader2, Sparkles, FileText, CheckCircle2, ArrowLeft, Trash2, Edit3 } from 'lucide-react'
import { useRouter } from 'next/navigation'
import type { LearningNote } from '@/actions/learning'
import { createNote, updateNote, deleteNote } from '@/actions/learning'

export function NotesTab({
  initialNotes,
  parseAction,
}: {
  initialNotes: LearningNote[]
  parseAction: (text: string, title: string, desc?: string) => Promise<{ success: true; roadmapId: string; nodeCount: number } | { error: string }>
}) {
  const router = useRouter()
  const [notes, setNotes] = useState<LearningNote[]>(initialNotes)
  const [activeNoteId, setActiveNoteId] = useState<string | null>(null)
  
  // Create state
  const [isCreating, startCreating] = useTransition()

  // Find the active note
  const activeNote = activeNoteId === 'new' ? { id: 'new', title: '', content: '' } as LearningNote : notes.find(n => n.id === activeNoteId)

  async function handleCreateNew() {
    startCreating(async () => {
      const res = await createNote('Untitled Note', '')
      if (res.id) {
        setNotes([{ id: res.id, title: 'Untitled Note', content: '', created_at: new Date().toISOString(), updated_at: new Date().toISOString() }, ...notes])
        setActiveNoteId(res.id)
      }
    })
  }

  return (
    <div style={{ padding: '0 16px 120px' }}>
      <AnimatePresence mode="wait">
        {!activeNoteId ? (
          <motion.div key="list" initial={{ opacity: 0, x: -10 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -10 }} transition={{ duration: 0.2 }}>
            <button
              onClick={handleCreateNew}
              disabled={isCreating}
              style={{
                width: '100%', padding: '14px', borderRadius: '16px', background: '#fff',
                border: '1px dashed var(--em-400)', color: 'var(--em-600)',
                fontSize: '14px', fontWeight: 700, cursor: 'pointer',
                display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                marginBottom: '16px'
              }}
            >
              {isCreating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              New Note
            </button>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
              {notes.length === 0 && (
                <div style={{ textAlign: 'center', padding: '40px 20px', color: 'var(--text-muted)' }}>
                  <FileText size={32} style={{ opacity: 0.2, margin: '0 auto 12px' }} />
                  <p style={{ fontSize: '13px', fontWeight: 500 }}>No notes yet.</p>
                  <p style={{ fontSize: '12px', opacity: 0.8, marginTop: '4px' }}>Jot down course outlines, brain dumps, or ideas here.</p>
                </div>
              )}
              {notes.map(note => (
                <div
                  key={note.id}
                  onClick={() => setActiveNoteId(note.id)}
                  style={{
                    background: '#fff', padding: '16px', borderRadius: '16px',
                    boxShadow: '0 4px 20px rgba(0,0,0,0.04), 0 0 0 1px rgba(0,0,0,0.03)',
                    cursor: 'pointer'
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                    <div style={{ width: '36px', height: '36px', borderRadius: '10px', background: 'var(--em-50)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                      <FileText size={16} color="var(--em-600)" />
                    </div>
                    <div style={{ flex: 1, minWidth: 0 }}>
                      <p style={{ fontSize: '14px', fontWeight: 700, color: 'var(--text-primary)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                        {note.title || 'Untitled'}
                      </p>
                      <p style={{ fontSize: '12px', color: 'var(--text-muted)', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis', marginTop: '2px' }}>
                        {note.content?.substring(0, 60) || 'Empty note...'}
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        ) : (
          <NoteSheet
            key="editor"
            note={activeNote!}
            isNew={activeNoteId === 'new'}
            onClose={() => setActiveNoteId(null)}
            onUpdate={(updatedNote) => {
              setNotes(prev => prev.map(n => n.id === updatedNote.id ? updatedNote : n))
            }}
            onDelete={(id) => {
              setNotes(prev => prev.filter(n => n.id !== id))
              setActiveNoteId(null)
            }}
            parseAction={parseAction}
            router={router}
          />
        )}
      </AnimatePresence>
    </div>
  )
}

function NoteSheet({
  note,
  isNew,
  onClose,
  onUpdate,
  onDelete,
  parseAction,
  router
}: {
  note: LearningNote
  onClose: () => void
  isNew: boolean
  onUpdate: (n: LearningNote) => void
  onDelete: (id: string) => void
  parseAction: (text: string, title: string, desc?: string) => Promise<{ success: true; roadmapId: string; nodeCount: number } | { error: string }>
  router: any
}) {
  const [isEditing, setIsEditing] = useState(isNew)
  const [title, setTitle] = useState(note.title)
  const [content, setContent] = useState(note.content || '')
  
  const [isSaving, startSaving] = useTransition()
  const [isDeleting, startDeleting] = useTransition()
  const [isGenerating, startGenerating] = useTransition()

  // Save changes automatically
  function handleSave() {
    if (title === note.title && content === note.content) {
      setIsEditing(false)
      return
    }
    startSaving(async () => {
      await updateNote(note.id, title, content)
      onUpdate({ ...note, title, content, updated_at: new Date().toISOString() })
      setIsEditing(false)
    })
  }

  function handleGenerateRoadmap() {
    if (!content.trim()) return alert("Note is empty! Write something first.")
    startGenerating(async () => {
      const res = await parseAction(content, title || "Untitled Note", "Generated from Note")
      if ('success' in res && res.success) {
        router.push('/learning/' + res.roadmapId)
      } else if ('error' in res) {
        alert(res.error)
      }
    })
  }

  return (
    <>
      <motion.div
        initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
        onClick={() => { if (isEditing) handleSave(); onClose(); }}
        style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.35)', zIndex: 200 }}
      />
      <motion.div
        initial={{ y: '100%' }} animate={{ y: 0 }} exit={{ y: '100%' }}
        transition={{ type: 'spring', damping: 30, stiffness: 320 }}
        style={{
          position: 'fixed', bottom: 0, left: 0, right: 0,
          background: '#f8f8f8', borderRadius: '24px 24px 0 0',
          zIndex: 201, height: '90vh',
          display: 'flex', flexDirection: 'column',
          paddingBottom: 'max(24px, env(safe-area-inset-bottom))',
        }}
      >
        <div style={{ width: '36px', height: '4px', background: '#d1d5db', borderRadius: '99px', margin: '12px auto' }} />

        {/* Header */}
        <div style={{ padding: '0 20px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: '1px solid #e5e5e5' }}>
          <button onClick={() => { if(isEditing) handleSave(); onClose(); }} style={{ display: 'flex', alignItems: 'center', gap: '6px', background: 'none', border: 'none', color: 'var(--text-muted)', fontSize: '13px', fontWeight: 600, cursor: 'pointer' }}>
            <X size={18} /> Close
          </button>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              onClick={() => startDeleting(async () => { await deleteNote(note.id); onDelete(note.id) })}
              disabled={isDeleting}
              style={{ width: '32px', height: '32px', borderRadius: '10px', background: '#fef2f2', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer', color: '#ef4444' }}
            >
              {isDeleting ? <Loader2 size={14} className="animate-spin" /> : <Trash2 size={14} />}
            </button>
            {isEditing ? (
              <button
                onClick={handleSave}
                disabled={isSaving}
                style={{ padding: '0 12px', height: '32px', borderRadius: '10px', background: 'var(--em-50)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--em-700)', fontSize: '12px', fontWeight: 700 }}
              >
                {isSaving ? <Loader2 size={12} className="animate-spin" /> : <CheckCircle2 size={12} />}
                {isSaving ? 'Saving' : 'Save'}
              </button>
            ) : (
              <button
                onClick={() => setIsEditing(true)}
                style={{ padding: '0 12px', height: '32px', borderRadius: '10px', background: 'var(--em-50)', border: 'none', display: 'flex', alignItems: 'center', gap: '6px', cursor: 'pointer', color: 'var(--em-700)', fontSize: '12px', fontWeight: 700 }}
              >
                <Edit3 size={12} /> Edit
              </button>
            )}
          </div>
        </div>

        {/* Scrollable Content */}
        <div style={{ flex: 1, overflowY: 'auto', padding: '20px' }}>
          <div style={{ background: '#fff', borderRadius: '20px', padding: '24px', boxShadow: '0 4px 24px rgba(0,0,0,0.04)' }}>
            {isEditing ? (
              <>
                <input
                  value={title}
                  onChange={e => setTitle(e.target.value)}
                  placeholder="Note Title"
                  style={{ width: '100%', fontSize: '24px', fontWeight: 800, border: 'none', outline: 'none', marginBottom: '16px', color: 'var(--text-primary)', background: 'transparent' }}
                />
                <textarea
                  value={content}
                  onChange={e => setContent(e.target.value)}
                  placeholder="Start typing your study notes, raw outlines, or brainstorming here..."
                  style={{ width: '100%', height: 'calc(90vh - 280px)', fontSize: '15px', lineHeight: 1.6, border: 'none', outline: 'none', color: 'var(--text-primary)', resize: 'none', background: 'transparent', fontFamily: 'inherit' }}
                />
              </>
            ) : (
              <>
                <h1 style={{ fontSize: '24px', fontWeight: 800, color: 'var(--text-primary)', marginBottom: '16px' }}>{title || 'Untitled Note'}</h1>
                <div style={{ fontSize: '15px', lineHeight: 1.6, color: 'var(--text-secondary)', whiteSpace: 'pre-wrap', wordBreak: 'break-word', minHeight: 'calc(90vh - 280px)' }}>
                  {content || <span style={{ color: 'var(--text-muted)', fontStyle: 'italic' }}>Empty note. Click Edit to add content.</span>}
                </div>
              </>
            )}
          </div>

          <button
            onClick={handleGenerateRoadmap}
            disabled={isGenerating || !content.trim()}
            style={{
              width: '100%', padding: '16px', borderRadius: '16px', marginTop: '20px',
              background: 'var(--em-500)', color: '#fff', border: 'none',
              fontSize: '14px', fontWeight: 700, cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
              boxShadow: '0 8px 16px rgba(16,185,129,0.2)',
              opacity: isGenerating || !content.trim() ? 0.7 : 1
            }}
          >
            {isGenerating ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
            {isGenerating ? 'AI is generating plan...' : 'AI: Make Plan From Note'}
          </button>
        </div>
      </motion.div>
    </>
  )
}

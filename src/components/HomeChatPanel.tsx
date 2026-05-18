'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Loader2, Sparkles, Dumbbell } from 'lucide-react'
import { chatWithAI, generateDailyBriefing, getChatHistory, saveChatMessage, clearChatHistory } from '@/actions/ai'
import ReactMarkdown from 'react-markdown'

type Message = {
  id: string
  role: 'user' | 'ai'
  content: string
  isMarkdown?: boolean
}

const HOTKEYS = [
  { key: '/workout',     label: "Today's workout",       prompt: "Give me a detailed breakdown of today's workout with tips for each exercise." },
  { key: '/tasks',       label: 'Prioritize my tasks',   prompt: 'Based on my deadlines, what should I focus on today and in what order?' },
  { key: '/motivate',   label: 'Motivate me',            prompt: 'Give me a short, sharp motivational message tailored to what I have going on today.' },
  { key: '/week',        label: 'Week summary',          prompt: 'Give me a full summary of what I have coming up this week — tasks, workouts, and learning.' },
  { key: '/coach',       label: 'Coach Mode — review everything', prompt: 'Check my workout plan, nutrition, and sleep and tell me how I can improve across all three.' },
  { key: '/dailybrief', label: 'Fresh daily briefing',  prompt: '__DAILYBRIEF__' },
  { key: '/clear',       label: 'Clear chat history',   prompt: '__CLEAR__' },
]

interface HomeChatPanelProps {
  contextSnapshot: string
}

/** Works in both HTTPS (Vercel) and plain HTTP (local network dev on mobile) */
function safeId(): string {
  if (typeof crypto !== 'undefined' && typeof crypto.randomUUID === 'function') {
    return crypto.randomUUID()
  }
  return Math.random().toString(36).slice(2) + Date.now().toString(36)
}

export function HomeChatPanel({ contextSnapshot }: HomeChatPanelProps) {
  const [open, setOpen]               = useState(false)
  const [messages, setMessages]       = useState<Message[]>([])
  const [input, setInput]             = useState('')
  const [showHotkeys, setShowHotkeys] = useState(false)
  const [coachMode, setCoachMode]     = useState(false)
  const [isPending, startTransition]  = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  // Load chat history from DB on mount — filtered by current mode
  useEffect(() => {
    async function loadHistory() {
      const mode = coachMode ? 'coach' : 'general'
      const history = await getChatHistory(mode)
      if (history && history.length > 0) {
        setMessages(history.map(msg => ({
          id: msg.id,
          role: msg.role === 'assistant' ? 'ai' : 'user',
          content: msg.content,
        })))
      } else {
        setMessages([])
      }
    }
    loadHistory()
  }, [coachMode])  // re-load whenever mode switches

  function handleInputChange(val: string) {
    setInput(val)
    setShowHotkeys(val === '/' || (val.startsWith('/') && HOTKEYS.some(h => h.key.startsWith(val))))
  }

  function addMessage(msg: Omit<Message, 'id'>) {
    setMessages(prev => [...prev, { ...msg, id: safeId() }])
  }

  function handleHotkeySelect(hotkey: typeof HOTKEYS[0]) {
    setInput('')
    setShowHotkeys(false)
    if (hotkey.prompt === '__CLEAR__') {
      handleClear()
      return
    }
    if (hotkey.prompt === '__DAILYBRIEF__') {
      addMessage({ role: 'user', content: '🔄 Generate a fresh daily briefing' })
      startTransition(async () => {
        const result = await generateDailyBriefing({ skipCache: true })
        addMessage({ role: 'ai', content: result.markdown, isMarkdown: true })
      })
      return
    }
    sendMessage(hotkey.prompt)
  }

  function handleClear() {
    setMessages([])
    setInput('')
    setShowHotkeys(false)
    // Only clear the current mode's history in DB
    const mode = coachMode ? 'coach' : 'general'
    clearChatHistory(mode)
  }

  function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return

    // Intercept /clear typed manually
    if (trimmed.toLowerCase() === '/clear') {
      handleClear()
      return
    }

    // Save to DB in background — keyed to current mode
    const mode = coachMode ? 'coach' : 'general'
    saveChatMessage('user', trimmed, mode)
    addMessage({ role: 'user', content: trimmed })

    setInput('')
    setShowHotkeys(false)
    startTransition(async () => {
      const now = new Date()
      const clientTime = now.toLocaleString('en-US', {
        weekday: 'long', year: 'numeric', month: 'long',
        day: 'numeric', hour: '2-digit', minute: '2-digit', hour12: true,
      })
      const y = now.getFullYear()
      const mo = String(now.getMonth() + 1).padStart(2, '0')
      const d = String(now.getDate()).padStart(2, '0')
      const clientDateISO = `${y}-${mo}-${d}`

      // Pass conversation history for context
      const chatHistory = messages.map(m => ({
        role: m.role === 'ai' ? 'assistant' as const : 'user' as const,
        content: m.content,
      }))

      const result = await chatWithAI(trimmed, contextSnapshot, clientTime, clientDateISO, chatHistory, coachMode)
      if ('reply' in result) {
        saveChatMessage('assistant', result.reply, mode)
        addMessage({ role: 'ai', content: result.reply })
      } else {
        addMessage({ role: 'ai', content: `❌ ${result.error}` })
      }
    })
  }

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    sendMessage(input)
  }

  return (
    <>
      {/* Floating trigger button */}
      <motion.button
        onClick={() => setOpen(true)}
        whileTap={{ scale: 0.92 }}
        style={{
          position: 'fixed',
          bottom: '110px',
          right: '20px',
          width: '52px',
          height: '52px',
          borderRadius: '50%',
          background: 'var(--em-500)',
          border: 'none',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          boxShadow: '0 4px 20px rgba(16,185,129,0.4)',
          cursor: 'pointer',
          zIndex: 100,
        }}
      >
        <MessageCircle size={22} color="#fff" />
      </motion.button>

      {/* Chat sheet */}
      <AnimatePresence>
        {open && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setOpen(false)}
              style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.3)', zIndex: 200 }}
            />

            {/* Panel */}
            <motion.div
              initial={{ y: '100%' }}
              animate={{ y: 0 }}
              exit={{ y: '100%' }}
              transition={{ type: 'spring', damping: 28, stiffness: 300 }}
              style={{
                position: 'fixed',
                bottom: 0, left: 0, right: 0,
                height: '72vh',
                background: '#fff',
                borderRadius: '24px 24px 0 0',
                display: 'flex',
                flexDirection: 'column',
                zIndex: 201,
                overflow: 'hidden',
              }}
            >
              {/* Header */}
              <div style={{
                display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                padding: '14px 20px',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: coachMode ? '#7c3aed' : 'var(--em-500)', display: 'flex', alignItems: 'center', justifyContent: 'center', transition: 'background 0.2s' }}>
                    {coachMode ? <Dumbbell size={14} color="#fff" /> : <Sparkles size={14} color="#fff" />}
                  </div>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>
                      {coachMode ? 'Coach Mode' : 'Ask your AI'}
                    </p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>
                      {coachMode ? 'Fitness coaching — form, plans & recovery' : 'Type / for shortcuts'}
                    </p>
                  </div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  {/* Coach Mode toggle */}
                  <button
                    onClick={() => setCoachMode(prev => !prev)}
                    title={coachMode ? 'Switch to General Mode' : 'Switch to Coach Mode'}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '5px',
                      padding: '5px 10px',
                      borderRadius: '20px',
                      background: coachMode ? '#7c3aed' : 'var(--bg-surface2)',
                      border: coachMode ? '1.5px solid #7c3aed' : '1.5px solid var(--border)',
                      cursor: 'pointer',
                      transition: 'all 0.2s',
                    }}
                  >
                    <Dumbbell size={11} color={coachMode ? '#fff' : 'var(--text-muted)'} />
                    <span style={{ fontSize: '11px', fontWeight: 600, color: coachMode ? '#fff' : 'var(--text-muted)' }}>
                      Coach
                    </span>
                  </button>
                  <button
                    onClick={() => setOpen(false)}
                    style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-surface2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                  >
                    <X size={16} color="var(--text-muted)" />
                  </button>
                </div>
              </div>

              {/* Coach Mode banner */}
              <AnimatePresence>
                {coachMode && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    style={{
                      background: 'linear-gradient(135deg, #f5f3ff, #ede9fe)',
                      borderBottom: '1px solid #ddd6fe',
                      padding: '8px 20px',
                      flexShrink: 0,
                      overflow: 'hidden',
                    }}
                  >
                    <p style={{ fontSize: '11.5px', color: '#6d28d9', fontWeight: 500, lineHeight: 1.4 }}>
                      Coach Mode active — ask about exercise form, workout plans, goals, and recovery. I'll check your actual data before answering.
                    </p>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.length === 0 && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '8px', padding: '40px 0' }}>
                    {coachMode
                      ? <Dumbbell size={32} color="#7c3aed" />
                      : <Sparkles size={32} color="var(--em-300)" />
                    }
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>
                      {coachMode ? 'Your Coach is ready' : 'Your AI is ready'}
                    </p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '240px', lineHeight: 1.5 }}>
                      {coachMode
                        ? 'Ask about any exercise, request a plan, or say "check my recovery" for a full analysis.'
                        : 'Ask anything about your day, or type / for quick shortcuts.'
                      }
                    </p>
                  </div>
                )}
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    style={{ display: 'flex', justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start' }}
                  >
                    <div style={{
                      maxWidth: '85%',
                      padding: '10px 14px',
                      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: msg.role === 'user'
                        ? (coachMode ? '#7c3aed' : 'var(--em-500)')
                        : '#f5f5f5',
                      fontSize: '13.5px',
                      lineHeight: 1.6,
                      color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                    }}>
                      {msg.role === 'user' ? (
                        msg.content
                      ) : (
                        <ReactMarkdown
                          components={{
                            h1: ({ children }) => <p style={{ fontWeight: 800, fontSize: '15px', marginBottom: '4px', marginTop: '10px' }}>{children}</p>,
                            h2: ({ children }) => <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', marginTop: '10px' }}>{children}</p>,
                            h3: ({ children }) => <p style={{ fontWeight: 700, fontSize: '13.5px', marginBottom: '4px', marginTop: '8px' }}>{children}</p>,
                            p:  ({ children }) => <p style={{ marginBottom: '6px' }}>{children}</p>,
                            ul: ({ children }) => <ul style={{ paddingLeft: '16px', marginBottom: '6px' }}>{children}</ul>,
                            ol: ({ children }) => <ol style={{ paddingLeft: '16px', marginBottom: '6px' }}>{children}</ol>,
                            li: ({ children }) => <li style={{ marginBottom: '3px' }}>{children}</li>,
                            strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
                            em: ({ children }) => <em style={{ fontStyle: 'italic' }}>{children}</em>,
                            code: ({ children }) => <code style={{ background: '#e5e7eb', padding: '1px 5px', borderRadius: '4px', fontSize: '12px', fontFamily: 'monospace' }}>{children}</code>,
                          }}
                        >{msg.content}</ReactMarkdown>
                      )}
                    </div>
                  </div>
                ))}
                {isPending && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ padding: '10px 16px', borderRadius: '18px 18px 18px 4px', background: '#f5f5f5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Loader2 size={14} color={coachMode ? '#7c3aed' : 'var(--em-500)'} className="animate-spin" />
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>
                        {coachMode ? 'Your coach is thinking...' : 'Thinking...'}
                      </span>
                    </div>
                  </div>
                )}
                <div ref={bottomRef} />
              </div>

              {/* Hotkey picker */}
              <AnimatePresence>
                {showHotkeys && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: 8 }}
                    style={{
                      borderTop: '1px solid var(--border)',
                      background: '#fff',
                      flexShrink: 0,
                      maxHeight: '200px',
                      overflowY: 'auto',
                    }}
                  >
                    {HOTKEYS.filter(h => input === '/' || h.key.startsWith(input)).map(hotkey => (
                      <button
                        key={hotkey.key}
                        onClick={() => handleHotkeySelect(hotkey)}
                        style={{
                          display: 'flex', alignItems: 'center', gap: '12px',
                          width: '100%', padding: '12px 20px',
                          background: 'transparent', border: 'none',
                          borderBottom: '1px solid var(--border)',
                          cursor: 'pointer', textAlign: 'left',
                        }}
                      >
                        <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: coachMode ? '#7c3aed' : 'var(--em-600)', minWidth: '90px' }}>
                          {hotkey.key}
                        </span>
                        <span style={{ fontSize: '13px', color: 'var(--text-secondary)' }}>{hotkey.label}</span>
                      </button>
                    ))}
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Input bar */}
              <form
                onSubmit={handleSubmit}
                style={{
                  display: 'flex', alignItems: 'center', gap: '10px',
                  padding: '12px 16px',
                  borderTop: '1px solid var(--border)',
                  background: '#fff',
                  flexShrink: 0,
                  paddingBottom: 'max(12px, env(safe-area-inset-bottom))',
                }}
              >
                <input
                  ref={inputRef}
                  value={input}
                  onChange={e => handleInputChange(e.target.value)}
                  placeholder={coachMode ? 'Ask about form, plans, recovery...' : 'Ask anything, or type / for shortcuts...'}
                  disabled={isPending}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: `1.5px solid ${coachMode ? '#ddd6fe' : 'var(--border)'}`,
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    background: coachMode ? '#faf5ff' : '#fafafa',
                    outline: 'none',
                    fontFamily: 'inherit',
                    transition: 'border-color 0.2s, background 0.2s',
                  }}
                />
                <button
                  type="submit"
                  disabled={isPending || !input.trim()}
                  style={{
                    width: '40px', height: '40px',
                    borderRadius: '12px',
                    background: !input.trim() ? 'var(--border)' : coachMode ? '#7c3aed' : 'var(--em-500)',
                    border: 'none',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    cursor: input.trim() ? 'pointer' : 'default',
                    flexShrink: 0,
                    transition: 'background 0.2s',
                  }}
                >
                  <Send size={16} color="#fff" />
                </button>
              </form>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  )
}

'use client'

import { useState, useRef, useEffect, useTransition } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { MessageCircle, X, Send, Loader2, Sparkles } from 'lucide-react'
import { chatWithAI, generateDailyBriefing } from '@/actions/ai'
import ReactMarkdown from 'react-markdown'

type Message = {
  id: string
  role: 'user' | 'ai'
  content: string
  isMarkdown?: boolean
}

const HOTKEYS = [
  { key: '/workout',     label: 'Today\'s workout',        prompt: 'Give me a detailed breakdown of today\'s workout with tips for each exercise.' },
  { key: '/tasks',       label: 'Prioritize my tasks',     prompt: 'Based on my deadlines, what should I focus on today and in what order?' },
  { key: '/motivate',    label: 'Motivate me',             prompt: 'Give me a short, sharp motivational message tailored to what I have going on today.' },
  { key: '/week',        label: 'Week summary',            prompt: 'Give me a full summary of what I have coming up this week — tasks, workouts, and learning.' },
  { key: '/dailybrief',  label: 'Fresh daily briefing',   prompt: '__DAILYBRIEF__' },
  { key: '/clear',       label: 'Clear chat',              prompt: '__CLEAR__' },
]

interface HomeChatPanelProps {
  contextSnapshot: string
}

export function HomeChatPanel({ contextSnapshot }: HomeChatPanelProps) {
  const [open, setOpen]             = useState(false)
  const [messages, setMessages]     = useState<Message[]>([])
  const [input, setInput]           = useState('')
  const [showHotkeys, setShowHotkeys] = useState(false)
  const [isPending, startTransition] = useTransition()
  const bottomRef = useRef<HTMLDivElement>(null)
  const inputRef  = useRef<HTMLInputElement>(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  useEffect(() => {
    if (open) setTimeout(() => inputRef.current?.focus(), 300)
  }, [open])

  function handleInputChange(val: string) {
    setInput(val)
    setShowHotkeys(val === '/' || val.startsWith('/') && HOTKEYS.some(h => h.key.startsWith(val)))
  }

  function addMessage(msg: Omit<Message, 'id'>) {
    setMessages(prev => [...prev, { ...msg, id: crypto.randomUUID() }])
  }

  function handleHotkeySelect(hotkey: typeof HOTKEYS[0]) {
    setInput('')
    setShowHotkeys(false)
    if (hotkey.prompt === '__CLEAR__') {
      setMessages([])
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

  function sendMessage(text: string) {
    const trimmed = text.trim()
    if (!trimmed) return
    addMessage({ role: 'user', content: trimmed })
    setInput('')
    setShowHotkeys(false)
    startTransition(async () => {
      const result = await chatWithAI(trimmed, contextSnapshot)
      if ('reply' in result) {
        addMessage({ role: 'ai', content: result.reply })
      } else {
        addMessage({ role: 'ai', content: `Error: ${result.error}` })
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
          bottom: '96px',     // sits above the floating nav pill
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
                padding: '16px 20px',
                borderBottom: '1px solid var(--border)',
                flexShrink: 0,
              }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                  <div style={{ width: '28px', height: '28px', borderRadius: '8px', background: 'var(--em-500)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <Sparkles size={14} color="#fff" />
                  </div>
                  <div>
                    <p style={{ fontSize: '15px', fontWeight: 700, color: 'var(--text-primary)', lineHeight: 1 }}>Ask your AI</p>
                    <p style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '2px' }}>Type / for shortcuts</p>
                  </div>
                </div>
                <button
                  onClick={() => setOpen(false)}
                  style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--bg-surface2)', border: 'none', display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer' }}
                >
                  <X size={16} color="var(--text-muted)" />
                </button>
              </div>

              {/* Messages */}
              <div style={{ flex: 1, overflowY: 'auto', padding: '16px 20px', display: 'flex', flexDirection: 'column', gap: '12px' }}>
                {messages.length === 0 && (
                  <div style={{ flex: 1, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', textAlign: 'center', gap: '8px', padding: '40px 0' }}>
                    <Sparkles size={32} color="var(--em-300)" />
                    <p style={{ fontSize: '14px', fontWeight: 600, color: 'var(--text-secondary)' }}>Your AI is ready</p>
                    <p style={{ fontSize: '13px', color: 'var(--text-muted)', maxWidth: '220px', lineHeight: 1.5 }}>
                      Ask anything about your day, or type <strong>/</strong> for quick shortcuts
                    </p>
                  </div>
                )}
                {messages.map(msg => (
                  <div
                    key={msg.id}
                    style={{
                      display: 'flex',
                      justifyContent: msg.role === 'user' ? 'flex-end' : 'flex-start',
                    }}
                  >
                    <div style={{
                      maxWidth: '85%',
                      padding: '10px 14px',
                      borderRadius: msg.role === 'user' ? '18px 18px 4px 18px' : '18px 18px 18px 4px',
                      background: msg.role === 'user' ? 'var(--em-500)' : '#f5f5f5',
                      fontSize: '13.5px',
                      lineHeight: 1.6,
                      color: msg.role === 'user' ? '#fff' : 'var(--text-primary)',
                    }}>
                      {msg.isMarkdown ? (
                        <ReactMarkdown
                          components={{
                            h2: ({ children }) => <p style={{ fontWeight: 700, fontSize: '14px', marginBottom: '4px', marginTop: '10px' }}>{children}</p>,
                            p:  ({ children }) => <p style={{ marginBottom: '6px' }}>{children}</p>,
                            ul: ({ children }) => <ul style={{ paddingLeft: '16px', marginBottom: '6px' }}>{children}</ul>,
                            li: ({ children }) => <li style={{ marginBottom: '3px' }}>{children}</li>,
                            strong: ({ children }) => <strong style={{ fontWeight: 700 }}>{children}</strong>,
                          }}
                        >{msg.content}</ReactMarkdown>
                      ) : (
                        msg.content
                      )}
                    </div>
                  </div>
                ))}
                {isPending && (
                  <div style={{ display: 'flex', justifyContent: 'flex-start' }}>
                    <div style={{ padding: '10px 16px', borderRadius: '18px 18px 18px 4px', background: '#f5f5f5', display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <Loader2 size={14} color="var(--em-500)" className="animate-spin" />
                      <span style={{ fontSize: '13px', color: 'var(--text-muted)' }}>Thinking...</span>
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
                        <span style={{ fontSize: '12px', fontWeight: 700, fontFamily: 'monospace', color: 'var(--em-600)', minWidth: '90px' }}>
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
                  placeholder="Ask anything, or type / for shortcuts..."
                  disabled={isPending}
                  style={{
                    flex: 1,
                    padding: '10px 14px',
                    borderRadius: '12px',
                    border: '1.5px solid var(--border)',
                    fontSize: '14px',
                    color: 'var(--text-primary)',
                    background: '#fafafa',
                    outline: 'none',
                    fontFamily: 'inherit',
                  }}
                />
                <button
                  type="submit"
                  disabled={isPending || !input.trim()}
                  style={{
                    width: '40px', height: '40px',
                    borderRadius: '12px',
                    background: input.trim() ? 'var(--em-500)' : 'var(--border)',
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

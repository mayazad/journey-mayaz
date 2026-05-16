'use client'

import { useState, useTransition } from 'react'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Send } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'
import { MayazLogoCentered } from '@/components/MayazLogo'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const [mode, setMode]           = useState<Mode>('signin')
  const [email, setEmail]         = useState('')
  const [password, setPassword]   = useState('')
  const [fullName, setFullName]   = useState('')
  const [username, setUsername]   = useState('')
  const [showPw, setShowPw]       = useState(false)
  const [error, setError]         = useState('')
  const [done, setDone]           = useState(false)
  const [isPending, start]        = useTransition()

  const supabase = createClient()

  function switchMode(m: Mode) { setMode(m); setError('') }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault()
    setError('')

    start(async () => {
      if (mode === 'signin') {
        const { error } = await supabase.auth.signInWithPassword({ email, password })
        if (error) { setError(error.message); return }
        window.location.href = '/home'
      } else {
        // Pass full_name and username into user metadata — the DB trigger picks it up
        const { data, error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { full_name: fullName, username: username.toLowerCase() },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) { setError(error.message); return }
        
        // If "Confirm email" is OFF in Supabase, signUp automatically logs you in and returns a session
        if (data?.session) {
          window.location.href = '/home'
        } else {
          // If "Confirm email" is ON, no session is returned yet
          setDone(true)
        }
      }
    })
  }

  async function handleGoogle() {
    setError('')
    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: { redirectTo: `${window.location.origin}/auth/callback` },
    })
    if (error) setError(error.message)
  }

  return (
    <div className="min-h-screen bg-[var(--bg-base)] flex items-center justify-center px-4">
      <motion.div
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4, ease: 'easeOut' }}
        className="w-full max-w-sm"
      >
        {/* Logo */}
        <div className="flex flex-col items-center mb-10">
          <MayazLogoCentered />
        </div>

        {/* Card */}
        <div className="card !pt-8 !pb-8 !px-8 md:!px-10 shadow-sm border-[var(--border)] rounded-2xl">
          <AnimatePresence mode="wait">

            {/* ── Sign-up confirmation ── */}
            {done ? (
              <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="text-center py-4">
                <div className="w-12 h-12 rounded-full bg-[var(--em-50)] border border-[var(--border-accent)] flex items-center justify-center mx-auto mb-4">
                  <Send size={20} className="text-[var(--em-600)]" />
                </div>
                <p className="font-semibold text-[var(--text-primary)] mb-1">Check your email</p>
                <p className="text-sm text-[var(--text-tertiary)]">
                  We sent a confirmation link to{' '}
                  <span className="font-medium text-[var(--text-secondary)]">{email}</span>.
                  Click it, then sign in.
                </p>
                <button
                  onClick={() => { setDone(false); switchMode('signin') }}
                  className="mt-4 text-xs text-[var(--em-600)] hover:text-[var(--em-700)] underline underline-offset-2 transition-colors"
                >
                  Back to sign in
                </button>
              </motion.div>
            ) : (

              /* ── Main form ── */
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col">

                {/* ── Clean tab switcher ── */}
                <div className="flex items-center justify-center gap-8 mb-8 border-b border-[var(--border)]">
                  {(['signin', 'signup'] as Mode[]).map(m => (
                    <button
                      key={m}
                      onClick={() => switchMode(m)}
                      className="pb-3 text-sm font-semibold transition-colors relative"
                      style={{ color: mode === m ? 'var(--em-600)' : 'var(--text-muted)' }}
                    >
                      {m === 'signin' ? 'Sign In' : 'Create Account'}
                      {mode === m && (
                        <motion.div
                          layoutId="tab-indicator"
                          className="absolute bottom-0 left-0 right-0 h-0.5 bg-[var(--em-500)] rounded-full"
                        />
                      )}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} className="flex flex-col gap-5">

                  {/* Name + Username (signup only) */}
                  <AnimatePresence>
                    {mode === 'signup' && (
                      <motion.div
                        key="signup-fields"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        className="flex flex-col gap-5 overflow-hidden"
                      >
                        <div className="flex flex-col gap-3">
                          <label htmlFor="fullName" className="label text-[11px]">FULL NAME</label>
                          <input
                            id="fullName"
                            type="text"
                            required={mode === 'signup'}
                            value={fullName}
                            onChange={e => setFullName(e.target.value)}
                            placeholder="Md Adnan Hossain Mayaz"
                            className="field-input"
                          />
                        </div>
                        <div className="flex flex-col gap-3">
                          <label htmlFor="username" className="label text-[11px]">USERNAME</label>
                          <div className="relative">
                            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] text-sm font-medium select-none">@</span>
                            <input
                              id="username"
                              type="text"
                              required={mode === 'signup'}
                              value={username}
                              onChange={e => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
                              placeholder="mayaz"
                              className="field-input !pl-7"
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email */}
                  <div className="flex flex-col gap-3">
                    <label htmlFor="email" className="label text-[11px]">EMAIL ADDRESS</label>
                    <input
                      id="email"
                      type="email"
                      required
                      value={email}
                      onChange={e => setEmail(e.target.value)}
                      placeholder="you@example.com"
                      className="field-input"
                    />
                  </div>

                  {/* Password */}
                  <div className="flex flex-col gap-3">
                    <label htmlFor="password" className="label text-[11px]">PASSWORD</label>
                    <div className="relative">
                      <input
                        id="password"
                        type={showPw ? 'text' : 'password'}
                        required
                        minLength={6}
                        value={password}
                        onChange={e => setPassword(e.target.value)}
                        placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                        className="field-input !pr-11"
                      />
                      <button
                        type="button"
                        onClick={() => setShowPw(v => !v)}
                        className="absolute right-3 top-1/2 -translate-y-1/2 text-[var(--text-muted)] hover:text-[var(--em-600)] transition-colors"
                        tabIndex={-1}
                        aria-label={showPw ? 'Hide password' : 'Show password'}
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit"
                    disabled={isPending}
                    className="btn btn-primary w-full justify-center mt-1"
                  >
                    {isPending && (
                      <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    )}
                    {isPending
                      ? (mode === 'signin' ? 'Signing in…' : 'Creating account…')
                      : (mode === 'signin' ? 'Sign In' : 'Create Account')
                    }
                  </button>
                </form>

                {/* Divider */}
                <div className="flex items-center gap-4 my-6">
                  <div className="flex-1 h-px bg-[var(--border)]" />
                  <span className="text-xs text-[var(--text-muted)] uppercase tracking-widest font-semibold">or</span>
                  <div className="flex-1 h-px bg-[var(--border)]" />
                </div>

                {/* Google */}
                <button type="button" onClick={handleGoogle} className="btn btn-ghost w-full justify-center">
                  <svg viewBox="0 0 24 24" width="16" height="16" className="flex-shrink-0">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                {/* Error */}
                {error && (
                  <p className="mt-4 text-xs text-red-600 bg-red-50 border border-red-200 rounded-lg px-3 py-2.5">
                    {error}
                  </p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-center text-sm font-medium text-[var(--text-muted)] mt-8">
          Your data is private and encrypted. Only you can access it.
        </p>
      </motion.div>
    </div>
  )
}

'use client'

import { useState, useTransition } from 'react'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { createClient } from '@/lib/supabase/client'
import { Eye, EyeOff, Send, Mail, Lock, User, AtSign } from 'lucide-react'
import { motion, AnimatePresence } from 'framer-motion'

type Mode = 'signin' | 'signup'

export default function LoginPage() {
  const searchParams  = useSearchParams()
  const [mode, setMode]         = useState<Mode>(
    searchParams.get('mode') === 'signup' ? 'signup' : 'signin'
  )
  const [email, setEmail]       = useState('')
  const [password, setPassword] = useState('')
  const [fullName, setFullName] = useState('')
  const [username, setUsername] = useState('')
  const [showPw, setShowPw]     = useState(false)
  const [error, setError]       = useState('')
  const [done, setDone]         = useState(false)
  const [isPending, start]      = useTransition()

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
        const { data, error } = await supabase.auth.signUp({
          email, password,
          options: {
            data: { full_name: fullName, username: username.toLowerCase() },
            emailRedirectTo: `${window.location.origin}/auth/callback`,
          },
        })
        if (error) { setError(error.message); return }
        if (data?.session) window.location.href = '/home'
        else setDone(true)
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
    <div style={{
      minHeight: '100vh',
      background: 'linear-gradient(160deg, #0a1a14 0%, #0d2318 50%, #0a1a14 100%)',
      display: 'flex', flexDirection: 'column',
      alignItems: 'center', justifyContent: 'center',
      padding: '24px 16px', position: 'relative', overflow: 'hidden',
      fontFamily: 'Inter, system-ui, sans-serif',
    }}>

      {/* Background orb */}
      <div style={{
        position: 'absolute', top: '10%', left: '50%', transform: 'translateX(-50%)',
        width: '500px', height: '500px', borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(16,185,129,0.12) 0%, transparent 65%)',
      }} />
      <div style={{
        position: 'absolute', bottom: '5%', right: '5%',
        width: '300px', height: '300px', borderRadius: '50%', pointerEvents: 'none',
        background: 'radial-gradient(circle, rgba(5,150,105,0.08) 0%, transparent 65%)',
      }} />

      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
        style={{ width: '100%', maxWidth: '400px', position: 'relative', zIndex: 1 }}
      >
        {/* Brand */}
        <Link href="/" style={{ textDecoration: 'none', display: 'block', textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '26px', fontWeight: 900, letterSpacing: '-0.5px', color: '#fff' }}>
            Mayaz<span style={{ color: '#10b981' }}>OS</span>
          </div>
          <div style={{ fontSize: '12px', color: 'rgba(255,255,255,0.35)', marginTop: '4px', fontWeight: 500 }}>
            Personal AI Operating System
          </div>
        </Link>

        {/* Glass card */}
        <div style={{
          background: 'rgba(255,255,255,0.04)',
          border: '1px solid rgba(255,255,255,0.1)',
          borderRadius: '24px',
          padding: '32px 28px',
          backdropFilter: 'blur(20px)',
          WebkitBackdropFilter: 'blur(20px)',
          boxShadow: '0 24px 80px rgba(0,0,0,0.4)',
        }}>
          <AnimatePresence mode="wait">
            {done ? (
              /* ── Email confirmation screen ── */
              <motion.div key="done" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ textAlign: 'center', padding: '12px 0' }}>
                <div style={{
                  width: '52px', height: '52px', borderRadius: '16px',
                  background: 'rgba(16,185,129,0.15)', border: '1px solid rgba(16,185,129,0.3)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px',
                }}>
                  <Send size={22} color="#10b981" />
                </div>
                <p style={{ fontSize: '16px', fontWeight: 700, color: '#fff', marginBottom: '8px' }}>Check your email</p>
                <p style={{ fontSize: '13px', color: 'rgba(255,255,255,0.5)', lineHeight: 1.6 }}>
                  We sent a confirmation link to{' '}
                  <span style={{ color: '#34d399', fontWeight: 600 }}>{email}</span>.
                  Click it, then sign in.
                </p>
                <button
                  onClick={() => { setDone(false); switchMode('signin') }}
                  style={{ marginTop: '20px', fontSize: '13px', color: '#10b981', background: 'none', border: 'none', cursor: 'pointer', fontWeight: 600 }}
                >
                  Back to sign in →
                </button>
              </motion.div>
            ) : (
              <motion.div key="form" initial={{ opacity: 0 }} animate={{ opacity: 1 }} style={{ display: 'flex', flexDirection: 'column' }}>

                {/* Tab switcher */}
                <div style={{
                  display: 'flex', background: 'rgba(255,255,255,0.06)',
                  borderRadius: '12px', padding: '4px', marginBottom: '28px',
                }}>
                  {(['signin', 'signup'] as Mode[]).map(m => (
                    <button
                      key={m}
                      onClick={() => switchMode(m)}
                      style={{
                        flex: 1, padding: '9px', borderRadius: '9px', border: 'none',
                        fontSize: '13px', fontWeight: 700, cursor: 'pointer',
                        transition: 'all 0.2s',
                        background: mode === m ? '#10b981' : 'transparent',
                        color: mode === m ? '#fff' : 'rgba(255,255,255,0.45)',
                      }}
                    >
                      {m === 'signin' ? 'Sign In' : 'Create Account'}
                    </button>
                  ))}
                </div>

                <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>

                  {/* Signup-only fields */}
                  <AnimatePresence>
                    {mode === 'signup' && (
                      <motion.div
                        key="signup-fields"
                        initial={{ opacity: 0, height: 0 }}
                        animate={{ opacity: 1, height: 'auto' }}
                        exit={{ opacity: 0, height: 0 }}
                        style={{ display: 'flex', flexDirection: 'column', gap: '16px', overflow: 'hidden' }}
                      >
                        {/* Full name */}
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Full Name
                          </label>
                          <div style={{ position: 'relative' }}>
                            <User size={15} color="rgba(255,255,255,0.25)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                              id="fullName" type="text" required={mode === 'signup'}
                              value={fullName} onChange={e => setFullName(e.target.value)}
                              placeholder="Adnan Hossain Mayaz"
                              style={inputStyle}
                            />
                          </div>
                        </div>
                        {/* Username */}
                        <div>
                          <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                            Username
                          </label>
                          <div style={{ position: 'relative' }}>
                            <AtSign size={15} color="rgba(255,255,255,0.25)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                            <input
                              id="username" type="text" required={mode === 'signup'}
                              value={username}
                              onChange={e => setUsername(e.target.value.replace(/[^a-z0-9_]/gi, '').toLowerCase())}
                              placeholder="mayaz"
                              style={inputStyle}
                            />
                          </div>
                        </div>
                      </motion.div>
                    )}
                  </AnimatePresence>

                  {/* Email */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Email
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Mail size={15} color="rgba(255,255,255,0.25)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        id="email" type="email" required
                        value={email} onChange={e => setEmail(e.target.value)}
                        placeholder="you@example.com"
                        style={inputStyle}
                      />
                    </div>
                  </div>

                  {/* Password */}
                  <div>
                    <label style={{ display: 'block', fontSize: '11px', fontWeight: 700, color: 'rgba(255,255,255,0.4)', letterSpacing: '0.08em', textTransform: 'uppercase', marginBottom: '8px' }}>
                      Password
                    </label>
                    <div style={{ position: 'relative' }}>
                      <Lock size={15} color="rgba(255,255,255,0.25)" style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)' }} />
                      <input
                        id="password" type={showPw ? 'text' : 'password'}
                        required minLength={6}
                        value={password} onChange={e => setPassword(e.target.value)}
                        placeholder={mode === 'signup' ? 'Min. 6 characters' : '••••••••'}
                        style={{ ...inputStyle, paddingRight: '44px' }}
                      />
                      <button
                        type="button" onClick={() => setShowPw(v => !v)} tabIndex={-1}
                        style={{ position: 'absolute', right: '14px', top: '50%', transform: 'translateY(-50%)', background: 'none', border: 'none', cursor: 'pointer', color: 'rgba(255,255,255,0.35)', padding: '4px' }}
                      >
                        {showPw ? <EyeOff size={16} /> : <Eye size={16} />}
                      </button>
                    </div>
                  </div>

                  {/* Submit */}
                  <button
                    type="submit" disabled={isPending}
                    style={{
                      display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '8px',
                      padding: '13px', borderRadius: '12px', border: 'none',
                      background: isPending ? 'rgba(16,185,129,0.6)' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                      color: '#fff', fontSize: '14px', fontWeight: 700,
                      cursor: isPending ? 'default' : 'pointer',
                      marginTop: '4px',
                      boxShadow: '0 4px 24px rgba(16,185,129,0.3)',
                      transition: 'opacity 0.2s',
                    }}
                  >
                    {isPending && <span style={{ width: '16px', height: '16px', border: '2px solid rgba(255,255,255,0.3)', borderTop: '2px solid #fff', borderRadius: '50%', animation: 'spin 0.7s linear infinite' }} />}
                    {isPending
                      ? (mode === 'signin' ? 'Signing in…' : 'Creating account…')
                      : (mode === 'signin' ? 'Sign In' : 'Create Account')
                    }
                  </button>
                </form>

                {/* Divider */}
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', margin: '20px 0' }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                  <span style={{ fontSize: '11px', color: 'rgba(255,255,255,0.3)', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.1em' }}>or</span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(255,255,255,0.1)' }} />
                </div>

                {/* Google */}
                <button
                  type="button" onClick={handleGoogle}
                  style={{
                    display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '10px',
                    padding: '12px', borderRadius: '12px',
                    background: 'rgba(255,255,255,0.06)',
                    border: '1px solid rgba(255,255,255,0.1)',
                    color: '#fff', fontSize: '14px', fontWeight: 600,
                    cursor: 'pointer', width: '100%', transition: 'background 0.2s',
                  }}
                  onMouseEnter={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.1)')}
                  onMouseLeave={e => (e.currentTarget.style.background = 'rgba(255,255,255,0.06)')}
                >
                  <svg viewBox="0 0 24 24" width="18" height="18" style={{ flexShrink: 0 }}>
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Continue with Google
                </button>

                {/* Error */}
                {error && (
                  <motion.p
                    initial={{ opacity: 0, y: -4 }} animate={{ opacity: 1, y: 0 }}
                    style={{ marginTop: '16px', fontSize: '13px', color: '#f87171', background: 'rgba(239,68,68,0.1)', border: '1px solid rgba(239,68,68,0.2)', borderRadius: '10px', padding: '10px 14px' }}
                  >
                    {error}
                  </motion.p>
                )}
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Privacy note */}
        <p style={{ textAlign: 'center', fontSize: '12px', color: 'rgba(255,255,255,0.25)', marginTop: '20px', lineHeight: 1.5 }}>
          Your data is private and encrypted. Only you can access it.
        </p>
      </motion.div>

      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        input::placeholder { color: rgba(255,255,255,0.2); }
        input { color-scheme: dark; }
      `}</style>
    </div>
  )
}

const inputStyle: React.CSSProperties = {
  width: '100%', padding: '12px 14px 12px 42px',
  borderRadius: '11px', border: '1px solid rgba(255,255,255,0.1)',
  background: 'rgba(255,255,255,0.05)',
  color: '#fff', fontSize: '14px', outline: 'none',
  fontFamily: 'Inter, system-ui, sans-serif',
  boxSizing: 'border-box', transition: 'border-color 0.2s',
}
